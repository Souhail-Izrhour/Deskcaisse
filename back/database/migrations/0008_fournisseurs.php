<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fournisseurs', function (Blueprint $table) {
            $table->id();

            // ========================
            // Multi-tenant
            // ========================
            $table->foreignId('tenant_id')
                  ->constrained()
                  ->cascadeOnDelete();

            // ========================
            // Informations fournisseur
            // ========================
            $table->string('name');
            $table->string('email')->nullable();
            $table->string('phone')->nullable();
            $table->string('address')->nullable();

            // ========================
            // Audit & historique
            // ========================
            $table->timestamps();
            $table->softDeletes(); // pour garder l’historique des fournisseurs supprimés

            // ========================
            // Index & contraintes
            // ========================
            $table->index(['tenant_id', 'name']);
            $table->index(['tenant_id', 'email']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fournisseurs');
    }
};
