<?php

namespace App\Http\Controllers;

use App\Actions\IssueOneTimeCode;
use App\Http\Requests\RequestEmailVerificationCodeRequest;
use App\Http\Requests\VerifyEmailCodeRequest;
use App\Models\OneTimeCode;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class EmailVerificationController extends Controller
{
    public function request(RequestEmailVerificationCodeRequest $request, IssueOneTimeCode $issuer)
    {
        $email = $request->validated('email');

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();

        // Always return a generic message (avoid enumeration).
        if (!$user || $user->email_verified_at) {
            return response()->json(['message' => 'If your email exists, we sent a verification code.']);
        }

        $issuer->issue($user->email, IssueOneTimeCode::PURPOSE_EMAIL_VERIFY, $user, 10);

        return response()->json(['message' => 'If your email exists, we sent a verification code.']);
    }

    public function verify(VerifyEmailCodeRequest $request)
    {
        $email = $request->validated('email');
        $code = $request->validated('code');
        $hash = hash('sha256', $code);

        /** @var User|null $user */
        $user = User::query()->where('email', $email)->first();
        if (!$user) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.']);
        }

        $ok = DB::transaction(function () use ($email, $hash, $user) {
            $row = OneTimeCode::query()
                ->where('email', $email)
                ->where('purpose', IssueOneTimeCode::PURPOSE_EMAIL_VERIFY)
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

            $user->email_verified_at = now();
            $user->save();

            return true;
        });

        if (!$ok) {
            return response()->json(['message' => 'Invalid code.'], 422);
        }

        return response()->json(['message' => 'Email verified.']);
    }
}

