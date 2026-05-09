<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListingSoldTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_can_confirm_sold_and_listing_hides_from_public(): void
    {
        Carbon::setTestNow(Carbon::parse('2026-01-01 10:00:00'));

        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-confirm@example.com',
            'password' => 'password123',
        ]);
        $bidder = User::query()->create([
            'name' => 'Bidder',
            'email' => 'bidder-confirm@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Toy',
            'is_approved' => true,
            'status' => 'ready',
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

        Carbon::setTestNow(Carbon::parse('2026-01-01 10:10:00'));
        $this->getJson("/api/auctions/{$auctionId}")->assertOk();

        $this->assertDatabaseHas('listings', [
            'id' => $listing->id,
            'status' => 'auction_ended',
        ]);

        $this->postJson("/api/listings/{$listing->id}/confirm-sold", [
            'sold' => true,
        ], ['Authorization' => 'Bearer '.$plainSeller])
            ->assertOk()
            ->assertJsonPath('listing.status', 'sold');

        // Public listings should not include sold items.
        $this->getJson('/api/listings')
            ->assertOk()
            ->assertJsonMissing(['id' => $listing->id]);
    }
}

