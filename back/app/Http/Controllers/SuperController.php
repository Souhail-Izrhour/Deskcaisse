<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperController extends Controller
{
    public function allTenants()
    {
        $tenants = Tenant::all();
        return response()->json(['success' => true, 'data' => $tenants]);
    }
    public function index(Request $request)
    {
       $users = User::withTrashed()->with(['tenant' => function ($query) {$query->withTrashed();}])->get();
        return response()->json([
            'success' => true,
            'data' => $users
        ]);
    }
    public function SuspendTenant(Request $request, $tenantId)
    {
        // Trouver tous les utilisateurs associés au tenant
        $tenant = Tenant::find($tenantId);
        if (! $tenant) {
            return response()->json([
                'message' => 'Tenant non trouvé.',
            ], 404);
        }
        // Suspendre le tenant
        $tenant->is_active = false;
        $tenant->save();

        return response()->json([
            'message' => 'Le tenant a été suspendu avec succès.',
        ], 200);
    }

    public function reactivateTenant(Request $request, $tenantId)
    {
        // Trouver tous les utilisateurs associés au tenant
        $tenant = Tenant::find($tenantId);
        if (! $tenant) {
            return response()->json([
                'message' => 'Tenant non trouvé.',
            ], 404);
        }
        // Réactiver le tenant
        $tenant->is_active = true;
        $tenant->save();

        return response()->json([
            'message' => 'Le tenant a été réactivé avec succès.',
        ], 200);
    }                   
}
