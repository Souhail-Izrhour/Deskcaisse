<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Tenant extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'public_id',
        'nom',
        'email',
        'telephone',
        'adresse',
        'logo',
        'ticket_footer_message',
        'currency',
        'language',
        'show_logo_on_ticket',
        'ticket_type',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
        'show_logo_on_ticket' => 'boolean',
    ];

    // ========================
    // Relations
    // ========================

    /**
     * Un tenant a plusieurs utilisateurs
     */
    public function users()
    {
        return $this->hasMany(User::class);
    }

    /**
     * Un tenant a plusieurs catégories
     */
    public function categories()
    {
        return $this->hasMany(Category::class);
    }

    /**
     * Un tenant a plusieurs produits
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }

    /**
     * Un tenant a plusieurs shifts
     */
    public function shifts()
    {
        return $this->hasMany(Shift::class);
    }

    /**
     * Un tenant a plusieurs commandes
     */
    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    /**
     * Un tenant a plusieurs items de commande
     */
    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Un tenant a plusieurs charges
     */
    public function charges()
    {
        return $this->hasMany(Charge::class);
    }

    /**
     * Un tenant a plusieurs fournisseurs
     */
    public function fournisseurs()
    {
        return $this->hasMany(Fournisseur::class);
    }
    protected $appends = ['logo_url'];
    

public function getLogoUrlAttribute()
{
    return $this->logo
        ? asset('storage/' . $this->logo)
        : null;
}

}
