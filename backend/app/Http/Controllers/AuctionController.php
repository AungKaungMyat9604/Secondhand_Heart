<?php

namespace App\Http\Controllers;

use App\Actions\RefreshAuctionStatus;
use App\Http\Requests\StoreAuctionRequest;
use App\Models\Auction;
use App\Models\Bid;
use App\Models\Listing;
use App\Models\ListingImage;
use Illuminate\Support\Carbon;

class AuctionController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $now = now();
        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $status = request()->query('status'); // scheduled|active|ended

        $auctions = Auction::query()
            ->with('listing')
            ->when($q !== '', fn ($qq) => $qq->whereHas('listing', fn ($lq) => $lq->where('title', 'like', "%{$q}%")))
            ->when($status === 'scheduled', fn ($qq) => $qq->where('starts_at', '>', $now)->where('ends_at', '>', $now))
            ->when($status === 'active', fn ($qq) => $qq->where('starts_at', '<=', $now)->where('ends_at', '>', $now))
            ->when($status === 'ended', fn ($qq) => $qq->where('ends_at', '<=', $now))
            ->when(!($status === 'scheduled' || $status === 'active' || $status === 'ended'), fn ($qq) => $qq->where('ends_at', '>', $now))
            ->latest('ends_at')
            ->paginate($perPage);

        return response()->json([
            'data' => $auctions->getCollection()->map(fn (Auction $a) => $this->payload($a))->values(),
            'meta' => [
                'current_page' => $auctions->currentPage(),
                'last_page' => $auctions->lastPage(),
                'per_page' => $auctions->perPage(),
                'total' => $auctions->total(),
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreAuctionRequest $request)
    {
        $user = $request->user();
        $listing = Listing::query()->findOrFail($request->validated('listing_id'));

        if ($listing->seller_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if (!$listing->is_approved) {
            return response()->json(['message' => 'Listing not approved.'], 422);
        }
        if (($listing->sale_type ?? null) !== 'auction') {
            return response()->json(['message' => 'Listing is not an auction listing.'], 422);
        }
        if (($listing->status ?? null) !== 'ready') {
            return response()->json(['message' => 'Listing not available for auction.'], 422);
        }

        $auction = Auction::query()->create([
            'listing_id' => $listing->id,
            'starts_at' => $request->validated('starts_at') ? Carbon::parse($request->validated('starts_at')) : now(),
            'ends_at' => Carbon::parse($request->validated('ends_at')),
            'status' => 'scheduled',
            'starting_bid' => $request->validated('starting_bid'),
            'min_increment' => $request->validated('min_increment'),
        ]);

        $listing->status = 'in_auction';
        $listing->save();

        app(RefreshAuctionStatus::class)->refresh($auction);

        return response()->json([
            'auction' => $this->payload($auction->fresh('listing')),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $auction = Auction::query()->with('listing')->findOrFail($id);
        app(RefreshAuctionStatus::class)->refresh($auction);

        return response()->json([
            'auction' => $this->payload($auction),
        ]);
    }

    private function payload(Auction $auction): array
    {
        $currentHighest = Bid::query()->where('auction_id', $auction->id)->max('amount');
        $current = $currentHighest !== null ? (string) $currentHighest : (string) $auction->starting_bid;

        $listingImages = [];
        $primaryListingImage = null;
        if ($auction->relationLoaded('listing') && $auction->listing) {
            $listingImages = ListingImage::query()
                ->where('listing_id', $auction->listing->id)
                ->orderBy('sort_order')
                ->orderBy('id')
                ->pluck('image_path')
                ->map(fn ($p) => $p ? asset('storage/'.$p) : null)
                ->filter()
                ->values()
                ->all();
            $primaryListingImage = $listingImages[0] ?? null;
        }

        return [
            'id' => $auction->id,
            'listing' => $auction->relationLoaded('listing') && $auction->listing ? [
                'id' => $auction->listing->id,
                'title' => $auction->listing->title,
                'image_url' => $primaryListingImage,
                'images' => $listingImages,
            ] : null,
            'starts_at' => $auction->starts_at?->toISOString(),
            'ends_at' => $auction->ends_at?->toISOString(),
            'status' => $auction->status,
            'starting_bid' => (string) $auction->starting_bid,
            'min_increment' => (string) $auction->min_increment,
            'current_highest_bid' => $current,
        ];
    }
}
