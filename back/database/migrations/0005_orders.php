<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();

            // ========================
            // Multi-tenant & utilisateur
            // ========================
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete(); // le café concerné
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete(); // le serveur qui a pris la commande
            $table->foreignId('shift_id')->nullable()->constrained()->nullOnDelete(); // le shift correspondant

            // ========================
            // Informations de la commande
            // ========================
            $table->decimal('totalOrder', 8, 2); // total de la commande
            $table->enum('status', ['en_attente', 'payée', 'annulée'])->default('en_attente'); // statut de la commande
            $table->enum('payment_method', ['espèce', 'carte', 'mobile', 'autre'])->nullable();


            // ========================
            // Audit & soft delete
            // ========================
            $table->timestamps();
            $table->softDeletes(); // permet de masquer la commande sans la supprimer physiquement

            // ========================
            // Index pour recherches rapides
            // ========================
            $table->index(['tenant_id', 'user_id']);
            $table->index(['shift_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
