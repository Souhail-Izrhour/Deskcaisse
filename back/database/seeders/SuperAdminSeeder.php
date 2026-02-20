<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    public function run(): void
    {
        $email = env('SUPER_ADMIN_EMAIL');
        $password = env('SUPER_ADMIN_PASSWORD');

        if (! $email || ! $password) {
            $this->command->error(
                '❌ SUPER_ADMIN_EMAIL ou SUPER_ADMIN_PASSWORD manquant dans le .env'
            );
            return;
        }

        // Éviter les doublons
        $exists = User::where('role', 'super_admin')
            ->whereNull('tenant_id')
            ->where('email', $email)
            ->exists();

        if ($exists) {
            $this->command->info('Super admin déjà existant.');
            return;
        }

        User::create([
            'tenant_id' => null,
            'nom'       => 'Super',
            'prenom'    => 'Admin',
            'email'     => $email,
            'password'  => Hash::make($password),
            'role'      => 'super_admin',
            'is_active' => true,
        ]);

        $this->command->info('✅ Super admin créé avec succès.');
    }
}
