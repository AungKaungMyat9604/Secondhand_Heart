<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_and_login_and_me(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password123',
        ])->assertCreated();

        // Login is blocked until email verification.
        $this->postJson('/api/login', [
            'email' => 'alice@example.com',
            'password' => 'password123',
        ])->assertStatus(403);

        /** @var User $user */
        $user = User::query()->where('email', 'alice@example.com')->firstOrFail();

        // Simulate successful email verification by setting verified timestamp.
        $user->email_verified_at = now();
        $user->save();

        $login = $this->postJson('/api/login', [
            'email' => 'alice@example.com',
            'password' => 'password123',
        ])->assertOk()->json();

        $this->assertArrayHasKey('token', $login);

        $this->getJson('/api/me', [
            'Authorization' => 'Bearer '.$login['token'],
        ])->assertOk()->assertJsonPath('user.email', 'alice@example.com');
    }
}

