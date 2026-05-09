<?php

namespace App\Http\Controllers;

use App\Http\Requests\ConfirmSoldRequest;
use App\Models\Listing;
use Illuminate\Http\Request;

class ListingSoldController extends Controller
{
    public function store(ConfirmSoldRequest $request, string $id)
    {
        $user = $request->user();
        $listing = Listing::query()->with('latestAuction')->findOrFail($id);

        if ($listing->seller_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($listing->status !== 'auction_ended') {
            return response()->json(['message' => 'Listing is not awaiting sold confirmation.'], 422);
        }

        $auction = $listing->latestAuction;
        if (!$auction || $auction->status !== 'ended' || !$auction->winner_id) {
            return response()->json(['message' => 'No ended auction winner found.'], 422);
        }

        $sold = (bool) $request->validated('sold');
        if ($sold) {
            $listing->status = 'sold';
            $listing->sold_at = now();
            $listing->sold_to_user_id = $auction->winner_id;
        } else {
            $listing->status = 'ready';
            $listing->sold_at = null;
            $listing->sold_to_user_id = null;
        }

        $listing->save();

        return response()->json([
            'listing' => [
                'id' => $listing->id,
                'status' => $listing->status,
                'sold_at' => $listing->sold_at?->toISOString(),
                'sold_to_user_id' => $listing->sold_to_user_id,
            ],
        ]);
    }

    /**
     * Seller marks a sellings listing as sold after an offline sale (no winner user in-app).
     */
    public function buyNowSold(Request $request, string $id)
    {
        $user = $request->user();
        $listing = Listing::query()->findOrFail($id);

        if ($listing->seller_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($listing->sale_type !== 'sellings') {
            return response()->json(['message' => 'Only sellings listings can be marked sold here.'], 422);
        }

        if ($listing->status !== 'ready') {
            return response()->json(['message' => 'Only active sellings listings can be marked sold.'], 422);
        }

        $listing->status = 'sold';
        $listing->sold_at = now();
        $listing->sold_to_user_id = null;
        $listing->save();

        return response()->json([
            'listing' => [
                'id' => $listing->id,
                'status' => $listing->status,
                'sold_at' => $listing->sold_at?->toISOString(),
                'sold_to_user_id' => $listing->sold_to_user_id,
            ],
        ]);
    }
}

