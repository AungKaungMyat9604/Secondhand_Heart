<?php

namespace App\Actions;

use App\Models\AppNotification;
use App\Models\OneTimeCode;
use App\Models\User;
use App\Notifications\EmailVerificationCodeNotification;
use App\Notifications\PasswordResetCodeNotification;
use Illuminate\Support\Facades\DB;

class IssueOneTimeCode
{
    public const PURPOSE_EMAIL_VERIFY = 'email_verify';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    public function issue(string $email, string $purpose, ?User $user = null, int $expiresInMinutes = 10): void
    {
        $code = (string) random_int(100000, 999999);
        $codeHash = hash('sha256', $code);
        $expiresAt = now()->addMinutes($expiresInMinutes);

        DB::transaction(function () use ($email, $purpose, $user, $codeHash, $expiresAt) {
            OneTimeCode::query()
                ->where('email', $email)
                ->where('purpose', $purpose)
                ->whereNull('consumed_at')
                ->update(['consumed_at' => now()]);

            OneTimeCode::query()->create([
                'email' => $email,
                'user_id' => $user?->id,
                'purpose' => $purpose,
                'code_hash' => $codeHash,
                'expires_at' => $expiresAt,
            ]);

            if ($user) {
                AppNotification::query()->create([
                    'user_id' => $user->id,
                    'type' => $purpose === self::PURPOSE_EMAIL_VERIFY ? 'email_verification_code' : 'password_reset_code',
                    'data' => [
                        'purpose' => $purpose,
                        'expires_at' => $expiresAt->toISOString(),
                        'hint' => 'Code sent to your email.',
                    ],
                ]);
            }
        });

        // Email delivery (outside transaction).
        if ($user) {
            $this->notifyUser($user, $purpose, $code, $expiresInMinutes);
        } else {
            // If there is no user instance, we still want to send email when possible.
            // For password reset and verification we only send when a user exists to avoid enumeration.
        }
    }

    private function notifyUser(User $user, string $purpose, string $code, int $expiresInMinutes): void
    {
        if ($purpose === self::PURPOSE_EMAIL_VERIFY) {
            $user->notify(new EmailVerificationCodeNotification($code, $expiresInMinutes));
            return;
        }

        if ($purpose === self::PURPOSE_PASSWORD_RESET) {
            $user->notify(new PasswordResetCodeNotification($code, $expiresInMinutes));
            return;
        }
    }
}

