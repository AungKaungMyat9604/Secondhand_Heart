<?php

namespace App\Http\Controllers;

use App\Http\Requests\MarkNotificationReadRequest;
use App\Models\Auction;
use App\Models\AppNotification;

class NotificationController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $perPage = (int) request()->query('per_page', 30);
        $perPage = max(1, min(100, $perPage));
        $unread = request()->query('unread'); // 1|0

        $items = AppNotification::query()
            ->where('user_id', $user->id)
            ->when($unread === '1', fn ($q) => $q->whereNull('read_at'))
            ->latest()
            ->paginate($perPage);

        // Ensure notification payloads include listing_title (for UI clarity).
        // We compute it from auction/listing when missing.
        $rows = collect($items->items());
        $auctionIdsNeedingTitle = $rows
            ->filter(function (AppNotification $n) {
                $data = is_array($n->data) ? $n->data : [];
                return isset($data['auction_id']) && empty($data['listing_title']);
            })
            ->map(function (AppNotification $n) {
                $data = is_array($n->data) ? $n->data : [];
                return (int) $data['auction_id'];
            })
            ->unique()
            ->values()
            ->all();

        $auctionTitleById = [];
        if (count($auctionIdsNeedingTitle) > 0) {
            $auctionTitleById = Auction::query()
                ->with('listing')
                ->whereIn('id', $auctionIdsNeedingTitle)
                ->get()
                ->mapWithKeys(fn ($a) => [(int) $a->id => $a->listing?->title])
                ->all();
        }

        $data = $rows->map(function (AppNotification $n) use ($auctionTitleById) {
            $payload = $n->toArray();
            $payload['data'] = is_array($payload['data'] ?? null) ? $payload['data'] : [];
            if (isset($payload['data']['auction_id']) && empty($payload['data']['listing_title'])) {
                $aid = (int) $payload['data']['auction_id'];
                $payload['data']['listing_title'] = $auctionTitleById[$aid] ?? null;
            }
            return $payload;
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
                'per_page' => $items->perPage(),
                'total' => $items->total(),
            ],
        ]);
    }

    public function markRead(MarkNotificationReadRequest $request, string $id)
    {
        $user = $request->user();
        $notification = AppNotification::query()
            ->where('user_id', $user->id)
            ->findOrFail($id);

        $read = $request->validated('read') ?? true;
        $notification->read_at = $read ? now() : null;
        $notification->save();

        return response()->json([
            'notification' => [
                'id' => $notification->id,
                'read_at' => $notification->read_at?->toISOString(),
            ],
        ]);
    }
}
