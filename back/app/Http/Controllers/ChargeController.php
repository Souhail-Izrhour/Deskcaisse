<?php

namespace App\Http\Controllers;

use App\Models\Charge;
use App\Models\Shift;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class ChargeController extends Controller
{
    // ✅ Lister toutes les charges
    public function index()
    {
        $charges = Charge::with(['user', 'shift'])
            ->where('tenant_id', Auth::user()->tenant_id)
            ->latest()
            ->get();

        return response()->json(['data' => $charges]);
    }

    // ✅ Afficher une charge spécifique
    public function show(Charge $charge)
    {
        $charge->load(['user', 'shift']);
        return response()->json(['data' => $charge]);
    }

    // ✅ Créer une nouvelle charge liée au shift actif
    public function store(Request $request)
    {
        $user = Auth::user();

        $request->validate([
            'amount' => 'required|numeric|min:0',
            'description' => 'nullable|string|max:255',
        ]);

        $activeShift = Shift::where('user_id', $user->id)
            ->whereNull('ended_at')
            ->latest()
            ->first();

            if (!$activeShift) {
            return response()->json([
                'message' => 'Veuillez démarrer un shift avant d’ajouter une charge.'
            ], 422);
        }

        DB::transaction(function () use ($request, $user, $activeShift, &$charge) {

            $charge = Charge::create([
                'user_id' => $user->id,
                'shift_id' => $activeShift->id,
                'tenant_id' => $user->tenant_id,
                'description' => $request->description,
                'amount' => $request->amount,
            ]);

        });

        return response()->json([
            'message' => 'Charge créée avec succès.',
            'charge' => $charge
        ], 201);
    }

    // ✅ Mettre à jour une charge
    public function update(Request $request, Charge $charge)
    {
        $request->validate([
            'amount' => 'nullable|numeric|min:0',
            'description' => 'nullable|string|max:255',
        ]);

        DB::transaction(function () use ($request, $charge) {
            $charge->update($request->only('amount', 'description'));
        });

        return response()->json([
            'message' => 'Charge mise à jour.',
            'charge' => $charge
        ]);
    }

    // ✅ Supprimer une charge
    public function destroy(Charge $charge)
    {
        DB::transaction(function () use ($charge) {
            $shift = $charge->shift;
            $charge->delete();
        });

        return response()->json(['message' => 'Charge supprimée avec succès.']);
    }

    // ✅ Charges par utilisateur
    public function chargesByUser($userId)
    {
        $charges = Charge::where('user_id', $userId)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->with('shift')
            ->get();

        return response()->json(['data' => $charges]);
    }

    // ✅ Charges par shift
    public function chargesByShift($shiftId)
    {
        $charges = Charge::where('shift_id', $shiftId)
            ->where('tenant_id', Auth::user()->tenant_id)
            ->with('user')
            ->get();

        return response()->json(['data' => $charges]);
    }

  
}
