<?php

namespace App\Actions;

use App\Models\AppNotification;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingApprovedNotification;

class NotifySellerListingApproved
{
    public function notify(Listing $listing): void
    {
        $listing->loadMissing('seller');

        /** @var User|null $seller */
        $seller = $listing->seller;
        if (!$seller) {
            return;
        }

        AppNotification::query()->create([
            'user_id' => $seller->id,
            'type' => 'listing_approved',
            'data' => [
                'listing_id' => $listing->id,
                'listing_title' => $listing->title,
                'sale_type' => $listing->sale_type,
            ],
        ]);

        $seller->notify(new ListingApprovedNotification($listing));
    }
}

