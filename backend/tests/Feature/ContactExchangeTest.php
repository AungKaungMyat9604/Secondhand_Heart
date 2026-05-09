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

class ContactExchangeTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_requires_auth(): void
    {
        $this->getJson('/api/auctions/1/contact')->assertStatus(401);
    }

    public function test_winner_and_seller_can_view_contact_after_end(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-contact@example.com',
            'password' => 'password123',
            'phone' => '111',
        ]);
        $winner = User::query()->create([
            'name' => 'Winner',
            'email' => 'winner-contact@example.com',
            'password' => 'password123',
            'phone' => '222',
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
            'min_increment' => 10,
        ]);

        Bid::query()->create([
            'auction_id' => $auction->id,
            'bidder_id' => $winner->id,
            'amount' => 100,
        ]);

        $sellerToken = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $seller->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $sellerToken),
            'expires_at' => now()->addDay(),
        ]);

        $winnerToken = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $winner->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $winnerToken),
            'expires_at' => now()->addDay(),
        ]);

        $this->getJson("/api/auctions/{$auction->id}/contact", [
            'Authorization' => 'Bearer '.$winnerToken,
        ])->assertOk()->assertJsonPath('contact.phone', '111');

        $this->getJson("/api/auctions/{$auction->id}/contact", [
            'Authorization' => 'Bearer '.$sellerToken,
        ])->assertOk()->assertJsonPath('contact.phone', '222');
    }
}

