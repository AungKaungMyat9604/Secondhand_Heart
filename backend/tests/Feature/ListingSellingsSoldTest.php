<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListingSellingsSoldTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_can_mark_sellings_ready_listing_as_sold(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-buynow-sold@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Phone',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'sellings',
            'price' => 999,
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

        $this->postJson("/api/listings/{$listing->id}/mark-buy-now-sold", [], [
            'Authorization' => 'Bearer '.$plain,
        ])
            ->assertOk()
            ->assertJsonPath('listing.status', 'sold');

        $this->assertDatabaseHas('listings', [
            'id' => $listing->id,
            'status' => 'sold',
            'sold_to_user_id' => null,
        ]);
    }

    public function test_cannot_mark_auction_listing_via_buy_now_route(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-auct@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Toy',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'auction',
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

        $this->postJson("/api/listings/{$listing->id}/mark-buy-now-sold", [], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(422);
    }
}

