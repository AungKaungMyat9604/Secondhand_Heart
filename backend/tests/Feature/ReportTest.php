<?php

namespace Tests\Feature;

use App\Models\ApiToken;
use App\Models\Listing;
use App\Models\Report;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Str;
use Tests\TestCase;

class ReportTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_report_listing(): void
    {
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-r@example.com',
            'password' => 'password123',
        ]);
        $reporter = User::query()->create([
            'name' => 'Reporter',
            'email' => 'reporter@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Toy',
            'is_approved' => true,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $reporter->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->postJson("/api/listings/{$listing->id}/reports", [
            'reason' => 'This listing looks suspicious and contains inappropriate content.',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertCreated();

        $this->assertDatabaseHas('reports', [
            'listing_id' => $listing->id,
            'reporter_id' => $reporter->id,
            'status' => 'open',
        ]);
    }

    public function test_admin_can_resolve_report(): void
    {
        $admin = User::query()->create([
            'name' => 'Admin',
            'email' => 'admin-r@example.com',
            'password' => 'password123',
            'role' => 'admin',
        ]);
        $seller = User::query()->create([
            'name' => 'Seller',
            'email' => 'seller-r2@example.com',
            'password' => 'password123',
        ]);
        $reporter = User::query()->create([
            'name' => 'Reporter',
            'email' => 'reporter2@example.com',
            'password' => 'password123',
        ]);

        $listing = Listing::query()->create([
            'seller_id' => $seller->id,
            'title' => 'Toy',
            'is_approved' => true,
            'location_city' => 'Yangon',
            'location_region' => 'Yangon Region',
        ]);

        $report = Report::query()->create([
            'reporter_id' => $reporter->id,
            'listing_id' => $listing->id,
            'reason' => 'Bad content',
            'status' => 'open',
        ]);

        $plain = Str::random(80);
        ApiToken::query()->create([
            'user_id' => $admin->id,
            'name' => 'api',
            'token_hash' => hash('sha256', $plain),
            'expires_at' => now()->addDay(),
        ]);

        $this->putJson("/api/admin/reports/{$report->id}/resolve", [
            'admin_notes' => 'Resolved after review',
        ], [
            'Authorization' => 'Bearer '.$plain,
        ])->assertOk();

        $this->assertDatabaseHas('reports', [
            'id' => $report->id,
            'status' => 'resolved',
        ]);
    }
}

