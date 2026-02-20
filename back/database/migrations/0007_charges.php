<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('charges', function (Blueprint $table) {

            $table->id();

            // ========================
            // Relations principales
            // ========================
            $table->foreignId('tenant_id')
                  ->constrained()
                  ->cascadeOnDelete(); // Restaurant / établissement

            $table->foreignId('user_id')
                  ->nullable()
                  ->constrained()
                  ->nullOnDelete(); // Utilisateur créateur

            $table->foreignId('shift_id')
                  ->constrained()
                  ->cascadeOnDelete(); // Shift (normal ou global)

            // ========================
            // Données métier
            // ========================
            $table->string('description')->nullable(); // Description de la charge
            $table->decimal('amount', 10, 2);          // Montant de la charge

            // ========================
            // Timestamps
            // ========================
            $table->timestamps();
            $table->softDeletes();

            // ========================
            // Index (performance)
            // ========================
            $table->index(['tenant_id', 'shift_id']);
            $table->index(['user_id']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('charges');
    }
};
