<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('order_items', function (Blueprint $table) {
            $table->id();

            // ========================
            // Multi-tenant
            // ========================
            $table->foreignId('tenant_id')
                  ->constrained()
                  ->cascadeOnDelete(); // cascade si le tenant est supprimé

            // ========================
            // Clé étrangère vers la commande
            // ========================
            $table->foreignId('order_id')
                  ->constrained()
                  ->cascadeOnDelete(); // cascade si la commande est supprimée

            // ========================
            // Clé étrangère vers le produit
            // ========================
            $table->foreignId('product_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete(); // met à null si le produit est supprimé

            // Nom du produit (stocké pour affichage et historique)
            $table->string('product_name');

            // Quantité et prix
            $table->decimal('unit_price', 8, 2);
            $table->unsignedInteger('quantity')->default(1);
            $table->decimal('total_row', 8, 2);

            // ========================
            // Audit & soft delete
            // ========================
            $table->timestamps();
            $table->softDeletes();

            // ========================
            // Index pour recherche rapide
            // ========================
            $table->index(['tenant_id', 'order_id']);
            $table->index(['tenant_id', 'product_id']);
            $table->index(['tenant_id', 'product_name']);


        });
    }

    public function down(): void
    {
        Schema::dropIfExists('order_items');
    }
};
