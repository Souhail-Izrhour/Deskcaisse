<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class ProductController extends Controller
{
    /**
     * Lister les produits du tenant
     */
    public function index(Request $request)
    {
        $products = Product::where('tenant_id', $request->user()->tenant_id)
            ->with('category')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    /**
     * Créer un produit
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:150',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'nullable|integer|min:0',
            'barcode'     => 'nullable|string|max:50',
            'category_id' => 'required|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Vérification catégorie du tenant
        Category::where('id', $validated['category_id'])
            ->where('tenant_id', $request->user()->tenant_id)
            ->firstOrFail();

         if ($request->hasFile('image')) {
        $tenantId = $request->user()->tenant_id;

         $validated['image'] = $request->file('image')->store(
        "tenants/{$tenantId}/products",
        'public'
      );
     }


        $validated['tenant_id'] = $request->user()->tenant_id;
        $validated['stock'] = $validated['stock'] ?? 0;

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produit créé avec succès.',
            'data' => $product->load('category'),
        ], 201);
    }

    /**
     * Afficher un produit
     * (CheckTenant gère la sécurité)
     */
    public function show(Product $product)
    {
        return response()->json([
            'success' => true,
            'data' => $product->load('category'),
        ]);
    }

    /**
     * Mettre à jour un produit
     */
    public function update(Request $request, Product $product)
    {
        $validated = $request->validate([
            'name'        => 'required|string|max:150',
            'price'       => 'required|numeric|min:0',
            'stock'       => 'nullable|integer|min:0',
            'barcode'     => 'nullable|string|max:50',
            'category_id' => 'required|exists:categories,id',
            'image'       => 'nullable|image|mimes:jpeg,png,jpg,webp|max:2048',
        ]);

        // Vérification catégorie du tenant
        Category::where('id', $validated['category_id'])
            ->where('tenant_id', request()->user()->tenant_id)
            ->firstOrFail();

        if ($request->hasFile('image')) {
        if ($product->image && Storage::disk('public')->exists($product->image)) {
        Storage::disk('public')->delete($product->image);
    }

    $tenantId = $request->user()->tenant_id;

    $validated['image'] = $request->file('image')->store(
        "tenants/{$tenantId}/products",
        'public'
    );
}


        $product->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Produit mis à jour avec succès.',
            'data' => $product->fresh('category'),
        ]);
    }

    /**
     * Supprimer un produit (soft delete)
     */
    public function destroy(Product $product)
    {
        if ($product->image && Storage::disk('public')->exists($product->image)) {
            Storage::disk('public')->delete($product->image);
        }

        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Produit supprimé avec succès.',
        ]);
    }
}
