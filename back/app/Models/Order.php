<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Order extends Model
{
    use SoftDeletes;

    // ========================
    // Champs assignables en masse
    // ========================
    protected $fillable = [
        'tenant_id',
        'user_id',
        'shift_id',
        'totalOrder',
        'status',
        'payment_method',
    ];

    // ========================
    // Casts
    // ========================
    protected $casts = [
        'totalOrder' => 'decimal:2',
    ];

    // ========================
    // Relations
    // ========================
    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function shift()
    {
        return $this->belongsTo(Shift::class);
    }

    public function orderItems()
    {
        return $this->hasMany(OrderItem::class);
    }
}
