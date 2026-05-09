<?php

namespace App\Http\Controllers;

use App\Actions\IssueOneTimeCode;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Models\ApiToken;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(RegisterRequest $request, IssueOneTimeCode $issuer)
    {
        $user = User::query()->create([
            'name' => $request->validated('name'),
            'email' => $request->validated('email'),
            'password' => $request->validated('password'),
        ]);

        $issuer->issue($user->email, IssueOneTimeCode::PURPOSE_EMAIL_VERIFY, $user, 10);

        return response()->json([
            'user' => $this->userPayload($user),
        ], 201);
    }

    public function login(LoginRequest $request)
    {
        /** @var User|null $user */
        $user = User::query()->where('email', $request->validated('email'))->first();

        if (!$user || !Hash::check($request->validated('password'), $user->password)) {
            return response()->json(['message' => 'Invalid credentials.'], 422);
        }

        if (!$user->email_verified_at) {
            return response()->json(['message' => 'Email not verified.'], 403);
        }

        $plainToken = Str::random(80);
        $token = ApiToken::query()->create([
            'user_id' => $user->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plainToken),
            'expires_at' => now()->addDays(30),
        ]);

        return response()->json([
            'token' => $plainToken,
            'expires_at' => $token->expires_at?->toISOString(),
            'user' => $this->userPayload($user),
        ]);
    }

    public function logout()
    {
        /** @var ApiToken|null $token */
        $token = request()->attributes->get('api_token');
        if ($token) {
            $token->delete();
        }

        return response()->json(['message' => 'Logged out.']);
    }

    public function me()
    {
        /** @var User $user */
        $user = request()->user();

        return response()->json([
            'user' => $this->userPayload($user),
        ]);
    }

    private function userPayload(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'role' => $user->role ?? 'user',
            'phone' => $user->phone,
            'address' => $user->address,
            'facebook_url' => $user->facebook_url,
            'avatar_url' => $user->avatar_path ? asset('storage/'.$user->avatar_path) : null,
        ];
    }
}
