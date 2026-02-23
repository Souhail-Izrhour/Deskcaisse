<?php

namespace App\Http\Controllers;

use App\Models\Shift;
use App\Models\Order;
use App\Models\Charge;
use App\Models\User;
use App\Models\Tenant;
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
    
    // Récupérer les infos du tenant
    $tenant = Tenant::find($user->tenant_id);

    // ========== CALCUL DES VENTES PAR PRODUIT ==========
    $produitsVendus = [];
    foreach ($orders as $order) {
        foreach ($order->orderItems as $item) {
            $productId = $item->product_id;
            $productName = $item->product->name ?? $item->product_name;
            
            if (!isset($produitsVendus[$productId])) {
                $produitsVendus[$productId] = [
                    'name' => $productName,
                    'quantite' => 0,
                    'total' => 0,
                    'prix_unitaire' => $item->unit_price
                ];
            }
            
            $produitsVendus[$productId]['quantite'] += $item->quantity;
            $produitsVendus[$productId]['total'] += $item->total_row;
        }
    }
    
    // Trier par total de ventes (du plus élevé au plus bas)
    uasort($produitsVendus, function($a, $b) {
        return $b['total'] <=> $a['total'];
    });

    try {
        $connector = new WindowsPrintConnector("ticket-thermique");
        $printer = new Printer($connector);

        // ==================== EN-TÊTE ====================
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        
        // Nom établissement en grand
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 2);
        $printer->text(strtoupper($tenant->nom) . "\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        
        $printer->text("RAPPORT DE SHIFT\n");
        $printer->text(str_repeat("=", 48) . "\n\n");

        // ==================== INFORMATIONS SHIFT ====================
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->setEmphasis(true);
        $printer->text("INFORMATIONS GÉNÉRALES\n");
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        
        $printer->text(sprintf("%-15s : #%d\n", "SHIFT", $shift->id));
        $printer->text(sprintf("%-15s : %s %s\n", "SERVEUR", $user->prenom ?? '', $user->nom ?? ''));
        $printer->text(sprintf("%-15s : %s\n", "DÉBUT", Carbon::parse($shift->started_at)->format('d/m/Y H:i')));
        $printer->text(sprintf("%-15s : %s\n", "FIN", now()->format('d/m/Y H:i')));
        $printer->text(sprintf("%-15s : %s\n", "DURÉE", $duration));
        $printer->text("\n");

        // ==================== RÉSUMÉ VENTES ====================
        $printer->setEmphasis(true);
        $printer->text("RÉSUMÉ DES VENTES\n");
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        
        $totalVentes = $orders->sum('totalOrder');
        $totalCharges = $charges->sum('amount');
        $net = $totalVentes - $totalCharges;
        
        $printer->text(sprintf("%-25s : %s\n", "Nombre de commandes", $orders->count()));
        $printer->text(sprintf("%-25s : %.2f %s\n", "Total ventes", $totalVentes, $tenant->currency));
        $printer->text(sprintf("%-25s : %.2f %s\n", "Total charges", $totalCharges, $tenant->currency));
        $printer->text(str_repeat("-", 48) . "\n");
        
        // NET en gras et plus grand
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 2);
        $printer->text(sprintf("%-25s : %.2f %s\n", "NET", $net, $tenant->currency));
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text("\n");

        // ==================== VENTES PAR PRODUIT ====================
        if (count($produitsVendus) > 0) {
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text("VENTES PAR PRODUIT\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            // En-tête du tableau
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-22s %8s %8s %10s\n", "Produit", "Qté", "P.U.", "Total"));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("-", 48) . "\n");
            
            foreach ($produitsVendus as $produit) {
                $printer->text(sprintf(
                    "%-22s %8d %8.2f %10.2f %s\n",
                    substr($produit['name'], 0, 22),
                    $produit['quantite'],
                    $produit['prix_unitaire'],
                    $produit['total'],
                    $tenant->currency
                ));
            }
            
            // Total des ventes produits
            $printer->text(str_repeat("-", 48) . "\n");
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-30s %10.2f %s\n", "TOTAL PRODUITS", $totalVentes, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text("\n");
        }

        // ==================== DÉTAIL DES COMMANDES ====================
        if ($orders->count() > 0) {
            $printer->setEmphasis(true);
            $printer->text("DÉTAIL DES COMMANDES\n");
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            foreach ($orders as $index => $order) {
                $printer->setEmphasis(true);
                $printer->text(sprintf("Commande #%d\n", $index + 1));
                $printer->setEmphasis(false);
                $printer->text(sprintf("Heure: %s\n", Carbon::parse($order->created_at)->format('H:i')));
                $printer->text(str_repeat("-", 48) . "\n");
                
                // En-tête des articles
                $printer->text(sprintf("%-25s %5s %10s\n", "Article", "Qté", "Total"));
                $printer->text(str_repeat("-", 48) . "\n");
                
                foreach ($order->orderItems as $item) {
                    $printer->text(sprintf(
                        "%-25s %5d %10.2f %s\n",
                        substr($item->product->name ?? $item->product_name, 0, 25),
                        $item->quantity,
                        $item->total_row,
                        $tenant->currency
                    ));
                }
                
                $printer->text(str_repeat("-", 48) . "\n");
                $printer->setEmphasis(true);
                $printer->text(sprintf("%-30s %10.2f %s\n", "TOTAL", $order->totalOrder, $tenant->currency));
                $printer->setEmphasis(false);
                $printer->text("\n");
            }
        }

        // ==================== DÉTAIL DES CHARGES ====================
        if ($charges->count() > 0) {
            $printer->setEmphasis(true);
            $printer->text("DÉTAIL DES CHARGES\n");
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            foreach ($charges as $charge) {
                $printer->text(sprintf(
                    "%-35s %10.2f %s\n",
                    substr($charge->description ?? 'Charge', 0, 35),
                    $charge->amount,
                    $tenant->currency
                ));
            }
            $printer->text("\n");
        }

        // ==================== BILAN FINAL DÉTAILLÉ ====================
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text("BILAN FINAL\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("=", 48) . "\n");
        
        // Tableau des ventes par méthode de paiement
        $paiements = $orders->groupBy('payment_method')->map(function($group) {
            return $group->sum('totalOrder');
        });
        
        foreach ($paiements as $methode => $montant) {
            if ($methode) {
                $printer->text(sprintf("Ventes %-20s : %.2f %s\n", ucfirst($methode), $montant, $tenant->currency));
            }
        }
        
        $printer->text(str_repeat("-", 48) . "\n");
        $printer->text(sprintf("%-25s : %.2f %s\n", "TOTAL VENTES", $totalVentes, $tenant->currency));
        $printer->text(sprintf("%-25s : %.2f %s\n", "TOTAL CHARGES", $totalCharges, $tenant->currency));
        $printer->text(str_repeat("=", 48) . "\n");
        
        // NET final en très grand
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(3, 3);
        
        // Couleur selon le résultat (si supporté)
        if ($net >= 0) {
            $printer->text(sprintf("NET: %.2f %s\n", $net, $tenant->currency));
        } else {
            $printer->text(sprintf("PERTE: %.2f %s\n", abs($net), $tenant->currency));
        }
        
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text(str_repeat("=", 48) . "\n\n");

        // ==================== STATISTIQUES SUPPLÉMENTAIRES ====================
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("STATISTIQUES\n");
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text(str_repeat("-", 48) . "\n");
        
        // Produit le plus vendu
        if (count($produitsVendus) > 0) {
            $topProduit = reset($produitsVendus);
            $printer->text(sprintf("Top produit : %s (%d vendus)\n", 
                substr($topProduit['name'], 0, 30), 
                $topProduit['quantite']
            ));
        }
        
        // Panier moyen
        $panierMoyen = $orders->count() > 0 ? $totalVentes / $orders->count() : 0;
        $printer->text(sprintf("Panier moyen : %.2f %s\n", $panierMoyen, $tenant->currency));
        
        $printer->text("\n");

        // ==================== PIED DE PAGE ====================
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text("Fin du shift - " . now()->format('d/m/Y H:i:s') . "\n");
        $printer->text($tenant->ticket_footer_message . "\n");
        $printer->text("\n\n\n");

        // Couper le papier
        $printer->cut();
        
        
        
        $printer->close();

        // Retourner les données en JSON
        return response()->json([
            'message' => 'Shift imprimé avec succès',
            'shift_id' => $shift->id,
            'started_at' => $shift->started_at,
            'duree' => $duration,
            'nombre_commandes' => $orders->count(),
            'ventes' => $totalVentes,
            'charges' => $totalCharges,
            'net' => $net,
            'ventes_par_produit' => $produitsVendus,
            'user' => $user,
            'commandes' => $orders,
            'charges_details' => $charges
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur impression shift: ' . $e->getMessage());
        
        // En cas d'erreur d'impression, retourner quand même les données
        return response()->json([
            'message' => 'Shift terminé mais erreur lors de l\'impression',
            'error' => $e->getMessage(),
            'shift_id' => $shift->id,
            'started_at' => $shift->started_at,
            'duree' => $duration,
            'nombre_commandes' => $orders->count(),
            'ventes' => $totalVentes,
            'charges' => $totalCharges,
            'net' => $net,
            'ventes_par_produit' => $produitsVendus,
            'user' => $user,
            'commandes' => $orders,
            'charges_details' => $charges
        ], 500);
    }
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
