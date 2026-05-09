<?php

namespace App\Http\Controllers;

use App\Actions\IssueOneTimeCode;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\ResetPasswordWithCodeRequest;
use App\Models\OneTimeCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class PasswordResetController extends Controller
{
    public function request(ForgotPasswordRequest $request, IssueOneTimeCode $issuer)
    {
        $email = $request->validated('email');

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        // Always return a generic message (avoid enumeration).
        if (!$user) {
            return response()->json(['message' => 'If your email exists, we sent a reset code.']);
        }

        $issuer->issue($user->email, IssueOneTimeCode::PURPOSE_PASSWORD_RESET, $user, 10);

        return response()->json(['message' => 'If your email exists, we sent a reset code.']);
    }

    public function reset(ResetPasswordWithCodeRequest $request)
    {
        $email = $request->validated('email');
        $code = $request->validated('code');
        $password = $request->validated('password');
        $hash = hash('sha256', $code);

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();
        if (!$user) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        $ok = DB::transaction(function () use ($email, $hash, $user, $password) {
            $row = OneTimeCode::query()
                ->where('email', $email)
                ->where('purpose', IssueOneTimeCode::PURPOSE_PASSWORD_RESET)
                ->where('code_hash', $hash)
                ->whereNull('consumed_at')
                ->where('expires_at', '>', now())
                ->lockForUpdate()
                ->first();

            if (!$row) {
                return false;
            }

            $row->consumed_at = now();
            $row->save();

            $user->password = $password; // hashed cast on User model
            $user->save();

            return true;
        });

        if (!$ok) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        return response()->json(['message' => 'Password reset successful.']);
    }
}

