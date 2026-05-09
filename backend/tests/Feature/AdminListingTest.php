<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class AdminListingTest extends TestCase
{
    use RefreshDatabase;

    public function test_non_admin_cannot_approve(): void
    {
        $user = User::query()->create([
            'name' => 'U',
            'email' => 'u@example.com',
            'password' => 'password123',
            'role' => 'user',
        ]);
        $listing = Listing::query()->create([
            'seller_id' => $user->id,
            'title' => 'Pending',
            'is_approved' => false,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->putJson("/api/admin/listings/{$listing->id}/approve", [], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(403);
    }

    public function test_admin_can_approve_listing(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-admin@example.com',
            'password' => 'password123',
        ]);
        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Pending',
            'is_approved' => false,
            'status' => 'pending_approval',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $admin->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->putJson("/api/admin/listings/{$listing->id}/approve", [], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk()
            ->assertJsonPath('listing.is_approved', true)
            ->assertJsonPath('listing.status', 'ready');
    }
}

