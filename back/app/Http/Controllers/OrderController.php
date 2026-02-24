<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\Shift;
use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Mike42\Escpos\Printer;
use Mike42\Escpos\PrintConnectors\WindowsPrintConnector;
use Mike42\Escpos\EscposImage;


class OrderController extends Controller
{
    /**
     * Lister les commandes du tenant
     */
    public function index(Request $request)
    {
        $tenantId = $request->user()->tenant_id;

        return Order::with(['user', 'orderItems.product'])
            ->where('tenant_id', $tenantId)
            ->latest()
            ->get();
    }

    /**
     * Créer une commande
     */
    public function store(Request $request)
    {
        $user = $request->user();
        $tenantId = $user->tenant_id;

        $validated = $request->validate([
            'items' => 'required|array|min:1',
            'items.*.id' => 'required|exists:products,id',
            'items.*.quantity' => 'required|integer|min:1',
            'totalOrder' => 'required|numeric',
            'payment_method' => 'nullable|in:espèce,carte,mobile,autre',
        ]);

        DB::beginTransaction();

        try {
            // 🔎 Shift actif
            $activeShift = Shift::where('user_id', $user->id)
                ->where('tenant_id', $tenantId)
                ->whereNull('ended_at')
                ->latest()
                ->first();

            if (!$activeShift) {
                return response()->json([
                    'message' => 'Veuillez démarrer un shift avant d’enregistrer une commande.'
                ], 422);
            }

            // 🧾 Création commande
            $order = Order::create([
                'tenant_id' => $tenantId,
                'user_id' => $user->id,
                'shift_id' => $activeShift->id,
                'totalOrder' => 0,
                'status' => 'payée',
                'payment_method' => $validated['payment_method'] ?? null,
            ]);

            $computedTotal = 0;

            foreach ($validated['items'] as $item) {
                $product = Product::where('id', $item['id'])
                    ->where('tenant_id', $tenantId)
                    ->firstOrFail();

                $unitPrice = $product->price;
                $lineTotal = $unitPrice * $item['quantity'];
                $computedTotal += $lineTotal;

                OrderItem::create([
                    'tenant_id' => $tenantId,
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'unit_price' => $unitPrice,
                    'quantity' => $item['quantity'],
                    'total_row' => $lineTotal,
                ]);
            }

            // 🔐 Sécurité total
            if (abs($computedTotal - $validated['totalOrder']) > 0.01) {
                DB::rollBack();
                return response()->json([
                    'message' => 'Erreur : le total ne correspond pas.'
                ], 422);
            }

            $order->update(['totalOrder' => $computedTotal]);

            DB::commit();

            // 🖨️ Impression ticket (optionnelle)
            $this->printTicket($order);

            return response()->json([
                'message' => 'Commande enregistrée avec succès',
                'order' => $order->load('orderItems.product'),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'message' => 'Erreur lors de la création de la commande',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Afficher une commande
     */
    public function show(Request $request, Order $order)
    {

        return $order->load(['user', 'orderItems.product']);
    }

    /**
     * Modifier une commande
     */
    public function update(Request $request, Order $order)
    {

        $validated = $request->validate([
            'status' => 'required|in:en_attente,payée,annulée',
            'payment_method' => 'nullable|in:espèce,carte,mobile,autre',
        ]);

        $order->update($validated);

        return response()->json($order);
    }

    /**
     * Supprimer une commande (soft delete)
     */
    public function destroy(Request $request, Order $order)
    {

        $order->delete();

        return response()->json([
            'message' => 'Commande supprimée avec succès'
        ]);
    }

    /**
     * Impression ticket
     */
private function printTicket(Order $order)
{
    try {
        $connector = new WindowsPrintConnector("ticket-thermique");
        $printer = new Printer($connector);
        $tenant = Tenant::find($order->tenant_id);

        // ==================== EN-TÊTE ====================
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        // Nom établissement
        $printer->setEmphasis(true);
        $printer->setTextSize(2, 2);
        $printer->text(strtoupper($tenant->nom) . "\n". "\n");
        $printer->setTextSize(1, 1);
        $printer->setEmphasis(false);
        $printer->text($tenant->adresse . "\n");
        $printer->text("Tél: " . $tenant->telephone . "\n");
        $printer->text(date('d/m/Y H:i') . "\n");
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->text(str_repeat("=", 48) . "\n");

        // ==================== ARTICLES ====================
        $printer->setJustification(Printer::JUSTIFY_LEFT);
        $printer->setEmphasis(true);
        $printer->text(sprintf("%-25s %5s %10s\n", "Désignation", "Qté", "Prix"));
        $printer->setEmphasis(false);
        $printer->text(str_repeat("-", 48) . "\n");

        foreach ($order->orderItems as $item) {
            $printer->text(sprintf(
                "%-22s %5d %10.2f %s\n",
                substr($item->product_name, 0, 22),
                $item->quantity,
                $item->total_row,
                $tenant->currency
            ));
        }

        // ==================== TOTAL SUR UNE SEULE LIGNE ====================
            $printer->text(str_repeat("-", 48) . "\n");

            // Centrer le texte
            $printer->setJustification(Printer::JUSTIFY_CENTER);
            $printer->setEmphasis(true);
            $printer->setTextSize(1, 1);
            $printer->text("TOTAL TTC : " . number_format($order->totalOrder, 2) . " ".$tenant->currency."\n");
            $printer->setEmphasis(false);
            $printer->setJustification(Printer::JUSTIFY_LEFT); // Remettre à gauche pour la suite

            $printer->text(str_repeat("-", 48) . "\n");

        // ==================== PAIEMENT & SERVEUR ====================
        $orderNumberInShift = $order->shift->orders()->where('id', '<=', $order->id)->count();
        $printer->text("COMMANDE N°: " . $orderNumberInShift . "\n");        
        $printer->text("Paiement: " . ($order->payment_method ?? "Espèces") . "\n");
        $printer->text("Opérateur: " . (($order->user->prenom ?? '') . ' ' . ($order->user->nom ?? '')) . "\n");        // ==================== PIED DE PAGE ====================
        $printer->text(str_repeat("=", 48) . "\n");
        $printer->setJustification(Printer::JUSTIFY_CENTER);
        $printer->text(strtoupper($tenant->ticket_footer_message) . "\n");
        
        $printer->cut();
        $printer->close();
        if($tenant->ticket_type === 'double') {
            try {
            // ==================== EN-TÊTE CUISINE ====================
            $printer->setJustification(Printer::JUSTIFY_LEFT);
            // Informations de base
            $printer->setEmphasis(true);
            $printer->setTextSize(1, 1);
            // Récupérer le nombre de commandes déjà faites dans ce shift
            $orderNumberInShift = $order->shift->orders()->where('id', '<=', $order->id)->count();
            $printer->text("COMMANDE N°: " . $orderNumberInShift . "\n");
            $printer->setEmphasis(false);
            $printer->text("Date: " . date('d/m/Y H:i') . "\n");
            $printer->text("Serveur: " . (($order->user->prenom ?? '') . ' ' . ($order->user->nom ?? '')) . "\n");
            
            $printer->text(str_repeat("=", 48) . "\n");
            // En-tête pour la cuisine
            $printer->setEmphasis(true);
            $printer->text(sprintf("%-30s %10s\n", "PRODUIT", "QTÉ"));
            $printer->setEmphasis(false);
            $printer->text(str_repeat("-", 48) . "\n");

            // Liste des articles avec le format "Nom x Quantité" (AVEC le x)
            foreach ($order->orderItems as $item) {
            // Nom du produit en grand
            $printer->setEmphasis(true);
            $printer->setTextSize(2, 3);
            $printer->text(substr($item->product_name, 0, 20)); // Nom du produit sans le x
            
            // Espace et x en taille normale
            $printer->setTextSize(1, 1);
            $printer->text(" x ");
            
            // Quantité en taille moyenne (entre grand et petit)
            $printer->setTextSize(2, 2);
            $printer->text($item->quantity . "\n");
            
            // Remise à la taille normale
            $printer->setTextSize(1, 1);
            $printer->setEmphasis(false);
            
            // Ligne de séparation
            $printer->text(str_repeat("-", 48) . "\n");
        }
            $printer->cut();
            $printer->close();

            \Log::info("Ticket cuisine imprimé pour la commande N°" . $order->id);

        } catch (\Exception $e) {
            \Log::error("Erreur impression ticket cuisine: " . $e->getMessage());
        }
            
        }

    } catch (\Exception $e) {
        \Log::error("Erreur impression ticket : " . $e->getMessage());
    }
}
}