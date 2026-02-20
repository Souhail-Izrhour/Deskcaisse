<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('users', function (Blueprint $table) {

            $table->id();

            // ========================
            // Multi-tenant
            // ========================
            $table->foreignId('tenant_id')
                  ->nullable()
                  ->constrained()
                  ->cascadeOnDelete();

            // ========================
            // Identité utilisateur
            // ========================
            $table->string('nom', 100);
            $table->string('prenom', 100);
            $table->string('email', 150);

            // ========================
            // Rôle & statut
            // ========================
            $table->string('role', 30)->default('serveur');
            $table->boolean('is_active')->default(true);

            // ========================
            // Sécurité
            // ========================
            $table->string('password');
            $table->rememberToken();

            // ========================
            // Audit & cycle de vie
            // ========================
            $table->timestamps();
            $table->softDeletes();

            // ========================
            // Contraintes
            // ========================
            $table->unique(['tenant_id', 'email']);
            $table->index(['tenant_id', 'role']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('users');
    }
};
