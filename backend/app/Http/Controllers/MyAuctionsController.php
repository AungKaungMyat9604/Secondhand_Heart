<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\ListingImage;

class MyAuctionsController extends Controller
{
    public function index()
    {
        $user = request()->user();
        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $status = request()->query('status'); // scheduled|active|ended

        $auctions = Auction::query()
            ->with('listing')
            ->whereHas('listing', fn ($q) => $q->where('seller_id', $user->id))
            ->when($status === 'scheduled' || $status === 'active' || $status === 'ended', fn ($qq) => $qq->where('status', $status))
            ->when($q !== '', fn ($qq) => $qq->whereHas('listing', fn ($lq) => $lq->where('title', 'like', "%{$q}%")))
            ->latest('id')
            ->paginate($perPage);

        $data = $auctions->getCollection()->map(function (Auction $a) {
            $currentHighest = Bid::query()->where('auction_id', $a->id)->max('amount');
            $current = $currentHighest !== null ? (string) $currentHighest : (string) $a->starting_bid;

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
                'id' => $a->id,
                'listing' => $a->listing ? [
                    'id' => $a->listing->id,
                    'title' => $a->listing->title,
                    'image_url' => $primaryImage,
                ] : null,
                'starts_at' => $a->starts_at?->toISOString(),
                'ends_at' => $a->ends_at?->toISOString(),
                'status' => $a->status,
                'starting_bid' => (string) $a->starting_bid,
                'min_increment' => (string) $a->min_increment,
                'current_highest_bid' => $current,
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
