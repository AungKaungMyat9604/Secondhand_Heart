<?php

namespace App\Http\Controllers;

use App\Http\Requests\AdminUpdateListingRequest;
use App\Actions\NotifySellerListingApproved;
use App\Models\Listing;

class AdminListingController extends Controller
{
    public function index()
    {
        $filter = request()->query('filter', 'all'); // all|pending
        $perPage = (int) request()->query('per_page', 20);
        $perPage = max(1, min(100, $perPage));
        $search = trim((string) request()->query('q', ''));
        $saleType = request()->query('sale_type'); // auction|sellings
        $status = request()->query('status'); // listing status
        $removed = request()->query('removed'); // 0|1|only

        $q = Listing::query()
            ->withTrashed()
            ->with(['seller', 'images'])
            ->latest()
            ->when($saleType === 'auction' || $saleType === 'sellings', fn ($qq) => $qq->where('sale_type', $saleType))
            ->when(is_string($status) && $status !== '', fn ($qq) => $qq->where('status', $status))
            ->when($search !== '', function ($qq) use ($search) {
                $qq->where(function ($w) use ($search) {
                    $w->where('title', 'like', "%{$search}%")
                        ->orWhere('description', 'like', "%{$search}%")
                        ->orWhere('condition', 'like', "%{$search}%");
                });
            })
            ->when($removed === '0', fn ($qq) => $qq->whereNull('deleted_at'))
            ->when($removed === '1', fn ($qq) => $qq->whereNotNull('deleted_at'))
            ->when($removed === 'only', fn ($qq) => $qq->whereNotNull('deleted_at'));

        if ($filter === 'pending') {
            $q->where('is_approved', false)->whereNull('deleted_at');
        }

        $listings = $q->paginate($perPage);

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

    public function show(string $id)
    {
        $listing = Listing::query()->withTrashed()->with(['seller', 'images'])->findOrFail($id);

        return response()->json([
            'listing' => $this->payload($listing),
        ]);
    }

    public function pending()
    {
        $listings = Listing::query()
            ->where('is_approved', false)
            ->whereNull('deleted_at')
            ->with('seller')
            ->latest()
            ->paginate(20);

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

    public function approve(string $id, NotifySellerListingApproved $notifier)
    {
        $listing = Listing::query()->withTrashed()->findOrFail($id);
        if ($listing->trashed()) {
            return response()->json(['message' => 'Cannot approve a removed listing.'], 422);
        }
        $listing->is_approved = true;
        $listing->status = 'ready';
        $listing->save();

        $notifier->notify($listing);

        return response()->json([
            'listing' => $this->payload($listing->loadMissing('seller')),
        ]);
    }

    public function remove(string $id)
    {
        $listing = Listing::query()->findOrFail($id);
        $listing->status = 'removed';
        $listing->is_approved = false;
        $listing->save();
        $listing->delete(); // soft delete

        return response()->json(['message' => 'Removed.']);
    }

    public function update(AdminUpdateListingRequest $request, string $id)
    {
        $listing = Listing::query()->withTrashed()->findOrFail($id);
        if ($listing->trashed()) {
            return response()->json(['message' => 'Cannot edit a removed listing.'], 422);
        }
        $listing->fill($request->validated());
        $listing->save();

        return response()->json([
            'listing' => $this->payload($listing->loadMissing('seller')),
        ]);
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
            'is_approved' => (bool) $listing->is_approved,
            'sale_type' => $listing->sale_type,
            'status' => $listing->status,
            'price' => $listing->price !== null ? (string) $listing->price : null,
            'created_at' => $listing->created_at?->toISOString(),
            'deleted_at' => $listing->deleted_at?->toISOString(),
        ];
    }
}
