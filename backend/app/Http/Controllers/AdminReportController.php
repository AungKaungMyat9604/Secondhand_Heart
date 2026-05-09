<?php

namespace App\Http\Controllers;

use App\Http\Requests\ResolveReportRequest;
use App\Models\Report;

class AdminReportController extends Controller
{
    public function index()
    {
        $perPage = (int) request()->query('per_page', 30);
        $perPage = max(1, min(100, $perPage));
        $q = trim((string) request()->query('q', ''));
        $status = request()->query('status'); // open|resolved

        $reports = Report::query()
            ->with('listing')
            ->when($status === 'open' || $status === 'resolved', fn ($qq) => $qq->where('status', $status))
            ->when($q !== '', function ($qq) use ($q) {
                $qq->where(function ($w) use ($q) {
                    $w->where('reason', 'like', "%{$q}%")
                        ->orWhereHas('listing', fn ($lq) => $lq->where('title', 'like', "%{$q}%"));
                });
            })
            ->latest()
            ->paginate($perPage);

        return response()->json([
            'data' => $reports->items(),
            'meta' => [
                'current_page' => $reports->currentPage(),
                'last_page' => $reports->lastPage(),
                'per_page' => $reports->perPage(),
                'total' => $reports->total(),
            ],
        ]);
    }

    public function resolve(ResolveReportRequest $request, string $id)
    {
        $report = Report::query()->findOrFail($id);
        $report->status = 'resolved';
        $report->admin_notes = $request->validated('admin_notes');
        $report->save();

        return response()->json([
            'report' => [
                'id' => $report->id,
                'status' => $report->status,
            ],
        ]);
    }
}
