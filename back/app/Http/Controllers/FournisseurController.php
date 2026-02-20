<?php

namespace App\Http\Controllers;

use App\Models\Fournisseur;
use Illuminate\Http\Request;

class FournisseurController extends Controller
{
    /**
     * Lister tous les fournisseurs du tenant
     */
    public function index(Request $request)
    {
        $fournisseurs = Fournisseur::where('tenant_id', $request->user()->tenant_id)->get();

        return response()->json([
            'success' => true,
            'data' => $fournisseurs,
        ]);
    }

    /**
     * Créer un fournisseur
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'    => 'required|string|max:255',
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
        ]);

        $validated['tenant_id'] = $request->user()->tenant_id;

        $fournisseur = Fournisseur::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur créé avec succès.',
            'data' => $fournisseur,
        ], 201);
    }

    /**
     * Afficher un fournisseur
     * (CheckTenant gère la sécurité)
     */
    public function show(Fournisseur $fournisseur)
    {
        return response()->json([
            'success' => true,
            'data' => $fournisseur,
        ]);
    }

    /**
     * Mettre à jour un fournisseur
     */
    public function update(Request $request, Fournisseur $fournisseur)
    {
        $validated = $request->validate([
            'name'    => 'sometimes|required|string|max:255',
            'email'   => 'nullable|email|max:255',
            'phone'   => 'nullable|string|max:50',
            'address' => 'nullable|string|max:255',
        ]);

        $fournisseur->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur mis à jour avec succès.',
            'data' => $fournisseur,
        ]);
    }

    /**
     * Supprimer un fournisseur (soft delete)
     */
    public function destroy(Fournisseur $fournisseur)
    {
        $fournisseur->delete();

        return response()->json([
            'success' => true,
            'message' => 'Fournisseur supprimé avec succès.',
        ]);
    }
}
