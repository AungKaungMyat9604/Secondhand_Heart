<?php

namespace App\Actions;

use App\Models\AppNotification;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingPendingApprovalNotification;

class NotifyAdminsListingPendingApproval
{
    public function notify(Listing $listing): void
    {
        $listing->loadMissing('seller');

        $admins = User::query()
            ->where('role', 'admin')
            ->where(function ($q) {
                $q->whereNull('is_banned')->orWhere('is_banned', false);
            })
            ->get();

        foreach ($admins as $admin) {
            AppNotification::query()->create([
                'user_id' => $admin->id,
                'type' => 'listing_pending_approval',
                'data' => [
                    'listing_id' => $listing->id,
                    'listing_title' => $listing->title,
                    'seller_id' => $listing->seller_id,
                    'seller_name' => $listing->seller?->name,
                    'sale_type' => $listing->sale_type,
                ],
            ]);

            $admin->notify(new ListingPendingApprovalNotification($listing));
        }
    }
}

