<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ProfileTest extends TestCase
{
    use RefreshDatabase;

    public function test_update_profile_requires_auth(): void
    {
        $this->putJson('/api/profile', ['phone' => '123'])->assertStatus(401);
    }

    public function test_can_update_profile(): void
    {
        $user = User::query()->create([
            'name' => 'Bob',
            'email' => 'bob@example.com',
            'password' => 'password123',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->putJson('/api/profile', [
            'phone' => '09-123456',
            'address' => 'Yangon',
            'facebook_url' => 'https://facebook.com/example',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk()->assertJsonPath('profile.phone', '09-123456');
    }
}

