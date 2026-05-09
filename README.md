# Secondhand Heart (Toys Auction)

Monorepo:
- `backend/` Laravel (REST API + MySQL)
- `frontend/` React + Bootstrap (SPA)
- `docs/` documentation

## Documentation

- **[Full project reference](docs/PROJECT.md)** — architecture, lifecycles, flows, notifications, routes, operations.
- **[API reference](docs/API.md)** — implemented endpoints, query params, errors.
- **[Auction rules](docs/auction-rules.md)** — bidding, winning, polling, catalog behavior.
- **[Roles and permissions](docs/roles-and-permissions.md)** — auth, admin, contact rules.

The home page loads summary counters from **`GET /api/stats`** (`PublicStatsController`).

## Prerequisites
- PHP + Composer
- Node.js + npm
- MySQL

## Backend (Laravel)

From `backend/`:

```bash
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan serve
```

API default URL: `http://127.0.0.1:8000`

## Scheduler (auction endings)

Due auctions are finalized by the Artisan command `auctions:process-due`, which ends auctions whose `ends_at` has passed, syncs listing status, and sends one-time winner/seller notifications. It is registered in `backend/routes/console.php` to run **every minute** via Laravel’s scheduler.

**Development:** keep `php artisan serve` running, and in a **second terminal** from `backend/`:

```bash
php artisan schedule:work
```

That long-running process invokes `schedule:run` about once per minute so you do not need system cron locally.

**Production:** configure the OS cron (or your platform’s scheduler) to call Laravel every minute, for example:

```cron
* * * * * cd /path/to/backend && php artisan schedule:run >> /dev/null 2>&1
```

Use the same `php` binary your app runs under (e.g. `/usr/bin/php` or Homebrew’s path).

**One-off check:** from `backend/`:

```bash
php artisan auctions:process-due
```

If the scheduler is never started, auctions can still move to `ended` when code paths call `RefreshAuctionStatus` (for example loading an auction or placing a bid after the end time), but **reliable** timely endings and notifications assume `schedule:work` (dev) or `schedule:run` via cron (production).

## Auth (MVP)
- Registration sends an **email verification** code; **`POST /api/login` returns 403** until the email is verified.
- Login returns an API token.
- Frontend sends `Authorization: Bearer <token>` for authenticated requests.

## Concurrency notes
- **Listings**: multiple users can create listings “at the same time”; each request creates a separate row with a unique id (no duplication from concurrency alone).
- **Bids**: concurrent bids on the same auction are protected by a DB transaction + row lock; too-low bids return **409** with the current highest bid (see `docs/API.md`).

## Email notifications (optional)
Laravel Mail drives verification codes, password reset, listing approval flows, outbid alerts, and **winner** auction-end mail. Configure in `backend/.env`, for example:
- `MAIL_MAILER`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_ENCRYPTION`
- `MAIL_FROM_ADDRESS`
- `FRONTEND_URL` (links in emails to the SPA)

See [`docs/PROJECT.md`](docs/PROJECT.md) for which events send email vs in-app only.

## Frontend (React)

From `frontend/`:

```bash
npm install
npm run dev
```

Frontend default URL: `http://localhost:5173` (Vite may pick another port if busy; use the URL printed in the terminal.)

Optional environment variable (frontend):
- `VITE_API_BASE_URL` (defaults to `http://127.0.0.1:8000`)

## Demo steps (presentation)
1. Register a **seller** and verify email; create a listing (`/listings/new`).
2. Log in as **Admin** and approve/edit/remove listings (`/admin/listings`).
3. Seller creates an auction from an approved listing (`/auctions/new`) with:
   - starting bid
   - min increment
   - end time
4. As a **buyer** (second account or same account after listing work): open **Browse → Auctions**, open an auction (`/browse/auctions/:id`), place bids. Legacy URL `/auctions/:id` redirects to `/browse/auctions/:id`.
5. Outbid flow:
   - previous top bidder gets **in-app notification** (`/notifications`)
   - and **email** (if mail configured)
6. After auction ends (run `php artisan schedule:work` in dev so endings fire on time):
   - **Winner**: in-app + email (if mail configured). **Seller**: in-app summary on auction end (no seller email in current code).
   - **Contact exchange** on the auction page (`/browse/auctions/:id`) for seller + winner.
7. Reporting:
   - authenticated user reports from a listing detail (e.g. browse listing page)
   - admin resolves reports (`/admin/reports`)

