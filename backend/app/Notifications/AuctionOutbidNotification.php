<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class AuctionOutbidNotification extends Notification
{
    use Queueable;

    public function __construct(
        public readonly int $auctionId,
        public readonly ?string $listingTitle,
        public readonly ?string $newHighestBid,
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
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5174'), '/');
        $url = "{$frontendUrl}/browse/auctions/{$this->auctionId}";

        $m = (new MailMessage)
            ->subject('Secondhand Heart: You were outbid')
            ->line("You were outbid on auction #{$this->auctionId}.");

        if ($this->listingTitle) {
            $m->line("Listing: {$this->listingTitle}");
        }
        if ($this->newHighestBid) {
            $m->line("New highest bid: {$this->newHighestBid}");
        }

        return $m
            ->action('View auction', $url)
            ->line('Place a higher bid if you still want to win.');
    }
}

