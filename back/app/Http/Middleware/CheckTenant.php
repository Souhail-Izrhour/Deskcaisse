<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class CheckTenant
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Non authentifié
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Non authentifié.',
            ], 401);
        }

        // 🔥 BYPASS SUPER ADMIN
        if ($user->role === 'super_admin') {
            return $next($request);
        }

        // Utilisateur sans tenant
        if (!$user->tenant_id) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé : tenant non valide.',
            ], 403);
        }
           // Vérifier que le tenant est actif
        $tenant = $user->tenant;
        if (!$tenant || !$tenant->is_active) {
            return response()->json([
                'success' => false,
                  'message' => "L'accès à votre compte est temporairement suspendu car votre abonnement a expiré. Merci de contacter notre service client au " . env('TENANT_SUPPORT_PHONE'),
            ], 403);
        }

        // Vérification automatique des ressources (Route Model Binding)
        foreach ($request->route()->parameters() as $param) {
            if (is_object($param) && isset($param->tenant_id)) {
                if ($param->tenant_id !== $user->tenant_id) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Accès interdit : ressource hors tenant.',
                    ], 403);
                }
            }
        }

        return $next($request);
    }
}

