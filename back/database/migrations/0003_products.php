<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();

            // ========================
            // Multi-tenant
            // ========================
            $table->foreignId('tenant_id')
                  ->constrained('tenants')
                  ->cascadeOnDelete();

            // ========================
            // Catégorie obligatoire
            // ========================
            $table->foreignId('category_id')
                  ->constrained('categories')
                  ->cascadeOnDelete();

            // ========================
            // Informations produit
            // ========================
            $table->string('name', 150);
            $table->string('image')->nullable();
            $table->decimal('price', 8, 2);
            $table->integer('stock')->default(0); // quantité en stock
            $table->string('barcode', 50)->nullable(); // code-barres du produit


            // ========================
            // Audit & soft delete
            // ========================
            $table->timestamps();
            $table->softDeletes(); // permet de supprimer/restaurer le produit individuellement

            // ========================
            // Contraintes & index
            // ========================
            $table->unique(['tenant_id', 'name']); // unicité par café
            $table->unique(['tenant_id', 'barcode']); // unicité par café

            $table->index(['tenant_id', 'category_id']); // recherche rapide par café/catégorie
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};
