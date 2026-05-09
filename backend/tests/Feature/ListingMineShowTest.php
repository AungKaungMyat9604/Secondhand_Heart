<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListingMineShowTest extends TestCase
{
    use RefreshDatabase;

    public function test_seller_can_fetch_own_unapproved_listing(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-mine-show@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Pending item',
            'is_approved' => false,
            'status' => 'pending_approval',
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

        $this->getJson("/api/my/listings/{$listing->id}", [
            'Authorization' => 'Bearer '.$plain,
        ])
            ->assertOk()
            ->assertJsonPath('listing.id', $listing->id)
            ->assertJsonPath('listing.title', 'Pending item');
    }

    public function test_other_user_cannot_fetch_someone_elses_listing_via_mine_route(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-a@example.com',
            'password' => 'password123',
        ]);
        $other = User::query()->create([
            'name' => 'Other',
            'email' => 'other@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Not yours',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'auction',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $other->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->getJson("/api/my/listings/{$listing->id}", [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(403);
    }
}
