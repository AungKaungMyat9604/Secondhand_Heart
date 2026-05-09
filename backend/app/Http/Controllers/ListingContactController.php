<?php

namespace App\Http\Controllers;

use App\Models\Listing;
use App\Models\User;

class ListingContactController extends Controller
{
    public function show(string $listingId)
    {
        /** @var User $viewer */
        $viewer = request()->user();

        $listing = Listing::query()->with('seller')->findOrFail($listingId);

        if (!$listing->is_approved || $listing->status !== 'ready') {
            return response()->json(['message' => 'Not found.'], 404);
        }

        if ($listing->sale_type !== 'sellings') {
            return response()->json(['message' => 'Contact not available for this listing type.'], 422);
        }

        $seller = $listing->seller;
        if (!$seller) {
            return response()->json(['message' => 'Seller not found.'], 404);
        }

        if (($seller->is_banned ?? false) === true) {
            return response()->json(['message' => 'Seller not available.'], 422);
        }

        return response()->json([
            'listing_id' => $listing->id,
            'contact' => [
                'user_id' => $seller->id,
                'name' => $seller->name,
                'email' => $seller->email,
                'phone' => $seller->phone,
                'address' => $seller->address,
                'facebook_url' => $seller->facebook_url,
            ],
            'viewer_id' => $viewer->id,
        ]);
    }
}

