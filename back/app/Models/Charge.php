<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Charge extends Model
{
    use SoftDeletes;

    // ========================
    // Champs assignables en masse
    // ========================
    protected $fillable = [
        'tenant_id',
        'user_id',
        'shift_id',
        'description',
        'amount',
    ];

    // ========================
    // Casts
    // ========================
    protected $casts = [
        'amount' => 'decimal:2',
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
}
