<?php

namespace App\Notifications;

use App\Models\Auction;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuctionWonNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly Auction $auction,
        public readonly ?string $listingTitle,
        public readonly ?string $winningAmount,
    ) {
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $auctionId = $this->auction->id;
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5174'), '/');
        $url = "{$frontendUrl}/browse/auctions/{$auctionId}";

        $m = (new MailMessage)
            ->subject('Secondhand Heart: You won an auction')
            ->line("Auction #{$auctionId} ended. You won!");

        if ($this->listingTitle) {
            $m->line("Listing: {$this->listingTitle}");
        }
        if ($this->winningAmount) {
            $m->line("Winning bid: {$this->winningAmount}");
        }

        return $m
            ->action('View auction', $url)
            ->line('Open the auction page to view next steps and seller contact (if available).');
    }
}

