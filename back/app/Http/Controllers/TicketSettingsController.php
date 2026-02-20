<?php

namespace App\Http\Controllers;

use App\Models\Tenant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;

class TicketSettingsController extends Controller
{
    // ========================
    // 1️⃣ Modifier le footer message
    // ========================
    public function updateFooter(Request $request)
    {
        $request->validate([
            'ticket_footer_message' => 'nullable|string|max:255',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->ticket_footer_message = $request->ticket_footer_message;
        $tenant->save();

        return response()->json([
            'message' => 'Footer mis à jour avec succès.',
            'ticket_footer_message' => $tenant->ticket_footer_message,
        ]);
    }

    // ========================
    // 2️⃣ Activer / désactiver le logo
    // ========================
    public function toggleLogo(Request $request)
    {
        $request->validate([
            'show_logo_on_ticket' => 'required|boolean',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->show_logo_on_ticket = $request->show_logo_on_ticket;
        $tenant->save();

        return response()->json([
            'message' => 'Affichage du logo mis à jour.',
            'show_logo_on_ticket' => $tenant->show_logo_on_ticket,
        ]);
    }

    // ========================
    // 3️⃣ Changer le type de ticket
    // ========================
    public function updateType(Request $request)
    {
        $request->validate([
            'ticket_type' => 'required|in:normal,double',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->ticket_type = $request->ticket_type;
        $tenant->save();

        return response()->json([
            'message' => 'Type de ticket mis à jour.',
            'ticket_type' => $tenant->ticket_type,
        ]);
    }

    // ========================
    // 4️⃣ Voir les paramètres actuels
    // ========================
    public function show()
    {
        $tenant = Auth::user()->tenant;

        return response()->json([
            'ticket_footer_message' => $tenant->ticket_footer_message,
            'show_logo_on_ticket'   => $tenant->show_logo_on_ticket,
            'ticket_type'           => $tenant->ticket_type,
            'logo'                  => $tenant->logo,
        ]);
    }

    // ========================
    // 5️⃣ Upload / changer le logo
    // ========================

 public function uploadLogo(Request $request)
{
    $request->validate([
        'logo' => 'required|image|mimes:jpg,jpeg,png,bmp,webp|max:2048',
    ]);

    $tenant = Auth::user()->tenant;
    $tenantId = $tenant->id;

    // Supprimer l'ancien logo
    if ($tenant->logo && Storage::disk('public')->exists($tenant->logo)) {
        Storage::disk('public')->delete($tenant->logo);
    }

    // Stockage par tenant
    $path = $request->file('logo')->store(
        "tenants/{$tenantId}/logos",
        'public'
    );

    $tenant->logo = $path;
    $tenant->save();

    return response()->json([
        'message' => 'Logo uploadé avec succès.',
        'logo'    => $tenant->logo,
    ]);
}

}
