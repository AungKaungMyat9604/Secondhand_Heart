<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->string('sale_type')->default('auction')->after('condition'); // auction|sellings
            $table->string('status')->default('pending_approval')->after('sale_type');
            $table->dateTime('sold_at')->nullable()->after('status');
            $table->foreignId('sold_to_user_id')->nullable()->after('sold_at')->constrained('users')->nullOnDelete();

            $table->index(['status', 'created_at']);
        });

        // Backfill existing rows based on is_approved.
        DB::table('listings')->where('is_approved', false)->update(['status' => 'pending_approval']);
        DB::table('listings')->where('is_approved', true)->update(['status' => 'ready']);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('listings', function (Blueprint $table) {
            $table->dropIndex(['status', 'created_at']);
            $table->dropConstrainedForeignId('sold_to_user_id');
            $table->dropColumn('sold_at');
            $table->dropColumn('status');
            $table->dropColumn('sale_type');
        });
    }
};

