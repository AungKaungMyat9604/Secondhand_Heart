<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AdminAuctionController extends Controller
{
    public function index()
    {
        $perPage = (int) request()->query('per_page', 30);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $status = request()->query('status'); // scheduled|active|ended

        $auctions = Auction::query()
            ->with('listing')
            ->select(['auctions.*'])
            ->addSelect([
                'bid_count' => Bid::query()
                    ->select(DB::raw('COUNT(*)'))
                    ->whereColumn('bids.auction_id', 'auctions.id'),
            ])
            ->when($status === 'scheduled' || $status === 'active' || $status === 'ended', fn ($qq) => $qq->where('status', $status))
            ->when($q !== '', fn ($qq) => $qq->whereHas('listing', fn ($lq) => $lq->where('title', 'like', "%{$q}%")))
            ->latest('id')
            ->paginate($perPage);

        return response()->json([
            'data' => $auctions->items(),
            'meta' => [
                'current_page' => $auctions->currentPage(),
                'last_page' => $auctions->lastPage(),
                'per_page' => $auctions->perPage(),
                'total' => $auctions->total(),
            ],
        ]);
    }

    public function bids(string $id)
    {
        $perPage = (int) request()->query('per_page', 50);
        $perPage = max(1, min(100, $perPage));

        $bids = Bid::query()
            ->with('bidder:id,name,email')
            ->where('auction_id', $id)
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => collect($bids->items())->map(function (Bid $bid) {
                /** @var User|null $bidder */
                $bidder = $bid->bidder;
                return [
                    'id' => $bid->id,
                    'bidder_id' => $bid->bidder_id,
                    'bidder_name' => $bidder?->name,
                    'bidder_email' => $bidder?->email,
                    'amount' => (string) $bid->amount,
                    'created_at' => $bid->created_at?->toISOString(),
                ];
            })->values(),
            'meta' => [
                'current_page' => $bids->currentPage(),
                'last_page' => $bids->lastPage(),
                'per_page' => $bids->perPage(),
                'total' => $bids->total(),
            ],
        ]);
    }
}
