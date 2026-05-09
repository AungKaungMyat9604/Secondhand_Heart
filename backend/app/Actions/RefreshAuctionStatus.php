<?php

namespace App\Actions;

use App\Models\Auction;
use App\Models\AppNotification;
use App\Models\Bid;
use App\Models\User;
use App\Notifications\AuctionWonNotification;

class RefreshAuctionStatus
{
    public function refresh(Auction $auction): void
    {
        $now = now();
        $newStatus = $auction->ends_at <= $now ? 'ended' : ($auction->starts_at && $auction->starts_at <= $now ? 'active' : 'scheduled');

        if ($auction->status !== $newStatus) {
            $auction->status = $newStatus;
            if ($newStatus === 'ended') {
                $topBid = Bid::query()
                    ->where('auction_id', $auction->id)
                    ->orderByDesc('amount')
                    ->orderByDesc('id')
                    ->first();
                $auction->winner_id = $topBid?->bidder_id;
            }
            $auction->save();
        }

        // Keep listing status in sync with auction lifecycle.
        $auction->loadMissing('listing');
        if ($auction->listing) {
            if ($newStatus === 'ended') {
                $auction->listing->status = $auction->winner_id ? 'auction_ended' : 'ready';
                $auction->listing->save();
            } elseif ($newStatus === 'active' || $newStatus === 'scheduled') {
                if ($auction->listing->status !== 'sold' && $auction->listing->status !== 'removed') {
                    $auction->listing->status = 'in_auction';
                    $auction->listing->save();
                }
            }
        }

        // One-time ended notifications (winner + seller)
        if ($newStatus === 'ended' && $auction->ended_notified_at === null) {
            $topBid = Bid::query()
                ->where('auction_id', $auction->id)
                ->orderByDesc('amount')
                ->orderByDesc('id')
                ->first();

            $winnerId = $topBid?->bidder_id;
            $sellerId = $auction->listing?->seller_id;
            $listingId = $auction->listing?->id;
            $listingTitle = $auction->listing?->title;
            $winningAmount = $topBid ? (string) $topBid->amount : null;

            if ($winnerId) {
                $seller = $sellerId ? User::query()->find($sellerId) : null;
                AppNotification::query()->create([
                    'user_id' => $winnerId,
                    'type' => 'auction_ended_winner',
                    'data' => [
                        'auction_id' => $auction->id,
                        'listing_id' => $listingId,
                        'listing_title' => $listingTitle,
                        'winning_amount' => $winningAmount,
                        'seller_id' => $sellerId,
                        'seller_name' => $seller?->name,
                    ],
                ]);

                $winner = User::query()->find($winnerId);
                if ($winner) {
                    $winner->notify(new AuctionWonNotification(
                        auction: $auction,
                        listingTitle: $listingTitle,
                        winningAmount: $winningAmount,
                    ));
                }
            }

            if ($sellerId) {
                $winner = $winnerId ? User::query()->find($winnerId) : null;
                AppNotification::query()->create([
                    'user_id' => $sellerId,
                    'type' => 'auction_ended_seller',
                    'data' => [
                        'auction_id' => $auction->id,
                        'listing_id' => $listingId,
                        'listing_title' => $listingTitle,
                        'has_bids' => (bool) $winnerId,
                        'winning_amount' => $winningAmount,
                        'winner_id' => $winnerId,
                        'winner_name' => $winner?->name,
                    ],
                ]);

                $seller = User::query()->find($sellerId);
                if ($seller) {
                    // Keep existing seller email behavior (can be upgraded later).
                    // Seller also receives in-app notification above.
                }
            }

            $auction->ended_notified_at = now();
            $auction->save();
        }
    }
}

