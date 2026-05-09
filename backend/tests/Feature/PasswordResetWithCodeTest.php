<?php

namespace Tests\Feature;

use App\Actions\IssueOneTimeCode;
use App\Models\OneTimeCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class PasswordResetWithCodeTest extends TestCase
{
    use RefreshDatabase;

    public function test_forgot_password_request_creates_code_and_in_app_notification(): void
    {
        Notification::fake();

        $user = User::query()->create([
            'name' => 'U',
            'email' => 'u@example.com',
            'password' => 'password123',
            'email_verified_at' => now(),
        ]);

        $this->postJson('/api/password/forgot/request', [
            'email' => $user->email,
        ])->assertOk();

        $this->assertDatabaseHas('one_time_codes', [
            'email' => $user->email,
            'purpose' => IssueOneTimeCode::PURPOSE_PASSWORD_RESET,
        ]);

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $user->id,
            'type' => 'password_reset_code',
        ]);
    }

    public function test_reset_password_consumes_code_and_updates_password(): void
    {
        Notification::fake();

        $user = User::query()->create([
            'name' => 'U',
            'email' => 'u@example.com',
            'password' => 'password123',
            'email_verified_at' => now(),
        ]);

        $code = '123456';
        OneTimeCode::query()->create([
            'email' => $user->email,
            'user_id' => $user->id,
            'purpose' => IssueOneTimeCode::PURPOSE_PASSWORD_RESET,
            'code_hash' => hash('sha256', $code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/password/forgot/reset', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'newpassword123',
            'password_confirmation' => 'newpassword123',
        ])->assertOk();

        $this->assertTrue(Hash::check('newpassword123', (string) $user->fresh()->password));

        $consumed = OneTimeCode::query()
            ->where('email', $user->email)
            ->where('purpose', IssueOneTimeCode::PURPOSE_PASSWORD_RESET)
            ->firstOrFail();

        $this->assertNotNull($consumed->consumed_at);

        // Cannot reuse the same code.
        $this->postJson('/api/password/forgot/reset', [
            'email' => $user->email,
            'code' => $code,
            'password' => 'anotherpassword123',
            'password_confirmation' => 'anotherpassword123',
        ])->assertStatus(422);
    }
}

