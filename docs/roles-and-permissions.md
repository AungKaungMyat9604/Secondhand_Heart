# Roles and permissions (MVP)

There is no separate “buyer” account type: any **`user`** can both **list** items and **bid** on others’ auctions, unless restricted below.

## Roles

| Role | Meaning |
|------|---------|
| **`user`** | Default. Create/manage own listings and auctions; bid; profile; notifications; reports; sellings contact (when allowed). |
| **`admin`** | Everything **`user`** can do, plus `/api/admin/*`: approve/edit/remove listings, manage users (role + ban), inspect auctions and bids, resolve reports. |

`role` is stored on `users` and enforced by the **`admin`** middleware on admin routes.

## Email verification

- **`POST /api/login`** succeeds only if **`email_verified_at`** is set.
- **`POST /api/register`** creates an unverified user and sends a verification code; until verified, the user must complete **`POST /api/email/verification/verify`** (or equivalent flow).

## Listings

- **Seller** (listing owner): create (`POST /api/listings`), list own (`GET /api/my/listings`), view own detail (`GET /api/my/listings/{id}`), update/delete own (`PUT`/`DELETE /api/listings/{id}`) subject to status locks (e.g. cannot edit while `in_auction` / `auction_ended` per controller rules).
- **Public catalog** (`GET /api/listings`): only **`is_approved`** listings with **`status === ready`** (plus optional `sale_type` / search filters).
- **Public detail** (`GET /api/listings/{id}`): requires **`is_approved`**; does **not** require login.

## Auctions and bids

- **Authenticated** users may **`POST /api/auctions/{id}/bids`** unless they are the **seller** of that auction’s listing.
- **Seller** creates auctions only for their own **approved**, **`ready`**, **`auction`** listings (`POST /api/auctions`).
- **`GET /api/my/auctions`**: auctions whose listing belongs to the current user.

## Contact exchange

### After auction ends

- **`GET /api/auctions/{id}/contact`**: only **`seller`** or **`winner`** after end; returns the other party’s contact profile fields.

### Sellings listings

- **`GET /api/listings/{id}/contact`**: viewer must be authenticated and **not** the seller; listing must be **`sellings`**, **`ready`**, **`is_approved`**; seller must **not** be banned.

## Admin capabilities (summary)

Aligned with [`backend/routes/api.php`](../backend/routes/api.php):

- Listings: browse all (including soft-deleted via filters), pending queue, approve, edit fields, remove.
- Users: list, change **`role`**, ban/unban.
- Auctions: list with filters; view paginated bids with bidder identity on bid rows.
- Reports: list; mark resolved.

## Buyer-style behavior

- Browse public listings and auctions (no login).
- Bidding, notifications, reports, contact endpoints, and “my” views require login + token.
