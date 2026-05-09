<?php

namespace Tests\Feature;

use App\Actions\IssueOneTimeCode;
use App\Models\OneTimeCode;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class EmailVerificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_issues_verification_code_and_in_app_notification(): void
    {
        Notification::fake();

        $this->postJson('/api/register', [
            'name' => 'Alice',
            'email' => 'alice@example.com',
            'password' => 'password123',
        ])->assertCreated();

        $user = User::query()->where('email', 'alice@example.com')->firstOrFail();

        $this->assertDatabaseHas('one_time_codes', [
            'email' => 'alice@example.com',
            'purpose' => IssueOneTimeCode::PURPOSE_EMAIL_VERIFY,
        ]);

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $user->id,
            'type' => 'email_verification_code',
        ]);
    }

    public function test_verify_accepts_valid_code_hash_and_sets_email_verified_at(): void
    {
        Notification::fake();

        $user = User::query()->create([
            'name' => 'U',
            'email' => 'u@example.com',
            'password' => 'password123',
        ]);

        $code = '123456';
        OneTimeCode::query()->create([
            'email' => $user->email,
            'user_id' => $user->id,
            'purpose' => IssueOneTimeCode::PURPOSE_EMAIL_VERIFY,
            'code_hash' => hash('sha256', $code),
            'expires_at' => now()->addMinutes(10),
        ]);

        $this->postJson('/api/email/verification/verify', [
            'email' => $user->email,
            'code' => $code,
        ])->assertOk();

        $this->assertNotNull($user->fresh()->email_verified_at);

        $this->assertDatabaseHas('one_time_codes', [
            'email' => $user->email,
            'purpose' => IssueOneTimeCode::PURPOSE_EMAIL_VERIFY,
        ]);
    }
}

