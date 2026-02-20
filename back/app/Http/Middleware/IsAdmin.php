<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsAdmin
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        // Sécurité : non authentifié
        if (! $user) {
            return response()->json([
                'message' => 'Non authentifié.',
            ], 401);
        }

        // Vérification rôle
        if (! in_array($user->role, ['admin', 'super_admin'])) {
            return response()->json([
                'message' => 'Accès réservé aux administrateurs.',
            ], 403);
        }

        return $next($request);
    }
}
