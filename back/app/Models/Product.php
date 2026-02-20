<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Product extends Model
{
    use SoftDeletes;

    // ========================
    // Champs assignables en masse
    // ========================
    protected $fillable = [
        'tenant_id',
        'category_id',
        'name',
        'image',
        'price',
        'stock',
        'barcode',
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
        'price' => 'decimal:2',
        'stock' => 'integer',
    ];

    // ========================
    // Relations
    // ========================
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
