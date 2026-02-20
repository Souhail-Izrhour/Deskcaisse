<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class OrderItem extends Model
{
    use SoftDeletes;

    // ========================
    // Champs assignables en masse
    // ========================
    protected $fillable = [
        'tenant_id',
        'order_id',
        'product_id',
        'product_name',
        'unit_price',
        'quantity',
        'total_row',
    ];

    // ========================
    // Casts
    // ========================
    protected $casts = [
        'unit_price' => 'decimal:2',
        'total_row' => 'decimal:2',
        'quantity' => 'integer',
    ];

    // ========================
    // Relations
    // ========================
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
