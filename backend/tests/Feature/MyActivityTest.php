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

class MyActivityTest extends TestCase
{
    use RefreshDatabase;

    public function test_my_bids_and_my_wins(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-activity@example.com',
            'password' => 'password123',
        ]);

        $buyer = User::query()->create([
            'name' => 'Buyer',
            'email' => 'buyer-activity@example.com',
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
            'starts_at' => now()->subHour(),
            'ends_at' => now()->subMinute(),
            'status' => 'ended',
            'starting_bid' => 0,
            'min_increment' => 10,
            'winner_id' => $buyer->id,
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

        $this->getJson('/api/my/bids', [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk()->assertJsonFragment(['auction_id' => $auction->id]);

        $this->getJson('/api/my/wins', [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk()->assertJsonFragment(['auction_id' => $auction->id]);
    }
}

