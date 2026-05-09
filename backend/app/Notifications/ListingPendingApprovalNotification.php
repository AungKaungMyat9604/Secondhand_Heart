<?php

namespace App\Notifications;

use App\Models\Listing;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ListingPendingApprovalNotification extends Notification
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
        $url = "{$frontendUrl}/admin/listings";

        return (new MailMessage)
            ->subject('Secondhand Heart: Listing awaiting approval')
            ->line("A new listing is awaiting approval: #{$id}")
            ->line($title)
            ->action('Open admin listings', $url)
            ->line('Review the listing details and approve/reject as needed.');
    }
}

