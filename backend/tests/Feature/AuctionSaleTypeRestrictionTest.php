<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuctionSaleTypeRestrictionTest extends TestCase
{
    use RefreshDatabase;

    public function test_cannot_create_auction_for_sellings_listing(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-auction-restrict@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Watch',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'sellings',
            'price' => 1000,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $seller->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/auctions', [
            'listing_id' => $listing->id,
            'ends_at' => now()->addHour()->toISOString(),
            'starting_bid' => 0,
            'min_increment' => 100,
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(422);
    }
}

