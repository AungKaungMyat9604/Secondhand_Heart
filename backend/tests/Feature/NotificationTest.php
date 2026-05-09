<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\AppNotification;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class NotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_outbid_creates_notification(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-n@example.com',
            'password' => 'password123',
        ]);
        $a = User::query()->create([
            'name' => 'A',
            'email' => 'a@example.com',
            'password' => 'password123',
        ]);
        $b = User::query()->create([
            'name' => 'B',
            'email' => 'b@example.com',
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
            'starting_bid' => 0,
            'min_increment' => 1,
        ]);

        Bid::query()->create([
            'auction_id' => $auction->id,
            'bidder_id' => $a->id,
            'amount' => 10,
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $b->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/api/auctions/{$auction->id}/bids", [
            'amount' => 11,
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertCreated();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $a->id,
            'type' => 'outbid',
        ]);
    }

    public function test_auction_end_creates_notifications_on_show(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-end@example.com',
            'password' => 'password123',
        ]);
        $winner = User::query()->create([
            'name' => 'Winner',
            'email' => 'winner-end@example.com',
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
            'status' => 'active',
            'starting_bid' => 0,
            'min_increment' => 1,
            'ended_notified_at' => null,
        ]);

        Bid::query()->create([
            'auction_id' => $auction->id,
            'bidder_id' => $winner->id,
            'amount' => 100,
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $seller->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->getJson("/api/auctions/{$auction->id}", [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $winner->id,
            'type' => 'auction_ended_winner',
        ]);

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $seller->id,
            'type' => 'auction_ended_seller',
        ]);
    }
}

