<?php

namespace App\Http\Controllers;

use App\Actions\NotifyAdminsListingPendingApproval;
use App\Http\Requests\StoreListingRequest;
use App\Http\Requests\UpdateListingRequest;
use App\Models\Listing;
use App\Models\ListingImage;
use Illuminate\Support\Facades\Storage;

class ListingController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $saleType = request()->query('sale_type'); // auction|sellings

        $listings = Listing::query()
            ->where('is_approved', true)
            ->where('status', 'ready')
            ->when($saleType === 'auction' || $saleType === 'sellings', fn ($qq) => $qq->where('sale_type', $saleType))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('title', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%")
                        ->orWhere('condition', 'like', "%{$q}%");
                });
            })
            ->with(['latestAuction', 'seller', 'images'])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => $listings->getCollection()->map(fn (Listing $l) => $this->payload($l))->values(),
            'meta' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'per_page' => $listings->perPage(),
                'total' => $listings->total(),
            ],
        ]);
    }

    public function mine()
    {
        $user = request()->user();

        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $saleType = request()->query('sale_type'); // auction|sellings
        $status = request()->query('status'); // pending_approval|ready|in_auction|auction_ended|sold|removed

        $listings = Listing::query()
            ->where('seller_id', $user->id)
            ->when($saleType === 'auction' || $saleType === 'sellings', fn ($qq) => $qq->where('sale_type', $saleType))
            ->when(is_string($status) && $status !== '', fn ($qq) => $qq->where('status', $status))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('title', 'like', "%{$q}%")
                        ->orWhere('description', 'like', "%{$q}%")
                        ->orWhere('condition', 'like', "%{$q}%");
                });
            })
            ->with(['latestAuction', 'seller', 'images'])
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => $listings->getCollection()->map(fn (Listing $l) => $this->payload($l))->values(),
            'meta' => [
                'current_page' => $listings->currentPage(),
                'last_page' => $listings->lastPage(),
                'per_page' => $listings->perPage(),
                'total' => $listings->total(),
            ],
        ]);
    }

    /**
     * Seller-only detail (includes pending / unapproved listings).
     */
    public function showMine(string $id)
    {
        $user = request()->user();
        $listing = Listing::query()->with(['latestAuction', 'seller', 'images'])->findOrFail($id);

        if ($listing->seller_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        return response()->json([
            'listing' => $this->payload($listing),
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(StoreListingRequest $request, NotifyAdminsListingPendingApproval $notifier)
    {
        $user = $request->user();

        $listing = new Listing();
        $listing->seller_id = $user->id;
        $listing->title = $request->validated('title');
        $listing->description = $request->validated('description');
        $listing->condition = $request->validated('condition');
        $listing->location_city = $request->validated('location_city');
        $listing->location_region = $request->validated('location_region');
        $listing->is_approved = false;
        $listing->sale_type = $request->validated('sale_type', 'auction');
        $listing->status = 'pending_approval';
        $listing->price = $request->validated('price');

        $listing->save();

        $this->syncImages($listing, $request);

        $notifier->notify($listing);

        return response()->json([
            'listing' => $this->payload($listing->loadMissing(['images'])),
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        $listing = Listing::query()->with(['latestAuction', 'seller', 'images'])->findOrFail($id);

        if (!$listing->is_approved) {
            return response()->json(['message' => 'Not found.'], 404);
        }

        return response()->json([
            'listing' => $this->payload($listing),
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(UpdateListingRequest $request, string $id, NotifyAdminsListingPendingApproval $notifier)
    {
        $listing = Listing::query()->findOrFail($id);
        $this->authorize('update', $listing);

        if ($listing->status === 'sold') {
            return response()->json(['message' => 'Sold listings cannot be edited.'], 422);
        }

        if (in_array($listing->status, ['in_auction', 'auction_ended'], true)) {
            return response()->json(['message' => 'Cannot edit a listing while an auction is active or awaiting sold confirmation.'], 422);
        }

        $listing->fill($request->validated());

        if ($listing->sale_type === 'auction') {
            $listing->price = null;
        }

        // Any seller edit requires re-approval (same as creating new).
        $listing->is_approved = false;
        $listing->status = 'pending_approval';
        $listing->save();

        $this->syncImages($listing, $request);

        $notifier->notify($listing);

        return response()->json([
            'listing' => $this->payload($listing->loadMissing(['latestAuction', 'seller', 'images'])),
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        $listing = Listing::query()->findOrFail($id);
        $this->authorize('delete', $listing);

        $listing->delete();

        return response()->json(['message' => 'Deleted.']);
    }

    private function payload(Listing $listing): array
    {
        $images = $listing->relationLoaded('images')
            ? $listing->images->map(fn ($img) => asset('storage/'.$img->image_path))->values()->all()
            : [];
        $primaryImage = $images[0] ?? null;

        return [
            'id' => $listing->id,
            'seller_id' => $listing->seller_id,
            'seller' => $listing->relationLoaded('seller') && $listing->seller ? [
                'id' => $listing->seller->id,
                'name' => $listing->seller->name,
                'avatar_url' => $listing->seller->avatar_path ? asset('storage/'.$listing->seller->avatar_path) : null,
            ] : null,
            'title' => $listing->title,
            'description' => $listing->description,
            'condition' => $listing->condition,
            'location_city' => $listing->location_city,
            'location_region' => $listing->location_region,
            'image_url' => $primaryImage,
            'images' => $images,
            'is_approved' => $listing->is_approved,
            'sale_type' => $listing->sale_type,
            'status' => $listing->status,
            'price' => $listing->price !== null ? (string) $listing->price : null,
            'latest_auction' => $listing->relationLoaded('latestAuction') && $listing->latestAuction ? [
                'id' => $listing->latestAuction->id,
                'status' => $listing->latestAuction->status,
                'ends_at' => $listing->latestAuction->ends_at?->toISOString(),
                'winner_id' => $listing->latestAuction->winner_id,
            ] : null,
            'created_at' => $listing->created_at?->toISOString(),
        ];
    }

    private function syncImages(Listing $listing, \Illuminate\Http\Request $request): void
    {
        $hasMulti = $request->hasFile('images');

        if (!$hasMulti) {
            return;
        }

        // Replace-all behavior whenever images are provided.
        $listing->loadMissing('images');
        foreach ($listing->images as $img) {
            // Best-effort delete; ignore failures.
            if ($img->image_path) {
                Storage::disk('public')->delete($img->image_path);
            }
        }
        $listing->images()->delete();

        $files = $request->file('images') ?? [];

        $order = 0;
        foreach ($files as $file) {
            if (!$file) continue;
            $path = Storage::disk('public')->putFile('listings', $file);
            ListingImage::query()->create([
                'listing_id' => $listing->id,
                'image_path' => $path,
                'sort_order' => $order++,
            ]);
        }
    }
}
