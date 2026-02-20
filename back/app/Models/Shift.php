<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Shift extends Model
{
    use SoftDeletes;

    // ========================
    // Champs assignables en masse
    // ========================
    protected $fillable = [
        'tenant_id',
        'user_id',
        'started_at',
        'ended_at',
        'ventes',
        'charges',
        'net',
    ];

    // ========================
    // Casts
    // ========================
    protected $casts = [
        'started_at' => 'datetime',
        'ended_at' => 'datetime',
        'ventes' => 'decimal:2',
        'charges' => 'decimal:2',
        'net' => 'decimal:2',
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

    public function orders()
    {
        return $this->hasMany(Order::class);
    }

    public function charges()
    {
        return $this->hasMany(Charge::class);
    }
}
