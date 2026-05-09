<?php

namespace App\Http\Controllers;

use App\Http\Requests\UpdateUserBanRequest;
use App\Http\Requests\UpdateUserRoleRequest;
use App\Models\User;

class AdminUserController extends Controller
{
    public function index()
    {
        $perPage = (int) request()->query('per_page', 30);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $role = request()->query('role');
        $banned = request()->query('banned');

        $users = User::query()
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('name', 'like', "%{$q}%")
                        ->orWhere('email', 'like', "%{$q}%");
                });
            })
            ->when($role === 'admin' || $role === 'user', fn ($qq) => $qq->where('role', $role))
            ->when($banned === '1' || $banned === '0', fn ($qq) => $qq->where('is_banned', $banned === '1'))
            ->orderByDesc('id')
            ->paginate($perPage);

        return response()->json([
            'data' => $users->items(),
            'meta' => [
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
                'per_page' => $users->perPage(),
                'total' => $users->total(),
            ],
        ]);
    }

    public function setRole(UpdateUserRoleRequest $request, string $id)
    {
        $user = User::query()->findOrFail($id);
        $user->role = $request->validated('role');
        $user->save();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
            ],
        ]);
    }

    public function setBan(UpdateUserBanRequest $request, string $id)
    {
        $user = User::query()->findOrFail($id);
        $user->is_banned = (bool) $request->validated('is_banned');
        $user->save();

        return response()->json([
            'user' => [
                'id' => $user->id,
                'email' => $user->email,
                'is_banned' => (bool) $user->is_banned,
            ],
        ]);
    }
}
