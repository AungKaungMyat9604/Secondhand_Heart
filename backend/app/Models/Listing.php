<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;

class Listing extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'seller_id',
        'title',
        'description',
        'condition',
        'location_city',
        'location_region',
        'is_approved',
        'sale_type',
        'status',
        'price',
        'sold_at',
        'sold_to_user_id',
    ];

    protected $casts = [
        'is_approved' => 'boolean',
        'price' => 'decimal:2',
        'sold_at' => 'datetime',
    ];

    public function seller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'seller_id');
    }

    public function auctions(): HasMany
    {
        return $this->hasMany(Auction::class);
    }

    public function images(): HasMany
    {
        return $this->hasMany(ListingImage::class)->orderBy('sort_order')->orderBy('id');
    }

    public function latestAuction(): HasOne
    {
        return $this->hasOne(Auction::class)->latestOfMany();
    }
}
