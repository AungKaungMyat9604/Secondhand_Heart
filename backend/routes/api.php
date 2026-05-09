<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\AuctionController;
use App\Http\Controllers\AuctionContactController;
use App\Http\Controllers\BidController;
use App\Http\Controllers\EmailVerificationController;
use App\Http\Controllers\ListingContactController;
use App\Http\Controllers\ListingController;
use App\Http\Controllers\MyAuctionsController;
use App\Http\Controllers\MyActivityController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PasswordResetController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ListingSoldController;
use App\Http\Controllers\PublicStatsController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

Route::post('/email/verification/request', [EmailVerificationController::class, 'request'])->middleware('throttle:5,1');
Route::post('/email/verification/verify', [EmailVerificationController::class, 'verify'])->middleware('throttle:10,1');

Route::post('/password/forgot/request', [PasswordResetController::class, 'request'])->middleware('throttle:5,1');
Route::post('/password/forgot/reset', [PasswordResetController::class, 'reset'])->middleware('throttle:10,1');

Route::middleware('auth.token')->group(function () {
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    Route::post('/listings', [ListingController::class, 'store']);
    Route::get('/my/listings', [ListingController::class, 'mine']);
    Route::get('/my/listings/{id}', [ListingController::class, 'showMine']);
    Route::put('/listings/{id}', [ListingController::class, 'update']);
    Route::delete('/listings/{id}', [ListingController::class, 'destroy']);
    Route::get('/listings/{id}/contact', [ListingContactController::class, 'show']);
    Route::post('/listings/{id}/reports', [\App\Http\Controllers\ReportController::class, 'store']);
    Route::post('/listings/{id}/confirm-sold', [ListingSoldController::class, 'store']);
    Route::post('/listings/{id}/mark-buy-now-sold', [ListingSoldController::class, 'buyNowSold']);

    Route::post('/auctions', [AuctionController::class, 'store']);
    Route::get('/my/auctions', [MyAuctionsController::class, 'index']);
    Route::get('/my/bids', [MyActivityController::class, 'bids']);
    Route::get('/my/wins', [MyActivityController::class, 'wins']);

    Route::post('/auctions/{id}/bids', [BidController::class, 'store'])->middleware('throttle:20,1');

    Route::get('/auctions/{id}/contact', [AuctionContactController::class, 'show']);

    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::post('/notifications/{id}/read', [NotificationController::class, 'markRead']);

    Route::middleware('admin')->prefix('/admin')->group(function () {
        Route::get('/listings', [\App\Http\Controllers\AdminListingController::class, 'index']);
        Route::get('/listings/{id}', [\App\Http\Controllers\AdminListingController::class, 'show']);
        Route::get('/listings/pending', [\App\Http\Controllers\AdminListingController::class, 'pending']);
        Route::put('/listings/{id}/approve', [\App\Http\Controllers\AdminListingController::class, 'approve']);
        Route::delete('/listings/{id}', [\App\Http\Controllers\AdminListingController::class, 'remove']);
        Route::put('/listings/{id}', [\App\Http\Controllers\AdminListingController::class, 'update']);

        Route::get('/users', [\App\Http\Controllers\AdminUserController::class, 'index']);
        Route::put('/users/{id}/role', [\App\Http\Controllers\AdminUserController::class, 'setRole']);
        Route::put('/users/{id}/ban', [\App\Http\Controllers\AdminUserController::class, 'setBan']);

        Route::get('/auctions', [\App\Http\Controllers\AdminAuctionController::class, 'index']);
        Route::get('/auctions/{id}/bids', [\App\Http\Controllers\AdminAuctionController::class, 'bids']);

        Route::get('/reports', [\App\Http\Controllers\AdminReportController::class, 'index']);
        Route::put('/reports/{id}/resolve', [\App\Http\Controllers\AdminReportController::class, 'resolve']);
    });
});

Route::get('/listings', [ListingController::class, 'index']);
Route::get('/listings/{id}', [ListingController::class, 'show']);

Route::get('/auctions', [AuctionController::class, 'index']);
Route::get('/auctions/{id}', [AuctionController::class, 'show']);

Route::get('/auctions/{id}/bids', [BidController::class, 'index']);

Route::get('/stats', [PublicStatsController::class, 'show']);

// Local-only email test endpoint (avoid exposing in production).
Route::get('/_debug/test-mail', function (Request $request) {
    abort_unless(app()->environment('local'), 404);

    $data = $request->validate([
        'to' => ['required', 'email'],
    ]);

    Mail::raw('SMTP test from Laravel', function ($message) use ($data) {
        $message->to($data['to'])->subject('Laravel Gmail SMTP test');
    });

    return response()->json([
        'ok' => true,
        'message' => 'Test mail sent (check inbox/spam).',
        'to' => $data['to'],
        'mailer' => config('mail.default'),
        'host' => config('mail.mailers.smtp.host'),
        'port' => config('mail.mailers.smtp.port'),
    ]);
});

