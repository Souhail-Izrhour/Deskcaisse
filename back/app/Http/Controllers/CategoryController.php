<?php


namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return response()->json([
            'success' => true,
            'data' => Category::where('tenant_id', $request->user()->tenant_id)
            ->with('products')
            ->withCount('products')
            ->get(),
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100|unique:categories,name,NULL,id,tenant_id,' . $request->user()->tenant_id,
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
         $tenantId = $request->user()->tenant_id;

         $validated['image'] = $request->file('image')->store(
        "tenants/{$tenantId}/categories",
        'public'
    );
    }


        $validated['tenant_id'] = $request->user()->tenant_id;

        $category = Category::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Catégorie créée avec succès.',
            'data' => $category,
        ], 201);
    }

    public function show(Category $category)
    {
        return response()->json([
            'success' => true,
            'data' => $category,
        ]);
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name'  => 'required|string|max:100|unique:categories,name,' . $category->id . ',id,tenant_id,' . $request->user()->tenant_id,
            'image' => 'nullable|image|max:2048',
        ]);

        if ($request->hasFile('image')) {
       if ($category->image) {
        Storage::disk('public')->delete($category->image);
        }

       $tenantId = $request->user()->tenant_id;

         $validated['image'] = $request->file('image')->store(
        "tenants/{$tenantId}/categories",
        'public'
    );
   }


        $category->update($validated);

        return response()->json([
            'success' => true,
            'message' => 'Catégorie mise à jour avec succès.',
            'data' => $category,
        ]);
    }

    public function destroy(Category $category)
{
    if ($category->image) {
        Storage::disk('public')->delete($category->image);
    }

    $category->delete();

    return response()->json([
        'success' => true,
        'message' => 'Catégorie supprimée avec succès.',
    ]);
}
}