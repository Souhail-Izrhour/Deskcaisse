<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenants', function (Blueprint $table) {

            $table->id();

            // ========================
            // Identité publique & contact
            // ========================
            $table->string('public_id', 10)->unique(); // ID public pour API/URL
            $table->string('nom', 150);                 // Nom du café / organisation
            $table->string('email', 150)->nullable();   // Email de contact
            $table->string('telephone', 30)->nullable();
            $table->string('adresse')->nullable();

            // ========================
            // Branding & tickets
            // ========================
            $table->string('logo')->nullable();
            $table->string('ticket_footer_message', 255)->nullable();
            $table->string('currency', 3)->default('MAD');
            $table->string('language', 5)->default('fr'); 
            $table->boolean('show_logo_on_ticket')->default(true);
            $table->enum('ticket_type', ['normal', 'double'])->default('normal');

            // ========================
            // Statut
            // ========================
            $table->boolean('is_active')->default(true);

            // ========================
            // Audit & cycle de vie
            // ========================
            $table->timestamps();
            $table->softDeletes();

            // ========================
            // Index pour filtre rapide
            // ========================
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenants');
    }
};
