<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;
use App\Actions\RefreshAuctionStatus;
use App\Models\Auction;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

Artisan::command('auctions:process-due', function (RefreshAuctionStatus $refresher) {
    $now = now();
    $processed = 0;

    Auction::query()
        ->where('ends_at', '<=', $now)
        ->where(function ($q) {
            $q->where('status', '!=', 'ended')
                ->orWhereNull('ended_notified_at');
        })
        ->orderBy('id')
        ->chunkById(100, function ($auctions) use (&$processed, $refresher) {
            foreach ($auctions as $auction) {
                $refresher->refresh($auction);
                $processed++;
            }
        });

    $this->info("Processed {$processed} due auctions.");
})->purpose('End due auctions and emit notifications');

Schedule::command('auctions:process-due')->everyMinute();
