# API reference (implemented)

Base URL in development: `http://127.0.0.1:8000` (prefix all paths with `/api`).

## Conventions

- **JSON** request/response unless uploading multipart for listing images (`POST`/`PUT` listings with `multipart/form-data`).
- **Errors**: typical shape `{ "message": string, "errors"?: Record<string, string[]> }` for validation failures.
- **Pagination**: list endpoints return `{ "data": [...], "meta": { "current_page", "last_page", "per_page", "total" } }` unless noted.
- **Auth**: `Authorization: Bearer <token>` for routes inside the `auth.token` middleware group in [`backend/routes/api.php`](../backend/routes/api.php).

## Concurrency / “same time” behavior

### Creating listings at the exact same time

Each request inserts a **separate row**; the database assigns a unique `id`, so there is **no accidental duplication** from concurrency alone. Double-submit from the same client can still create two similar listings unless the UI disables repeat submits or the API gains idempotency keys.

### Bidding at the exact same time

Bid placement runs inside a **database transaction** and locks the auction row with `lockForUpdate()` in [`BidController`](../backend/app/Http/Controllers/BidController.php). Bids for the same auction are processed **serially**.

- First valid bid wins the race.
- A bid that is too low after another bid commits returns **409** with `code: "BID_TOO_LOW"`, plus `current_highest_bid` and `min_required` when applicable.

---

## Public routes (no auth)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/register` | Create user; sends email verification code |
| POST | `/api/login` | Returns bearer token (requires verified email) |
| POST | `/api/email/verification/request` | Resend verification code (throttle **5/min**) |
| POST | `/api/email/verification/verify` | Verify code (throttle **10/min**) |
| POST | `/api/password/forgot/request` | Issue reset code (throttle **5/min**) |
| POST | `/api/password/forgot/reset` | Reset password with code (throttle **10/min**) |
| GET | `/api/listings` | Approved **`status=ready`** listings only |
| GET | `/api/listings/{id}` | Listing detail (requires `is_approved`) |
| GET | `/api/auctions` | Auction index (see query params below) |
| GET | `/api/auctions/{id}` | Auction detail (refreshes derived status) |
| GET | `/api/auctions/{id}/bids` | Bid history (**latest 50** bids) |
| GET | `/api/stats` | Public dashboard counters |

### Query parameters

**`GET /api/listings`**

| Param | Notes |
|-------|--------|
| `page`, `per_page` | `per_page` clamped 1–100 |
| `sale_type` | `auction` \| `sellings` |
| `q` | Search title, description, condition |

**`GET /api/auctions`**

| Param | Notes |
|-------|--------|
| `page`, `per_page` | `per_page` clamped 1–100 |
| `q` | Search listing title |
| `status` | Optional: `scheduled` \| `active` \| `ended`. **If omitted**, only auctions with **`ends_at > now()`** are returned. |

---

## Authenticated routes (`auth.token`)

| Method | Path | Purpose |
|--------|------|---------|
| POST | `/api/logout` | Invalidate current token |
| GET | `/api/me` | Current user |
| GET | `/api/profile` | Profile + contact fields |
| PUT | `/api/profile` | Update profile |
| POST | `/api/listings` | Create listing (multipart images) |
| GET | `/api/my/listings` | Seller’s listings |
| GET | `/api/my/listings/{id}` | Seller detail (any of own listings) |
| PUT | `/api/listings/{id}` | Update listing (multipart) |
| DELETE | `/api/listings/{id}` | Soft-delete own listing |
| GET | `/api/listings/{id}/contact` | Sellings seller contact (guarded) |
| POST | `/api/listings/{id}/reports` | Report listing |
| POST | `/api/listings/{id}/confirm-sold` | Auction listing: confirm/not sold after end |
| POST | `/api/listings/{id}/mark-buy-now-sold` | Sellings: mark sold |
| POST | `/api/auctions` | Create auction for ready auction listing |
| GET | `/api/my/auctions` | Seller’s auctions |
| GET | `/api/my/bids` | Distinct auctions user bid on + latest bid meta |
| GET | `/api/my/wins` | Ended auctions where user is `winner_id` |
| POST | `/api/auctions/{id}/bids` | Place bid (throttle **20/min**) |
| GET | `/api/auctions/{id}/contact` | Winner/seller contact exchange |
| GET | `/api/notifications` | In-app notifications |
| POST | `/api/notifications/{id}/read` | Mark read |

### `GET /api/my/listings`

| Param | Notes |
|-------|--------|
| `page`, `per_page` | |
| `sale_type` | `auction` \| `sellings` |
| `status` | Listing status filter |
| `q` | Search |

### `GET /api/my/auctions`

| Param | Notes |
|-------|--------|
| `page`, `per_page` | |
| `status` | `scheduled` \| `active` \| `ended` |
| `q` | Search listing title |

### `GET /api/my/bids`

Returns rows with `auction_id`, `listing`, `status`, **`is_winner`** (bool), `ends_at`, `your_latest_bid`.

| Param | Notes |
|-------|--------|
| `page`, `per_page` | |
| `q` | Search listing title |

### `GET /api/my/wins`

| Param | Notes |
|-------|--------|
| `page`, `per_page` | |
| `q` | Search listing title |

---

## Admin routes (`auth.token` + `admin`)

All prefixed `/api/admin`.

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/admin/listings` | All listings (with trashed), filters |
| GET | `/api/admin/listings/pending` | Pending approval subset |
| GET | `/api/admin/listings/{id}` | Admin listing detail |
| PUT | `/api/admin/listings/{id}/approve` | Approve listing |
| PUT | `/api/admin/listings/{id}` | Edit listing |
| DELETE | `/api/admin/listings/{id}` | Remove listing |
| GET | `/api/admin/users` | User list |
| PUT | `/api/admin/users/{id}/role` | Set role |
| PUT | `/api/admin/users/{id}/ban` | Ban/unban |
| GET | `/api/admin/auctions` | Auction audit list |
| GET | `/api/admin/auctions/{id}/bids` | Paginated bids + bidder info |
| GET | `/api/admin/reports` | Reports list |
| PUT | `/api/admin/reports/{id}/resolve` | Resolve report |

### `GET /api/admin/listings`

| Param | Notes |
|-------|--------|
| `filter` | `all` (default) \| `pending` |
| `page`, `per_page` | |
| `q` | Search |
| `sale_type` | `auction` \| `sellings` |
| `status` | Listing status |
| `removed` | `0` not soft-deleted, `1` soft-deleted, `only` only removed |

### `GET /api/admin/auctions`

| Param | Notes |
|-------|--------|
| `page`, `per_page` | |
| `status` | `scheduled` \| `active` \| `ended` |
| `q` | Search listing title |

---

## Local-only debug

| Method | Path | Notes |
|--------|------|--------|
| GET | `/api/_debug/test-mail?to=email` | **404** unless `APP_ENV=local`; sends raw test email |

---

## Common HTTP status codes

| Code | When |
|------|------|
| 401 | Missing/invalid token on protected routes |
| 403 | Forbidden (e.g. not listing owner, not admin); login with **unverified email** |
| 404 | Resource hidden (`Not found` on some public listing/contact paths) |
| 409 | Bid too low (`code: BID_TOO_LOW`) |
| 422 | Validation / business rule (e.g. cannot bid on own listing, auction ended) |
| 429 | Throttled routes |

---

## Deeper documentation

- Architecture and flows: [`PROJECT.md`](PROJECT.md)
- Bidding rules: [`auction-rules.md`](auction-rules.md)
- Roles: [`roles-and-permissions.md`](roles-and-permissions.md)
