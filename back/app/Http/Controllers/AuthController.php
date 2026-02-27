<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * Création d’un utilisateur par l’admin
     */
    public function createUser(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'nom' => 'required|string|max:255',
            'prenom' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,NULL,id,tenant_id,' . $request->user()->tenant_id,
            'password' => 'required|string|min:8|confirmed',
            'role' => 'in:admin,serveur',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $tenant = $request->user()->tenant;

        $user = User::create([
            'tenant_id' => $tenant->id,
            'nom'       => $request->nom,
            'prenom'    => $request->prenom,
            'email'     => $request->email,
            'password'  => Hash::make($request->password),
            'role'      => $request->role ?? 'serveur',
        ]);

        return response()->json(['message' => 'Utilisateur créé avec succès', 'user' => $user], 201);
    }

    /**
     * Connexion
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        if (!Auth::attempt($request->only('email', 'password'))) {
            return response()->json(['message' => 'Identifiants incorrects'], 401);
        }

        $user = Auth::user();

        if (!$user->is_active) {
            return response()->json(['message' => 'Ce compte est désactivé'], 403);
        }

        $user->tokens()->delete();

        $token = $user->createToken('authToken')->plainTextToken;

        return response()->json(['message' => 'Connexion réussie', 'user' => $user, 'token' => $token], 200);
    }

    /**
     * Récupérer l’utilisateur connecté
     */
    public function getCurrentUser(Request $request)
    {
        return response()->json(['user' => $request->user()]);
    }

    /**
     * Déconnexion
     */
    public function logout(Request $request)
    {
        $request->user()->tokens()->delete();
        return response()->json(['message' => 'Déconnexion réussie']);
    }

    /**
     * Lister tous les utilisateurs du tenant
     */
    public function index(Request $request)
    {

        $users = User::where('tenant_id', $request->user()->tenant_id)->get();
        return response()->json(['success' => true, 'data' => $users]);
    }

    /**
     * Afficher un utilisateur spécifique
     */
    public function show(Request $request, User $user)
    {
     
        return response()->json(['success' => true, 'data' => $user]);
    }

    /**
     * Mettre à jour un utilisateur
     */
    public function update(Request $request, User $user)
    {
    
        $validated = $request->validate([
            'nom' => 'string|max:255',
            'prenom' => 'string|max:255',
            'email' => 'string|email|max:255|unique:users,email,' . $user->id . ',id,tenant_id,' . $request->user()->tenant_id,
            'password' => 'string|min:8|confirmed',
            'role' => 'in:admin,serveur',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update($validated);

        return response()->json(['message' => 'Utilisateur mis à jour avec succès', 'user' => $user]);
    }

    /**
     * Désactiver un utilisateur
     */
    public function deactivate(Request $request, User $user)
    {
       

        $user->is_active = false;
        $user->save();

        return response()->json(['message' => 'Utilisateur désactivé avec succès']);
    }

    public function activate(Request $request, User $user)
    {
       

        $user->is_active = true;
        $user->save();

        return response()->json(['message' => 'Utilisateur activé avec succès']);
    }

    /**
     * Supprimer définitivement un utilisateur
     */
    public function destroy(Request $request, User $user)
    {
        

        $user->delete();
        return response()->json(['message' => 'Utilisateur supprimé définitivement']);
    }
    public function restaurer($id)
{
    $user = User::withTrashed()->find($id);

    if (! $user) {
        return response()->json([
            'message' => 'Utilisateur non trouvé.'
        ], 404);
    }

    if (! $user->trashed()) {
        return response()->json([
            'message' => 'Cet utilisateur n\'est pas supprimé.'
        ], 400);
    }

    $user->restore();

    return response()->json([
        'message' => 'Utilisateur restauré avec succès'
    ]);
}
}
