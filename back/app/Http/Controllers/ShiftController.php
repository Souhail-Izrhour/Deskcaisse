<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Order;
use App\Models\Charge;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;


class ShiftController extends Controller
{
    // ========================
    // Démarrer un shift
    // ========================
    public function start()
    {
        $user = Auth::user();

        $existing = Shift::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('ended_at')
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Un shift est déjà en cours.'], 400);
        }

        $shift = Shift::create([
            'tenant_id' => $user->tenant_id,
            'user_id'   => $user->id,
            'started_at' => now(),
        ]);

        return response()->json([
            'message' => 'Shift démarré.',
            'shift' => $shift
        ], 201);
    }
    //==========================
    // Active shift check
    //==========================
    public function hasActiveShift()
{
    $user = Auth::user();

    $shift = Shift::where('user_id', $user->id)
        ->where('tenant_id', $user->tenant_id)
        ->whereNull('ended_at')
        ->first();

    return response()->json([
        'active' => (bool) $shift,
        'shift_id' => $shift?->id
    ]);
}

    // ========================
    // Terminer un shift
    // ========================
    public function end()
    {
        $user = Auth::user();

        $shift = Shift::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('ended_at')
            ->latest()
            ->first();

        if (!$shift) {
            return response()->json(['message' => 'Aucun shift actif trouvé.'], 404);
        }

        $ventes = Order::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereBetween('created_at', [$shift->started_at, now()])
            ->sum('totalOrder');

        $charges = Charge::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereBetween('created_at', [$shift->started_at, now()])
            ->sum('amount');

        $net = $ventes - $charges;

        $shift->update([
            'ended_at' => now(),
            'ventes'   => $ventes,
            'charges'  => $charges,
            'net'      => $net,
        ]);

        return response()->json([
            'message' => 'Shift terminé.',
            'shift' => $shift
        ]);
    }

    // ========================
    // Stats live du shift en cours
    // ========================
    public function currentStats()
    {
        $user = Auth::user();

        $shift = Shift::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereNull('ended_at')
            ->latest()
            ->first();

        if (!$shift) {
            return response()->json(['message' => 'Aucun shift en cours.'], 404);
        }

        $orders = Order::with('orderItems.product')
            ->where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereBetween('created_at', [$shift->started_at, now()])
            ->get();

        $charges = Charge::where('user_id', $user->id)
            ->where('tenant_id', $user->tenant_id)
            ->whereBetween('created_at', [$shift->started_at, now()])
            ->get();

        $start = Carbon::parse($shift->started_at);
        $diff = $start->diff(now());
        $duration = sprintf('%02d:%02d:%02d', $diff->h + $diff->d * 24, $diff->i, $diff->s);

        return response()->json([
            'shift_id' => $shift->id,
            'started_at' => $shift->started_at,
            'duree' => $duration,
            'nombre_commandes' => $orders->count(),
            'ventes' => $orders->sum('totalOrder'),
            'charges' => $charges->sum('amount'),
            'net' => $orders->sum('totalOrder') - $charges->sum('amount'),
            'user' => $user,
            'commandes' => $orders,
            'charges_details' => $charges
        ]);
    }

    // ========================
    // Liste des shifts (admin)
    // ========================
    public function index()
    {
        $tenantId = Auth::user()->tenant_id;

        $shifts = Shift::with('user')
            ->where('tenant_id', $tenantId)
            ->latest()
            ->get()
            ->map(function ($shift) use ($tenantId) {

                $end = $shift->ended_at ?? now();
                $diff = Carbon::parse($shift->started_at)->diff(Carbon::parse($end));
                $shift->duration = sprintf('%02d:%02d:%02d', $diff->h + $diff->d * 24, $diff->i, $diff->s);

                if (!$shift->ended_at) {
                    $shift->ventes = Order::where('shift_id', $shift->id)->sum('totalOrder');
                    $shift->charges = Charge::where('user_id', $shift->user_id)
                        ->whereBetween('created_at', [$shift->started_at, now()])
                        ->sum('amount');
                    $shift->net = $shift->ventes - $shift->charges;
                }

                return $shift;
            });

        return response()->json(['data' => $shifts]);
    }

    // ========================
    // Détails d’un shift
    // ========================
    public function show(Shift $shift)
    {
        if ($shift->tenant_id !== Auth::user()->tenant_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }

        $shift->load('user', 'orders.orderItems.product', 'charges');

        return response()->json(['data' => $shift]);
    }

    // ========================
    // Impression d’un shift
    // ========================
    public function printShift($id)
    {
        $tenantId = Auth::user()->tenant_id;

        $shift = Shift::with('user', 'orders.orderItems.product')
            ->where('tenant_id', $tenantId)
            ->findOrFail($id);

        $charges = Charge::where('user_id', $shift->user_id)
            ->whereBetween('created_at', [$shift->started_at, $shift->ended_at ?? now()])
            ->sum('amount');

        $connector = new WindowsPrintConnector("ticket-thermique");
        $printer = new Printer($connector);

        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("=== SHIFT #{$shift->id} ===\n");
        $printer->text("Serveur: {$shift->user->prenom}\n");
        $printer->text("----------------------------\n");

        foreach ($shift->orders as $order) {
            foreach ($order->orderItems as $item) {
                $printer->text("{$item->product->name} x{$item->quantity} {$item->totalRow}DH\n");
            }
        }

        $printer->text("----------------------------\n");
        $printer->text("Ventes: {$shift->ventes} DH\n");
        $printer->text("Charges: {$charges} DH\n");
        $printer->text("Net: " . ($shift->ventes - $charges) . " DH\n");

        $printer->cut();
        $printer->close();

        return response()->json(['message' => 'Shift imprimé']);
    }

    // ========================
    // Supprimer un shift
    // ========================
    public function destroy(Shift $shift)
    {
        if ($shift->tenant_id !== Auth::user()->tenant_id) {
            return response()->json(['message' => 'Accès refusé.'], 403);
        }
        if ($shift->ended_at === null) {
            return response()->json(['message' => 'Impossible de supprimer un shift actif.'], 400);
        }

        $shift->delete();

        return response()->json(['message' => 'Shift supprimé']);
    }
}
