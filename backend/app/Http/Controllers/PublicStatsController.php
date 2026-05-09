<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Listing;
use App\Models\User;

class PublicStatsController extends Controller
{
    public function show()
    {
        // “Active listings” definition (per request):
        // - approved
        // - ready
        // - not sold/removed/pending/etc.
        $activeListings = Listing::query()
            ->where('is_approved', true)
            ->where('status', 'ready')
            ->count();

        $nowSellingListings = Listing::query()
            ->where('is_approved', true)
            ->where('status', 'ready')
            ->where('sale_type', 'sellings')
            ->count();

        $nowInAuctionListings = Listing::query()
            ->where('is_approved', true)
            ->where('status', 'in_auction')
            ->where('sale_type', 'auction')
            ->count();

        $directlySoldListings = Listing::query()
            ->where('status', 'sold')
            ->where('sale_type', 'sellings')
            ->count();

        // Auction completed listings:
        // - ended auctions
        // - has at least 1 bid
        // - auctions without bids (but ended) are NOT complete
        $completedAuctionListingIds = Auction::query()
            ->where('status', 'ended')
            ->whereIn('id', function ($q) {
                $q->select('auction_id')->from('bids')->groupBy('auction_id');
            })
            ->pluck('listing_id')
            ->unique()
            ->values();

        return response()->json([
            'stats' => [
                'total_users' => User::query()->count(),
                'total_active_listings' => $activeListings,
                'total_now_selling_listings' => $nowSellingListings,
                'total_now_in_auction_listings' => $nowInAuctionListings,
                'total_directly_sold_listings' => $directlySoldListings,
                'total_auction_completed_listings' => $completedAuctionListingIds->count(),
            ],
        ]);
    }
}

