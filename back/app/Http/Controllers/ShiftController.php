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

    // ========== IMPRESSION DU RAPPORT FINAL ==========
    try {
        $this->printShiftReportwhileEndingshift($shift);
    } catch (\Exception $e) {
        \Log::error('Erreur impression rapport final: ' . $e->getMessage());
        // On continue même si l'impression échoue
    }

    return response()->json([
        'message' => 'Shift terminé et rapport imprimé.',
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

    /**
     * Ouvrir le tiroir-caisse
     */
    public function openDrawer(Shift $shift)
{    try {
        $connector = new WindowsPrintConnector("ticket-thermique");
        $printer = new Printer($connector); 
        $printer->pulse(); // Envoie une impulsion pour ouvrir le tiroir
        $printer->close();
        return response()->json(['message' => 'Tiroir-caisse ouvert']);
    } catch (\Exception $e) {
        \Log::error('Erreur ouverture tiroir: ' . $e->getMessage());
        return response()->json(['message' => 'Erreur ouverture tiroir', 'error' => $e->getMessage()], 500);
    }
}
    // ========================
    // Impression d’un shift
    // ========================

public function printCurrentShift($id)
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

    // ========== CALCUL DES VENTES PAR PRODUIT AVEC REGROUPEMENT ==========
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
            
            // Additionner les quantités et les totaux
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
        $printer->text(strtoupper($tenant->nom) . "\n\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        
        // Indiquer si le shift est en cours ou terminé
        if ($shift->ended_at === null) {
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text(">>> SHIFT EN COURS <<<\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
        } else {
            $printer->text("RAPPORT DE SHIFT\n");
        }
        $printer->text(str_repeat("=", 48) . "\n\n");

        // ==================== INFORMATIONS SHIFT ====================
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->setEmphasis(true);
        $printer->text("INFORMATIONS GÉNÉRALES\n");
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        
        $printer->text(sprintf("%-15s : #%d\n", "SHIFT", $shift->id));
        $printer->text(sprintf("%-15s : %s %s\n", "SERVEUR", $user->prenom ?? '', $user->nom ?? ''));
        $printer->text(sprintf("%-16s : %s\n", "DÉBUT", Carbon::parse($shift->started_at)->format('d/m/Y H:i')));
        
        if ($shift->ended_at) {
            $printer->text(sprintf("%-15s : %s\n", "FIN", Carbon::parse($shift->ended_at)->format('d/m/Y H:i')));
        } else {
            $printer->text(sprintf("%-15s : %s\n", "FIN", "En cours"));
        }
        
        $printer->text(sprintf("%-16s : %s\n", "DURÉE", $duration));
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
        $printer->setTextSize(2, 1);
        $printer->text("NET PROVIS : " . number_format($net, 2) . " " . $tenant->currency . "\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        $printer->text("\n");

        // ==================== VENTES PAR PRODUIT (REGROUPÉES) ====================
        if (count($produitsVendus) > 0) {
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text("VENTES PAR PRODUIT\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            // En-tête du tableau avec alignement
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-16s %8s %8s %10s\n", "Produit", "Qté", "P.U.", "Total"));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("-", 48) . "\n");
            
            foreach ($produitsVendus as $produit) {
                // Ligne du produit avec alignement parfait
                $printer->text(sprintf(
                    "%-15s %8d %8.2f %10.2f %s\n",
                    substr($produit['name'], 0, 15),
                    $produit['quantite'],
                    $produit['prix_unitaire'],
                    $produit['total'],
                    $tenant->currency
                ));
                
                // Ligne séparatrice sous chaque produit
                $printer->text(str_repeat("-", 48) . "\n");
            }
            
            // Total des ventes produits
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-33s %10.2f %s\n", "TOTAL PRODUITS", $totalVentes, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text("\n");
        }

        // ==================== DÉTAIL DES CHARGES ====================
        if ($charges->count() > 0) {
            $printer->setEmphasis(true);
            $printer->text("DÉTAIL DES CHARGES\n");
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            // En-tête des charges
            $printer->text(sprintf("%-35s %10s\n", "Description", "Montant"));
            $printer->text(str_repeat("-", 48) . "\n");
            
            foreach ($charges as $charge) {
                $printer->text(sprintf(
                    "%-33s %10.2f %s\n",
                    substr($charge->description ?? 'Charge', 0, 33),
                    $charge->amount,
                    $tenant->currency
                ));
                // Ligne séparatrice sous chaque charge
                $printer->text(str_repeat("-", 48) . "\n");
            }
            
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-33s %10.2f %s\n", "TOTAL CHARGES", $totalCharges, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text("\n");
        }

        // ==================== BILAN FINAL DÉTAILLÉ ====================
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text("BILAN PROVISOIRE\n");
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
        
        if ($paiements->isNotEmpty()) {
            $printer->text(str_repeat("-", 48) . "\n");
        }
        
        $printer->text(sprintf("%-25s : %.2f %s\n", "TOTAL VENTES", $totalVentes, $tenant->currency));
        $printer->text(sprintf("%-25s : %.2f %s\n", "TOTAL CHARGES", $totalCharges, $tenant->currency));
        $printer->text(str_repeat("=", 48) . "\n");
        
        // NET final en très grand
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(3, 3);
        
        // Message selon l'état du shift
        if ($shift->ended_at === null) {
            $printer->text("NET PROVISOIRE\n");
        }
        
        // Couleur selon le résultat (si supporté)
        if ($net >= 0) {
            $printer->text(sprintf("%.2f %s\n", $net, $tenant->currency));
        } else {
            $printer->text(sprintf("PERTE: %.2f %s\n", abs($net), $tenant->currency));
        }
        
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text(str_repeat("=", 48) . "\n");
        
        if ($shift->ended_at === null) {
            $printer->text("*** RAPPORT PROVISOIRE - SHIFT EN COURS ***\n");
        } else {
            $printer->text("Fin du shift - " . Carbon::parse($shift->ended_at)->format('d/m/Y H:i:s') . "\n");
        }
        $printer->text("\n");
        // Couper le papier
        $printer->cut();
        $printer->close();

        // Retourner les données en JSON
        return response()->json([
            'message' => $shift->ended_at === null ? 'Rapport provisoire imprimé' : 'Shift imprimé avec succès',
            'shift_id' => $shift->id,
            'shift_status' => $shift->ended_at === null ? 'en_cours' : 'termine',
            'started_at' => $shift->started_at,
            'ended_at' => $shift->ended_at,
            'duree' => $duration,
            'nombre_commandes' => $orders->count(),
            'ventes' => $totalVentes,
            'charges' => $totalCharges,
            'net' => $net,
            'ventes_par_produit' => $produitsVendus,
            'user' => $user,
            'charges_details' => $charges
        ]);

    } catch (\Exception $e) {
        \Log::error('Erreur impression shift: ' . $e->getMessage());
        
        // En cas d'erreur d'impression, retourner quand même les données
        return response()->json([
            'message' => $shift->ended_at === null ? 'Erreur impression rapport provisoire' : 'Erreur impression shift',
            'error' => $e->getMessage(),
            'shift_id' => $shift->id,
            'shift_status' => $shift->ended_at === null ? 'en_cours' : 'termine',
            'started_at' => $shift->started_at,
            'ended_at' => $shift->ended_at,
            'duree' => $duration,
            'nombre_commandes' => $orders->count(),
            'ventes' => $totalVentes,
            'charges' => $totalCharges,
            'net' => $net,
            'ventes_par_produit' => $produitsVendus,
            'user' => $user,
            'charges_details' => $charges
        ], 500);
    }
}
// ========================
// Imprimer un shift spécifique (terminé)
// ========================
public function printShift(Shift $shift)
{
    // Vérifier que l'utilisateur a accès à ce shift
    if ($shift->tenant_id !== Auth::user()->tenant_id) {
        return response()->json(['message' => 'Accès refusé.'], 403);
    }

    // Optionnel : vérifier que le shift est terminé
    if ($shift->ended_at === null) {
        return response()->json(['message' => 'Impossible d\'imprimer un rapport pour un shift en cours. Utilisez "printCurrentShift" à la place.'], 400);
    }

    try {
        $this->printShiftReportwhileEndingshift($shift);
        
        return response()->json([
            'message' => 'Shift imprimé avec succès',
            'shift_id' => $shift->id
        ]);
    } catch (\Exception $e) {
        \Log::error('Erreur impression shift: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur lors de l\'impression',
            'error' => $e->getMessage()
        ], 500);
    }
}
// ========================
// Méthode utilitaire pour imprimer un rapport de shift
// ========================
private function printShiftReportwhileEndingshift(Shift $shift)
{
    $user = $shift->user;
    $tenant = Tenant::find($shift->tenant_id);

    $orders = Order::with('orderItems.product')
        ->where('user_id', $shift->user_id)
        ->where('tenant_id', $shift->tenant_id)
        ->whereBetween('created_at', [$shift->started_at, $shift->ended_at ?? now()])
        ->get();

    $charges = Charge::where('user_id', $shift->user_id)
        ->where('tenant_id', $shift->tenant_id)
        ->whereBetween('created_at', [$shift->started_at, $shift->ended_at ?? now()])
        ->get();

    $start = Carbon::parse($shift->started_at);
    $end = Carbon::parse($shift->ended_at ?? now());
    $diff = $start->diff($end);
    $duration = sprintf('%02d:%02d:%02d', $diff->h + $diff->d * 24, $diff->i, $diff->s);

    // ========== CALCUL DES VENTES PAR PRODUIT AVEC REGROUPEMENT ==========
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
        $printer->text(strtoupper($tenant->nom) . "\n\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text(">>> RAPPORT DE SHIFT <<<\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("=", 48) . "\n\n");

        // ==================== INFORMATIONS SHIFT ====================
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->setEmphasis(true);
        $printer->text("INFORMATIONS GÉNÉRALES\n");
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        
        $printer->text(sprintf("%-15s : #%d\n", "SHIFT", $shift->id));
        $printer->text(sprintf("%-15s : %s %s\n", "SERVEUR", $user->prenom ?? '', $user->nom ?? ''));
        $printer->text(sprintf("%-16s : %s\n", "DÉBUT", Carbon::parse($shift->started_at)->format('d/m/Y H:i')));
        $printer->text(sprintf("%-15s : %s\n", "FIN", Carbon::parse($shift->ended_at)->format('d/m/Y H:i')));
        $printer->text(sprintf("%-16s : %s\n", "DURÉE", $duration));
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
        $printer->setTextSize(2, 1);
        $printer->text("NET : " . number_format($net, 2) . " " . $tenant->currency . "\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        $printer->text("\n");

        // ==================== VENTES PAR PRODUIT ====================
        if (count($produitsVendus) > 0) {
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text("VENTES PAR PRODUIT\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-16s %8s %8s %10s\n", "Produit", "Qté", "P.U.", "Total"));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("-", 48) . "\n");
            
            foreach ($produitsVendus as $produit) {
                $printer->text(sprintf(
                    "%-15s %8d %8.2f %10.2f %s\n",
                    substr($produit['name'], 0, 15),
                    $produit['quantite'],
                    $produit['prix_unitaire'],
                    $produit['total'],
                    $tenant->currency
                ));
                $printer->text(str_repeat("-", 48) . "\n");
            }
            
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-33s %10.2f %s\n", "TOTAL PRODUITS", $totalVentes, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text("\n");
        }

        // ==================== DÉTAIL DES CHARGES ====================
        if ($charges->count() > 0) {
            $printer->setEmphasis(true);
            $printer->text("DÉTAIL DES CHARGES\n");
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            $printer->text(sprintf("%-35s %10s\n", "Description", "Montant"));
            $printer->text(str_repeat("-", 48) . "\n");
            
            foreach ($charges as $charge) {
                $printer->text(sprintf(
                    "%-33s %10.2f %s\n",
                    substr($charge->description ?? 'Charge', 0, 33),
                    $charge->amount,
                    $tenant->currency
                ));
                $printer->text(str_repeat("-", 48) . "\n");
            }
            
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-33s %10.2f %s\n", "TOTAL CHARGES", $totalCharges, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text("\n");
        }

        // ==================== BILAN FINAL ====================
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text("BILAN FINAL\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("=", 48) . "\n");
        
        // Ventes par méthode de paiement
        $paiements = $orders->groupBy('payment_method')->map(function($group) {
            return $group->sum('totalOrder');
        });
        
        foreach ($paiements as $methode => $montant) {
            if ($methode) {
                $printer->text(sprintf("Ventes %-20s : %.2f %s\n", ucfirst($methode), $montant, $tenant->currency));
            }
        }
        
        if ($paiements->isNotEmpty()) {
            $printer->text(str_repeat("-", 48) . "\n");
        }
        
        $printer->text(sprintf("%-25s : %.2f %s\n", "TOTAL VENTES", $totalVentes, $tenant->currency));
        $printer->text(sprintf("%-25s : %.2f %s\n", "TOTAL CHARGES", $totalCharges, $tenant->currency));
        $printer->text(str_repeat("=", 48) . "\n");
        
        // NET final en très grand
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(3, 3);
        
        if ($net >= 0) {
            $printer->text(sprintf("%.2f %s\n", $net, $tenant->currency));
        } else {
            $printer->text(sprintf("PERTE: %.2f %s\n", abs($net), $tenant->currency));
        }
        
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text(str_repeat("=", 48) . "\n");
        
        $printer->text("Rapport du shift - cloture : " . Carbon::parse($shift->ended_at)->format('d/m/Y H:i:s') . "\n");
        $printer->text("\n");
        
        $printer->cut();
        $printer->close();

    } catch (\Exception $e) {
        throw new \Exception('Erreur impression: ' . $e->getMessage());
    }
}
// ========================
// Imprimer un rapport personnalisé (période) avec IDs de shifts sélectionnés
// ========================
public function printPeriodReport(Request $request)
{
    $tenantId = Auth::user()->tenant_id;
    
    // Validation
    $request->validate([
        'start_date' => 'required|date',
        'end_date' => 'required|date|after_or_equal:start_date',
        'user_id' => 'nullable|exists:users,id',
        'shift_ids' => 'sometimes|array', // IDs des shifts sélectionnés
        'shift_ids.*' => 'integer|exists:shifts,id'
    ]);
    
    // Récupérer les shifts - soit par période, soit par IDs spécifiques
    $shiftsQuery = Shift::with('user')
        ->where('tenant_id', $tenantId);
    
    // Si des IDs spécifiques sont fournis, les utiliser
    if ($request->has('shift_ids') && !empty($request->shift_ids)) {
        $shiftsQuery->whereIn('id', $request->shift_ids);
    } else {
        // Sinon, utiliser la période
        $shiftsQuery->whereDate('started_at', '>=', $request->start_date)
                    ->whereDate('started_at', '<=', $request->end_date);
        
        if ($request->has('user_id') && !empty($request->user_id)) {
            $shiftsQuery->where('user_id', $request->user_id);
        }
    }
    
    $shifts = $shiftsQuery->orderBy('started_at')->get();
    
    if ($shifts->isEmpty()) {
        return response()->json(['message' => 'Aucun shift trouvé pour cette période'], 404);
    }
    
    // Récupérer toutes les commandes et charges des shifts sélectionnés
    $shiftIds = $shifts->pluck('id')->toArray();
    
    $orders = Order::with('orderItems.product')
        ->where('tenant_id', $tenantId)
        ->whereIn('shift_id', $shiftIds)
        ->get();
    
    // Récupérer TOUTES les charges détaillées pour chaque shift
    $allCharges = collect(); // Collection pour toutes les charges
    
    foreach ($shifts as $shift) {
        $shiftCharges = Charge::where('user_id', $shift->user_id)
            ->where('tenant_id', $tenantId)
            ->whereBetween('created_at', [$shift->started_at, $shift->ended_at ?? now()])
            ->get()
            ->map(function($charge) use ($shift) {
                // Ajouter les informations du shift à chaque charge
                $charge->shift_id = $shift->id;
                $charge->shift_start = $shift->started_at;
                $charge->user_name = $shift->user->prenom . $shift->user->nom;
                return $charge;
            });
        
        $allCharges = $allCharges->concat($shiftCharges);
    }
    
    // Trier les charges par date (plus récentes d'abord)
    $allCharges = $allCharges->sortByDesc('created_at');
    
    $tenant = Tenant::find($tenantId);
    
    // Calcul des ventes par produit
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
    
    uasort($produitsVendus, function($a, $b) {
        return $b['total'] <=> $a['total'];
    });
    
    try {
        $connector = new WindowsPrintConnector("ticket-thermique");
        $printer = new Printer($connector);
        
        // ==================== EN-TÊTE ====================
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 2);
        $printer->text(strtoupper($tenant->nom) . "\n\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text(">> RAPPORT DE PÉRIODE <<\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("=", 48) . "\n\n");
        
        // ==================== PÉRIODE ====================
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->setEmphasis(true);
        $printer->text("PÉRIODE\n");
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        
        $printer->text(sprintf("%-15s : %s\n", "DU", Carbon::parse($request->start_date)->format('d/m/Y')));
        $printer->text(sprintf("%-15s : %s\n", "AU", Carbon::parse($request->end_date)->format('d/m/Y')));
        
        if ($request->has('user_id') && !empty($request->user_id)) {
            $user = User::find($request->user_id);
            $printer->text(sprintf("%-15s : %s %s\n", "SERVEUR", $user->prenom ?? '', $user->nom ?? ''));
        } else {
            $printer->text(sprintf("%-15s : %s\n", "SERVEUR", "Tous"));
        }
        
        $printer->text(sprintf("%-15s : %d\n", "SHIFTS", $shifts->count()));
        $printer->text("\n");
        
        // ==================== RÉSUMÉ ====================
        $printer->setEmphasis(true);
        $printer->text("RÉSUMÉ\n");
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");
        
        $totalVentes = $orders->sum('totalOrder');
        $totalCharges = $allCharges->sum('amount');
        $net = $totalVentes - $totalCharges;
        
        $printer->text(sprintf("%-25s : %s\n", "Nombre de commandes", $orders->count()));
        $printer->text(sprintf("%-25s : %.2f %s\n", "Total ventes", $totalVentes, $tenant->currency));
        $printer->text(sprintf("%-25s : %.2f %s\n", "Total charges", $totalCharges, $tenant->currency));
        $printer->text(str_repeat("-", 48) . "\n");
        
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 1);
        $printer->text("NET : " . number_format($net, 2) . " " . $tenant->currency . "\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n\n");
        
        // ==================== VENTES PAR PRODUIT ====================
        if (count($produitsVendus) > 0) {
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text("VENTES PAR PRODUIT\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-16s %8s %8s %10s\n", "Produit", "Qté", "P.U.", "Total"));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("-", 48) . "\n");
            
            foreach ($produitsVendus as $produit) {
                $printer->text(sprintf(
                    "%-15s %8d %8.2f %10.2f %s\n",
                    substr($produit['name'], 0, 15),
                    $produit['quantite'],
                    $produit['prix_unitaire'],
                    $produit['total'],
                    $tenant->currency
                ));
                $printer->text(str_repeat("-", 48) . "\n");
            }
            
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-33s %10.2f %s\n", "TOTAL PRODUITS", $totalVentes, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text("\n");
        }
        
        // ==================== VENTES PAR MÉTHODE ====================
        $paiements = $orders->groupBy('payment_method')->map(function($group) {
            return $group->sum('totalOrder');
        });
        
        if ($paiements->isNotEmpty()) {
            $printer->setEmphasis(true);
            $printer->text("VENTES PAR MODE DE PAIEMENT\n");
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            foreach ($paiements as $methode => $montant) {
                if ($methode) {
                    $printer->text(sprintf("Ventes %-20s : %.2f %s\n", ucfirst($methode), $montant, $tenant->currency));
                }
            }
            $printer->text(str_repeat("-", 48) . "\n");
            $printer->text("\n");
        }
        
        // ==================== DÉTAIL COMPLET DES CHARGES ====================
        if ($allCharges->count() > 0) {
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 1);
            $printer->text("DÉTAIL DES CHARGES\n");
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            
            // En-tête du tableau des charges
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-11s %-19s %10s \n", "Date/Heure",  "Description", "Montant"));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("-", 48) . "\n");

    foreach ($allCharges as $charge) {
        $printer->text(sprintf(
            "%-5s %-22s %4.2f   %s\n",
            Carbon::parse($charge->created_at)->format('d/m H:i'),
            substr($charge->description ?? 'Charge', 0, 19),
            $charge->amount,
            $tenant->currency
        ));
        $printer->text("Opérateur : " . ($charge->user_name ?? 'N/A') . "\n");
        $printer->text(str_repeat("-", 48) . "\n");
    }
            
            // Total des charges
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-35s %8.2f %s\n", "TOTAL CHARGES", $totalCharges, $tenant->currency));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("=", 48) . "\n");
            $printer->text("\n");
            
        }
        //  // ==================== LISTE DES SHIFTS SÉLECTIONNÉS ====================
        // $printer->setEmphasis(true);
        // $printer->setTextSize(2, 1);
        // $printer->text("LES SHIFTS SÉLECTIONNÉS\n");
        // $printer->setTextSize(1, 1);
        // $printer->setEmphasis(false);
        // $printer->text(str_repeat("=", 48) . "\n");
        
        // foreach ($shifts as $shift) {
        //     $user = $shift->user;
        //     $shiftOrders = Order::where('shift_id', $shift->id)->sum('totalOrder');
        //     $shiftCharges = Charge::where('user_id', $shift->user_id)
        //         ->whereBetween('created_at', [$shift->started_at, $shift->ended_at ?? $shift->started_at])
        //         ->sum('amount');
        //     $shiftNet = $shiftOrders - $shiftCharges;
            
        //     $printer->setEmphasis(true);
        //     $printer->text(sprintf("Shift #%d - %s %s\n", $shift->id, $user->prenom ?? '', $user->nom ?? ''));
        //     $printer->setEmphasis(false);
        //     $printer->text(sprintf("  %-10s : %s\n", "Début", Carbon::parse($shift->started_at)->format('d/m H:i')));
        //     if ($shift->ended_at) {
        //         $printer->text(sprintf("  %-10s : %s\n", "Fin", Carbon::parse($shift->ended_at)->format('d/m H:i')));
        //     }
        //     $printer->text(sprintf("  %-10s : %.2f %s\n", "Ventes", $shiftOrders, $tenant->currency));
        //     $printer->text(sprintf("  %-10s : %.2f %s\n", "Charges", $shiftCharges, $tenant->currency));
        //     $printer->text(sprintf("  %-10s : %.2f %s\n", "Net", $shiftNet, $tenant->currency));
        //     $printer->text(str_repeat("-", 48) . "\n");
        // }
        
        // ==================== BILAN FINAL ====================
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->setEmphasis(true);
        $printer->setTextSize(3, 3);
        
        if ($net >= 0) {
            $printer->text(sprintf("%.2f %s\n", $net, $tenant->currency));
        } else {
            $printer->text(sprintf("PERTE: %.2f %s\n", abs($net), $tenant->currency));
        }
        
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text(str_repeat("=", 48) . "\n");
        
        $printer->text("Rapport du " . Carbon::now()->format('d/m/Y H:i:s') . "\n");
        $printer->text("\n");
        
        $printer->cut();
        $printer->close();
        
        return response()->json([
            'message' => 'Rapport de période imprimé avec succès',
            'period' => [
                'start_date' => $request->start_date,
                'end_date' => $request->end_date
            ],
            'summary' => [
                'shifts_count' => $shifts->count(),
                'selected_shifts' => $shifts->pluck('id'),
                'orders_count' => $orders->count(),
                'charges_count' => $allCharges->count(),
                'total_ventes' => $totalVentes,
                'total_charges' => $totalCharges,
                'net' => $net
            ]
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Erreur impression rapport période: ' . $e->getMessage());
        return response()->json([
            'message' => 'Erreur lors de l\'impression',
            'error' => $e->getMessage()
        ], 500);
    }
}

// ========================
// Récupérer la liste des utilisateurs pour le filtre
// ========================
public function getShiftUsers()
{
    $tenantId = Auth::user()->tenant_id;
    
    $users = User::where('tenant_id', $tenantId)
        ->whereHas('shifts')
        ->select('id', 'nom', 'prenom')
        ->get();
    
    return response()->json(['data' => $users]);
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
