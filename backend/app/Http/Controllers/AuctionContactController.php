<?php

namespace App\Http\Controllers;

use App\Models\Auction;
use App\Models\Bid;
use App\Models\User;

class AuctionContactController extends Controller
{
    public function show(string $auctionId)
    {
        /** @var User $viewer */
        $viewer = request()->user();

        $auction = Auction::query()->with('listing')->findOrFail($auctionId);

        $now = now();
        if ($auction->ends_at > $now) {
            return response()->json(['message' => 'Auction not ended.'], 422);
        }

        if ($auction->status !== 'ended') {
            $auction->status = 'ended';
            $auction->save();
        }

        $topBid = Bid::query()
            ->where('auction_id', $auction->id)
            ->orderByDesc('amount')
            ->orderByDesc('id')
            ->first();

        $sellerId = $auction->listing?->seller_id;
        $winnerId = $topBid?->bidder_id;

        if (!$sellerId) {
            return response()->json(['message' => 'Auction listing missing.'], 500);
        }

        if ($viewer->id !== $sellerId && $viewer->id !== $winnerId) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (!$winnerId) {
            return response()->json([
                'message' => 'No bids were placed.',
                'contact' => null,
            ]);
        }

        if ($viewer->id === $sellerId) {
            $winner = User::query()->findOrFail($winnerId);
            return response()->json([
                'role' => 'seller',
                'contact' => [
                    'user_id' => $winner->id,
                    'name' => $winner->name,
                    'email' => $winner->email,
                    'phone' => $winner->phone,
                    'address' => $winner->address,
                    'facebook_url' => $winner->facebook_url,
                ],
            ]);
        }

        $seller = User::query()->findOrFail($sellerId);
        return response()->json([
            'role' => 'winner',
            'contact' => [
                'user_id' => $seller->id,
                'name' => $seller->name,
                'email' => $seller->email,
                'phone' => $seller->phone,
                'address' => $seller->address,
                'facebook_url' => $seller->facebook_url,
            ],
        ]);
    }
}
