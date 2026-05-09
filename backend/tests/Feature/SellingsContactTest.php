<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class SellingsContactTest extends TestCase
{
    use RefreshDatabase;

    public function test_contact_requires_auth(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-contact@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Sellings',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'sellings',
            'price' => 100,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $this->getJson("/api/listings/{$listing->id}/contact")->assertStatus(401);
    }

    public function test_contact_returns_seller_info_for_approved_ready_sellings(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-contact2@example.com',
            'password' => 'password123',
            'phone' => '0912345678',
            'address' => 'Somewhere',
            'facebook_url' => 'https://facebook.com/example',
        ]);

        $viewer = User::query()->create([
            'name' => 'Viewer',
            'email' => 'viewer-contact@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Sellings',
            'is_approved' => true,
            'status' => 'ready',
            'sale_type' => 'sellings',
            'price' => 100,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $viewer->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->getJson("/api/listings/{$listing->id}/contact", [
            'Authorization' => 'Bearer '.$plain,
        ])
            ->assertOk()
            ->assertJsonPath('contact.user_id', $seller->id)
            ->assertJsonPath('contact.name', 'Seller')
            ->assertJsonPath('contact.phone', '0912345678');
    }
}

