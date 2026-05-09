<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_create_listing_requires_auth(): void
    {
        $this->postJson('/api/listings', ['title' => 'Toy'])->assertStatus(401);
    }

    public function test_can_create_listing(): void
    {
        $user = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller@example.com',
            'password' => 'password123',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $res = $this->post('/api/listings', [
            'title' => 'Vintage Figure',
            'description' => 'Good condition',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ], [
            'Authorization' => 'Bearer '.$plain,
            'Accept' => 'application/json',
        ]);

        $res->assertCreated();
        $this->assertDatabaseHas('listings', [
            'title' => 'Vintage Figure',
            'seller_id' => $user->id,
            'status' => 'pending_approval',
            'sale_type' => 'auction',
        ]);
    }

    public function test_sellings_listing_requires_price(): void
    {
        $user = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-buynow@example.com',
            'password' => 'password123',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/listings', [
            'title' => 'Phone',
            'sale_type' => 'sellings',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(422)->assertJsonValidationErrors(['price']);
    }

    public function test_index_only_shows_approved(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller2@example.com',
            'password' => 'password123',
        ]);

        Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Approved',
            'is_approved' => true,
            'status' => 'ready',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Pending',
            'is_approved' => false,
            'status' => 'pending_approval',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $this->getJson('/api/listings')
            ->assertOk()
            ->assertJsonMissing(['title' => 'Pending'])
            ->assertJsonFragment(['title' => 'Approved']);
    }

    public function test_seller_edit_requires_reapproval(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-edit@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Old title',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'sellings',
            'price' => 100,
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

        $this->putJson("/api/listings/{$listing->id}", [
            'title' => 'New title',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk()->assertJsonPath('listing.status', 'pending_approval');

        $this->assertDatabaseHas('listings', [
            'id' => $listing->id,
            'is_approved' => false,
            'status' => 'pending_approval',
            'title' => 'New title',
        ]);
    }
}

