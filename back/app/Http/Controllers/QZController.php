<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class QzController extends Controller
{
    /**
     * Retourne le certificat public à QZ Tray
     */
    public function certificate()
    {
        $path = storage_path('app/qz/certificate.pem');

        if (!file_exists($path)) {
            return response()->json(['error' => 'Certificate not found'], 404);
        }

        return response()->file($path, [
            'Content-Type' => 'text/plain'
        ]);
    }

    /**
     * Signe la requête envoyée par QZ Tray
     */
  public function sign(Request $request)
{
    $privateKeyPath = storage_path('app/qz/private.key');

    if (!file_exists($privateKeyPath)) {
        return response()->json(['error' => 'Private key not found'], 404);
    }

    $privateKey = file_get_contents($privateKeyPath);

    // ⚠️ IMPORTANT : récupérer seulement toSign
    $data = $request->input('toSign');

    if (!$data) {
        return response()->json(['error' => 'No data to sign'], 400);
    }

    openssl_sign($data, $signature, $privateKey, OPENSSL_ALGO_SHA256);

    return response(base64_encode($signature), 200)
        ->header('Content-Type', 'text/plain');
}

}
