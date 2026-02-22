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
            'nom'                   => $tenant->nom,
            'adresse'               => $tenant->adresse,
            'telephone'             => $tenant->telephone,
            'currency'              => $tenant->currency ?? 'DH', // valeur par défaut si non définie
        ]);
    }

    // ========================
    // 6️⃣ Modifier le nom du tenant
    // ========================
    public function updateName(Request $request)
    {
        $request->validate([
            'nom' => 'required|string|max:100',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->nom = $request->nom;
        $tenant->save();

        return response()->json([
            'message' => 'Nom du tenant mis à jour.',
            'nom' => $tenant->nom,
        ]);
    }

    // ========================
    // 7️⃣ Modifier le téléphone
    // ========================
    public function updateTelephone(Request $request)
    {
        $request->validate([
            'telephone' => 'required|string|max:20',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->telephone = $request->telephone;
        $tenant->save();

        return response()->json([
            'message' => 'Téléphone mis à jour.',
            'telephone' => $tenant->telephone,
        ]);
    }

    // ========================
    // 8️⃣ Modifier l’adresse
    // ========================
    public function updateAdresse(Request $request)
    {
        $request->validate([
            'adresse' => 'required|string|max:255',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->adresse = $request->adresse;
        $tenant->save();

        return response()->json([
            'message' => 'Adresse mise à jour.',
            'adresse' => $tenant->adresse,
        ]);
    }

    // ========================
    // 9️⃣ Modifier la devise
    // ========================
    public function updateCurrency(Request $request)
    {
        $request->validate([
            'currency' => 'required|string|max:10',
        ]);

        $tenant = Auth::user()->tenant;
        $tenant->currency = $request->currency;
        $tenant->save();

        return response()->json([
            'message' => 'Devise mise à jour.',
            'currency' => $tenant->currency,
        ]);
    }
}