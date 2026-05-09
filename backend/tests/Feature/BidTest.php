<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class BidTest extends TestCase
{
    use RefreshDatabase;

    public function test_place_bid_requires_auth(): void
    {
        $this->postJson('/api/auctions/1/bids', ['amount' => 100])->assertStatus(401);
    }

    public function test_can_place_bid_and_reject_too_low(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-bid@example.com',
            'password' => 'password123',
        ]);

        $buyer = User::query()->create([
            'name' => 'Buyer',
            'email' => 'buyer@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Toy',
            'is_approved' => true,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $auction = Auction::query()->create([
            'listing_id' => $listing->id,
            'starts_at' => now()->subMinute(),
            'ends_at' => now()->addHour(),
            'status' => 'active',
            'min_increment' => 50,
        ]);

        Bid::query()->create([
            'auction_id' => $auction->id,
            'bidder_id' => $buyer->id,
            'amount' => 100,
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $buyer->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/api/auctions/{$auction->id}/bids", [
            'amount' => 120,
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(409);

        $this->postJson("/api/auctions/{$auction->id}/bids", [
            'amount' => 150,
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertCreated()->assertJsonPath('current_highest_bid', '150');
    }
}

