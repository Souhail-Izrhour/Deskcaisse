<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('categories', function (Blueprint $table) {
            $table->id();

            // Multi-tenant
            $table->foreignId('tenant_id')
                  ->constrained('tenants')
                  ->cascadeOnDelete();

            // Nom et image
            $table->string('name', 100);
            $table->string('image')->nullable();

            // Audit & soft delete
            $table->timestamps();
            $table->softDeletes(); 

            // Contraintes
            $table->unique(['tenant_id', 'name']); 
            $table->index('tenant_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('categories');
    }
};
