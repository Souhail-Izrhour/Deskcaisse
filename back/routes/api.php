<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\TenantController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CategoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\FournisseurController;
use App\Http\Controllers\ShiftController;
use App\Http\Controllers\OrderController;
use App\Http\Controllers\ChargeController;
use App\Http\Controllers\TicketSettingsController;
use App\Http\Controllers\SuperController;
use App\Http\Middleware\IsAdmin;
use App\Http\Middleware\CheckTenant;
use App\Http\Middleware\IsSuper;











   // Route d'authentification
   Route::post('/login', [AuthController::class, 'login']);

// Middleware Sanctum obligatoire pour les routes protégées
Route::middleware('auth:sanctum')->group(function () {

 Route::middleware(IsSuper::class)->group(function () {
    // -----------------
    // Routes Super Admin
          Route::post('/tenants', [TenantController::class, 'store']);
          Route::patch('/tenants/{tenantId}/suspend', [SuperController::class, 'SuspendTenant']);
          Route::patch('/tenants/{tenantId}/reactivate', [SuperController::class, 'reactivateTenant']);
});


    // Utilisateur connecté
           Route::get('/me', [AuthController::class, 'getCurrentUser']);
           Route::post('/logout', [AuthController::class, 'logout']);
    // -----------------

    // Routes protégées par le middleware CheckTenant
    
   Route::middleware(CheckTenant::class)->group(function () {

    // -----------------
    // Routes Commandes
            Route::post('/orders', [OrderController::class, 'store']);       // Créer une commande
     
    // -----------------
    // Routes Charges
            Route::post('/charges', [ChargeController::class, 'store']);       // Créer une charge
            Route::put('/charges/{charge}', [ChargeController::class, 'update']);    // Mettre à jour une charge
            Route::delete('/charges/{charge}', [ChargeController::class, 'destroy']); // Supprimer une charge

    // -----------------
    // Routes Shift
            Route::post('/shifts/start', [ShiftController::class, 'start']); // Démarrer un shift
            Route::post('/shifts/end', [ShiftController::class, 'end']);   // Terminer un shift
            Route::get('/shifts/currentStats', [ShiftController::class, 'currentStats']); // Obtenir le shift actif
            Route::get('/shifts/hasActiveShift', [ShiftController::class, 'hasActiveShift']); // Vérifier s'il y a un shift actif

    // -----------------
    // Catégories
            Route::get('/categories', [CategoryController::class, 'index']);      // Lister toutes les catégories
            Route::get('/categories/{category}', [CategoryController::class, 'show']); // Afficher une catégorie

    // -----------------
    // Produits
            Route::get('/products', [ProductController::class, 'index']);         // Lister tous les produits
            Route::get('/products/{product}', [ProductController::class, 'show']);  // Afficher un produit

    // -----------------
    // Fournisseurs
            Route::get('/fournisseurs', [FournisseurController::class, 'index']);         // Lister tous les fournisseurs
            Route::get('/fournisseurs/{fournisseur}', [FournisseurController::class, 'show']);  // Afficher un fournisseur
    
    // -----------------
    // Routes admin uniquement

 Route::middleware(IsAdmin::class)->group(function () {

            Route::post('/users', [AuthController::class, 'createUser']);       // Créer un utilisateur
            Route::get('/users', [AuthController::class, 'index']);            // Lister les utilisateurs
            Route::get('/users/{user}', [AuthController::class, 'show']);      // Afficher un utilisateur
            Route::put('/users/{user}', [AuthController::class, 'update']);    // Mettre à jour un utilisateur
            Route::patch('/users/{user}/deactivate', [AuthController::class, 'deactivate']); // Désactiver
            Route::patch('/users/{user}/activate', [AuthController::class, 'activate']); // Activer
            Route::delete('/users/{user}', [AuthController::class, 'destroy']);             // Supprimer définitivement

    //-----------------
    // Orders
            Route::get('/orders', [OrderController::class, 'index']);        // Lister les commandes
            Route::get('/orders/{order}', [OrderController::class, 'show']);         // Afficher une commande
            Route::put('/orders/{order}', [OrderController::class, 'update']);    // Mettre à jour une commande
            Route::delete('/orders/{order}', [OrderController::class, 'destroy']); // Supprimer une commande

    //-----------------
    // Charges
            Route::get('/charges', [ChargeController::class, 'index']);        // Lister les charges
            Route::get('/charges/{charge}', [ChargeController::class, 'show']);         // Afficher une charge

    //------------------
    // Shifts 
            Route::get('/shifts', [ShiftController::class, 'index']);           // Lister tous les shifts
            Route::get('/shifts/{shift}', [ShiftController::class, 'show']);        // Afficher un shift spécifique
            Route::Delete('/shifts/{shift}', [ShiftController::class, 'destroy']);    // Supprimer un shift     
    // -----------------
    // Catégories
            Route::post('/categories', [CategoryController::class, 'store']);     // Créer une nouvelle catégorie
            Route::put('/categories/{category}', [CategoryController::class, 'update']); // Mettre à jour une catégorie
            Route::delete('/categories/{category}', [CategoryController::class, 'destroy']); // Supprimer une catégorie

    // -----------------
    // Produits
          Route::post('/products', [ProductController::class, 'store']);        // Créer un nouveau produit  Route::delete('/products/{product}', [ProductController::class, 'destroy']); // Supprimer un produit
          Route::put('/products/{product}', [ProductController::class, 'update']); // Mettre à jour un produit
          Route::delete('/products/{product}', [ProductController::class, 'destroy']); // Supprimer un produit

    // -----------------
    // Fournisseurs
            Route::post('/fournisseurs', [FournisseurController::class, 'store']);        // Créer un nouveau fournisseur
            Route::put('/fournisseurs/{fournisseur}', [FournisseurController::class, 'update']); // Mettre à jour un fournisseur
            Route::delete('/fournisseurs/{fournisseur}', [FournisseurController::class, 'destroy']); // Supprimer un fournisseur

    // -----------------
    // Paramètres des tickets
            Route::post('/ticket-settings/upload-logo', [TicketSettingsController::class, 'uploadLogo']); // Upload du logo
            Route::put('/ticket-settings/footer', [TicketSettingsController::class, 'updateFooter']); // Mettre à jour le footer
            Route::put('/ticket-settings/logo-toggle', [TicketSettingsController::class, 'toggleLogo']); // Activer/désactiver le logo
            Route::put('/ticket-settings/type', [TicketSettingsController::class, 'updateType']); // Changer le type de ticket
            Route::get('/ticket-settings', [TicketSettingsController::class, 'show']); // Voir les paramètres actuels
});
    });
});


