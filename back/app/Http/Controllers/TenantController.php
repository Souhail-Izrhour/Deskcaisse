<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class TenantController extends Controller
{
    /**
     * Créer un nouveau tenant avec son admin associé.
     */
    public function store(Request $request)
    {
        // Validation des données
        $request->validate([
            'tenant_nom'       => 'required|string|max:150',
            'tenant_email'     => 'nullable|email|unique:tenants,email',
            'tenant_telephone' => 'nullable|string|max:30',
            'tenant_adresse'   => 'nullable|string|max:255',

            'admin_nom'        => 'required|string|max:100',
            'admin_prenom'     => 'required|string|max:100',
            'admin_email'      => 'required|email|unique:users,email',
            'admin_password'   => 'required|confirmed|min:6',
        ]);

        // Générer un ID public unique
        $tenant_public_id = Str::upper(Str::random(6));

        // Créer le tenant
        $tenant = Tenant::create([
            'public_id'             => $tenant_public_id,
            'nom'                   => $request->tenant_nom,
            'email'                 => $request->tenant_email,
            'telephone'             => $request->tenant_telephone,
            'adresse'               => $request->tenant_adresse,
            'logo'                  => null,
            'ticket_footer_message' => null,
            'currency'              => 'MAD',
            'language'              => 'fr',
            'show_logo_on_ticket'   => true,
            'ticket_type'           => 'normal',
            'is_active'             => true,
        ]);

        // Créer l’admin du tenant
        $admin = User::create([
            'tenant_id' => $tenant->id, // ⚡ clé étrangère correcte
            'nom'       => $request->admin_nom,
            'prenom'    => $request->admin_prenom,
            'email'     => $request->admin_email,
            'password'  => Hash::make($request->admin_password),
            'role'      => 'admin',
            'is_active' => true,
        ]);

        return response()->json([
            'message' => 'Tenant et son Admin créés avec succès.',
            'tenant'  => $tenant,
            'admin'   => $admin,
        ], 201);
    }

}
