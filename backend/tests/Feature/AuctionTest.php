<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class AuctionTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_auction_requires_auth(): void
    {
        $this->postJson('/api/auctions', [])->assertStatus(401);
    }

    public function test_can_create_auction_for_approved_listing(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-auction@example.com',
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

        $this->postJson('/api/auctions', [
            'listing_id' => $listing->id,
            'ends_at' => now()->addHour()->toISOString(),
            'starting_bid' => 0,
            'min_increment' => 100,
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertCreated()->assertJsonPath('auction.listing.id', $listing->id);
    }

    public function test_auction_end_sets_listing_to_auction_ended_when_has_winner(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-01 10:00:00'));

        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-auction-end@example.com',
            'password' => 'password123',
        ]);
        $bidder = User::query()->create([
            'name' => 'Bidder',
            'email' => 'bidder@example.com',
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

        $plainSeller = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $seller->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plainSeller),
            'expires_at' => now()->addDay(),
        ]);

        $create = $this->postJson('/api/auctions', [
            'listing_id' => $listing->id,
            'starts_at' => now()->subMinute()->toISOString(),
            'ends_at' => now()->addMinute()->toISOString(),
            'starting_bid' => 0,
            'min_increment' => 1,
        ], ['Authorization' => 'Bearer '.$plainSeller])->assertCreated();

        $auctionId = $create->json('auction.id');

        $plainBidder = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $bidder->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plainBidder),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/api/auctions/{$auctionId}/bids", [
            'amount' => 10,
        ], ['Authorization' => 'Bearer '.$plainBidder])->assertCreated();

        // Move time forward so auction ends, then hit show to trigger refreshStatus().
        Carbon::setTestNow(Carbon::parse('2026-01-01 10:10:00'));
        $this->getJson("/api/auctions/{$auctionId}")->assertOk();

        $this->assertDatabaseHas('auctions', [
            'id' => $auctionId,
            'status' => 'ended',
            'winner_id' => $bidder->id,
        ]);
        $this->assertDatabaseHas('listings', [
            'id' => $listing->id,
            'status' => 'auction_ended',
        ]);
    }
}

