<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\User;
use App\Notifications\ListingApprovedNotification;
use App\Notifications\ListingPendingApprovalNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class ListingApprovalNotificationTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_listing_notifies_admins_in_app_and_email(): void
    {
        Notification::fake();

        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin-n1@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-n1@example.com',
            'password' => 'password123',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $seller->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson('/api/listings', [
            'title' => 'Needs approval',
            'description' => 'Good condition',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertCreated();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $admin->id,
            'type' => 'listing_pending_approval',
        ]);

        Notification::assertSentTo($admin, ListingPendingApprovalNotification::class);
    }

    public function test_approving_listing_notifies_seller_in_app_and_email(): void
    {
        Notification::fake();

        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin-n2@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);

        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-n2@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Pending',
            'is_approved' => false,
            'status' => 'pending_approval',
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $admin->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->putJson("/api/admin/listings/{$listing->id}/approve", [], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk();

        $this->assertDatabaseHas('app_notifications', [
            'user_id' => $seller->id,
            'type' => 'listing_approved',
        ]);

        Notification::assertSentTo($seller, ListingApprovedNotification::class);
    }
}

