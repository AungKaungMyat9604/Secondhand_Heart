<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreBidRequest;
use App\Models\Auction;
use App\Models\AppNotification;
use App\Models\Bid;
use App\Models\User;
use App\Notifications\AuctionOutbidNotification;
use Illuminate\Support\Facades\DB;
class BidController extends Controller
{
    public function index(string $auctionId)
    {
        $bids = Bid::query()
            ->where('auction_id', $auctionId)
            ->latest()
            ->limit(50)
            ->get()
            ->map(fn (Bid $b) => [
                'id' => $b->id,
                'bidder_id' => $b->bidder_id,
                'amount' => (string) $b->amount,
                'created_at' => $b->created_at?->toISOString(),
            ]);

        return response()->json(['bids' => $bids]);
    }

    public function store(StoreBidRequest $request, string $auctionId)
    {
        $user = $request->user();

        $result = DB::transaction(function () use ($auctionId, $request, $user) {
            /** @var Auction $auction */
            $auction = Auction::query()
                ->with('listing')
                ->whereKey($auctionId)
                ->lockForUpdate()
                ->firstOrFail();

            $now = now();
            if ($auction->ends_at <= $now) {
                $auction->status = 'ended';
                $auction->save();
                return ['error' => response()->json(['message' => 'Auction ended.'], 422)];
            }

            $auction->status = ($auction->starts_at && $auction->starts_at <= $now) ? 'active' : 'scheduled';
            $auction->save();

            if ($auction->listing && $auction->listing->seller_id === $user->id) {
                return ['error' => response()->json(['message' => 'Self-bidding is not allowed.'], 422)];
            }

            $previousTopBid = Bid::query()
                ->where('auction_id', $auction->id)
                ->orderByDesc('amount')
                ->orderByDesc('id')
                ->first();
            $currentHighest = $previousTopBid?->amount;

            $amount = (float) $request->validated('amount');
            $minRequired = $currentHighest !== null
                ? ((float) $currentHighest + (float) $auction->min_increment)
                : (float) $auction->starting_bid;

            if ($amount < $minRequired) {
                return ['error' => response()->json([
                    'message' => 'Bid too low.',
                    'code' => 'BID_TOO_LOW',
                    'current_highest_bid' => $currentHighest !== null ? (string) $currentHighest : null,
                    'min_required' => (string) $minRequired,
                ], 409)];
            }

            $bid = Bid::query()->create([
                'auction_id' => $auction->id,
                'bidder_id' => $user->id,
                'amount' => $amount,
            ]);

            return [
                'bid' => $bid,
                'current_highest_bid' => (string) $amount,
                'previous_top_bidder_id' => $previousTopBid?->bidder_id,
            ];
        });

        if (isset($result['error'])) {
            return $result['error'];
        }

        /** @var Bid $bid */
        $bid = $result['bid'];

        /** @var Auction|null $auction */
        $auction = Auction::query()->with('listing')->find($bid->auction_id);

        $prevBidderId = $result['previous_top_bidder_id'] ?? null;
        if ($prevBidderId && $prevBidderId !== $user->id) {
            AppNotification::query()->create([
                'user_id' => $prevBidderId,
                'type' => 'outbid',
                'data' => [
                    'auction_id' => $bid->auction_id,
                    'listing_id' => $auction?->listing?->id,
                    'listing_title' => $auction?->listing?->title,
                    'new_amount' => (string) $bid->amount,
                    'current_highest_bid' => (string) $bid->amount,
                ],
            ]);

            $prevUser = User::query()->find($prevBidderId);
            if ($prevUser) {
                $prevUser->notify(new AuctionOutbidNotification(
                    auctionId: (int) $bid->auction_id,
                    listingTitle: $auction?->listing?->title,
                    newHighestBid: (string) $bid->amount,
                ));
            }
        }

        return response()->json([
            'bid' => [
                'id' => $bid->id,
                'auction_id' => $bid->auction_id,
                'bidder_id' => $bid->bidder_id,
                'amount' => (string) $bid->amount,
                'created_at' => $bid->created_at?->toISOString(),
            ],
            'current_highest_bid' => $result['current_highest_bid'],
        ], 201);
    }
}
