<?php

namespace App\Notifications;

use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ListingApprovedNotification extends Notification
{
    use Queueable;

    public function __construct(public readonly Listing $listing)
    {
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
        $id = $this->listing->id;
        $title = (string) ($this->listing->title ?? 'Listing');
        $frontendUrl = rtrim((string) env('FRONTEND_URL', 'http://localhost:5174'), '/');
        $url = "{$frontendUrl}/browse/listings/{$id}";

        return (new MailMessage)
            ->subject('Secondhand Heart: Your listing was approved')
            ->line("Good news! Your listing was approved: #{$id}")
            ->line($title)
            ->action('View listing', $url)
            ->line('If you did not create this listing, you can ignore this message.');
    }
}

