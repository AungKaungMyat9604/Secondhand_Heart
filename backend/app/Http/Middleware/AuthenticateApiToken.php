<?php

namespace App\Http\Middleware;

use App\Models\ApiToken;
use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class AuthenticateApiToken
{
    /**
     * Authenticate using Authorization: Bearer <token>.
     * Stores only a SHA-256 hash of the token in the database.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $header = $request->header('Authorization');
        if (!is_string($header) || !str_starts_with($header, 'Bearer ')) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $plainToken = trim(substr($header, 7));
        if ($plainToken === '') {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        $tokenHash = hash('sha256', $plainToken);

        $apiToken = ApiToken::query()
            ->with('user')
            ->where('token_hash', $tokenHash)
            ->where(function ($q) {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            })
            ->first();

        if (!$apiToken || !$apiToken->user) {
            return response()->json(['message' => 'Unauthenticated.'], 401);
        }

        if ($apiToken->user->is_banned ?? false) {
            return response()->json(['message' => 'Account banned.'], 403);
        }

        $request->setUserResolver(fn () => $apiToken->user);
        Auth::setUser($apiToken->user);
        $request->attributes->set('api_token', $apiToken);

        return $next($request);
    }
}

