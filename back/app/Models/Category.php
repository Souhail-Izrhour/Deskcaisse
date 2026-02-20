<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Category extends Model
{
    use SoftDeletes;

    // ========================
    // Champs assignables en masse
    // ========================
    protected $fillable = [
        'tenant_id',
        'name',
        'image',
    ];
     protected $appends = ['image_url'];
    public function getImageUrlAttribute()
{
    return $this->image
        ? asset('storage/' . $this->image)
        : null;
}


    // ========================
    // Casts
    // ========================
    protected $casts = [
        // ici aucun booléen ou date particulière à caster automatiquement
    ];

    // ========================
    // Relations
    // ========================
    
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
