<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreReportRequest;
use App\Models\Listing;
use App\Models\Report;

class ReportController extends Controller
{
    public function store(StoreReportRequest $request, string $listingId)
    {
        $user = $request->user();
        $listing = Listing::query()->findOrFail($listingId);

        $report = Report::query()->create([
            'reporter_id' => $user->id,
            'listing_id' => $listing->id,
            'reason' => $request->validated('reason'),
            'status' => 'open',
        ]);

        return response()->json([
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
            ],
        ], 201);
    }
}
