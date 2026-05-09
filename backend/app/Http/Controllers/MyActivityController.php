<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\ListingImage;
use Illuminate\Support\Facades\DB;

class MyActivityController extends Controller
{
    public function bids()
    {
        $user = request()->user();
        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));

        $rows = Bid::query()
            ->join('auctions', 'auctions.id', '=', 'bids.auction_id')
            ->leftJoin('listings', 'listings.id', '=', 'auctions.listing_id')
            ->where('bids.bidder_id', $user->id)
            ->when($q !== '', fn ($qq) => $qq->where('listings.title', 'like', "%{$q}%"))
            ->select(['bids.auction_id', DB::raw('MAX(bids.id) as last_bid_id')])
            ->groupBy('bids.auction_id')
            ->orderByDesc('last_bid_id')
            ->paginate($perPage);

        $auctionIds = collect($rows->items())->pluck('auction_id')->all();

        $auctions = Auction::query()
            ->with('listing')
            ->whereIn('id', $auctionIds)
            ->get()
            ->keyBy('id');

        $latestBids = Bid::query()
            ->where('bidder_id', $user->id)
            ->whereIn('auction_id', $auctionIds)
            ->orderByDesc('id')
            ->get()
            ->groupBy('auction_id')
            ->map(fn ($bids) => $bids->first());

        $data = collect($auctionIds)->map(function ($auctionId) use ($auctions, $latestBids, $user) {
            /** @var Auction|null $a */
            $a = $auctions->get($auctionId);
            /** @var Bid|null $b */
            $b = $latestBids->get($auctionId);
            if (!$a || !$b) return null;

            return [
                'auction_id' => $a->id,
                'listing' => $a->listing ? [
                    'id' => $a->listing->id,
                    'title' => $a->listing->title,
                ] : null,
                'status' => $a->status,
                'is_winner' => (bool) ($a->winner_id && (int) $a->winner_id === (int) $user->id),
                'ends_at' => $a->ends_at?->toISOString(),
                'your_latest_bid' => [
                    'id' => $b->id,
                    'amount' => (string) $b->amount,
                    'created_at' => $b->created_at?->toISOString(),
                ],
            ];
        })->filter()->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $rows->currentPage(),
                'last_page' => $rows->lastPage(),
                'per_page' => $rows->perPage(),
                'total' => $rows->total(),
            ],
        ]);
    }

    public function wins()
    {
        $user = request()->user();
        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));

        $auctions = Auction::query()
            ->with('listing')
            ->where('status', 'ended')
            ->where('winner_id', $user->id)
            ->when($q !== '', fn ($qq) => $qq->whereHas('listing', fn ($lq) => $lq->where('title', 'like', "%{$q}%")))
            ->latest('ends_at')
            ->paginate($perPage);

        $data = $auctions->getCollection()->map(function (Auction $a) {
            $primaryImage = null;
            if ($a->listing) {
                $path = ListingImage::query()
                    ->where('listing_id', $a->listing->id)
                    ->orderBy('sort_order')
                    ->orderBy('id')
                    ->value('image_path');
                $primaryImage = $path ? asset('storage/'.$path) : null;
            }
            return [
                'auction_id' => $a->id,
                'listing' => $a->listing ? [
                    'id' => $a->listing->id,
                    'title' => $a->listing->title,
                    'image_url' => $primaryImage,
                ] : null,
                'ends_at' => $a->ends_at?->toISOString(),
            ];
        })->values();

        return response()->json([
            'data' => $data,
            'meta' => [
                'current_page' => $auctions->currentPage(),
                'last_page' => $auctions->lastPage(),
                'per_page' => $auctions->perPage(),
                'total' => $auctions->total(),
            ],
        ]);
    }
}
