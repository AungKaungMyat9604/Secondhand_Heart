<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListingLocationRequiredTest extends TestCase
{
    use RefreshDatabase;

    public function test_location_is_required_on_create_listing(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-loc@example.com',
            'password' => 'password123',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $seller->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/listings', [
            'title' => 'No location',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertStatus(422)->assertJsonValidationErrors(['location_city', 'location_region']);
    }
}

