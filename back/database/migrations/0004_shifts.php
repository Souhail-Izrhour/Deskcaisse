<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('shifts', function (Blueprint $table) {
            $table->id();

            // ========================
            // Multi-tenant & utilisateur
            // ========================
            $table->foreignId('tenant_id')->constrained()->cascadeOnDelete();
            $table->foreignId('user_id')->nullable()->constrained()->nullOnDelete();

            // ========================
            // Horaires du shift
            // ========================
            $table->timestamp('started_at'); 
            $table->timestamp('ended_at')->nullable(); 

            // ========================
            // Chiffres du shift
            // ========================
            $table->decimal('ventes', 10, 2)->default(0);  
            $table->decimal('charges', 10, 2)->default(0); 
            $table->decimal('net', 10, 2)->default(0);    

            // ========================
            // Audit & soft delete
            // ========================
            $table->timestamps();
            $table->softDeletes(); // permet de masquer un shift sans le supprimer physiquement

            // ========================
            // Index pour recherches rapides
            // ========================
            $table->index(['tenant_id', 'user_id']);
            $table->index(['started_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('shifts');
    }
};
