<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class IsSuper
{
    public function handle(Request $request, Closure $next)
    {
        $user = $request->user();

        if (! $user) {
            return response()->json([
                'message' => 'Non authentifié.',
            ], 401);
        }

        if ($user->role !== 'super_admin') {
            return response()->json([
                'message' => 'Accès réservé au Souhail le Super.',
            ], 403);
        }

        return $next($request);
    }
}
