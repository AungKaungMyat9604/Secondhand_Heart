# Auction rules (MVP)

## Discovery / catalog

- **`GET /api/auctions`** with **no `status` query** returns only auctions whose **`ends_at` is still in the future** (live/upcoming window).
- To include completed auctions, call **`GET /api/auctions?status=ended`** (see [`API.md`](API.md)).
- The default Browse and `/auctions` pages in the SPA call **`GET /api/auctions` without `status`**, so **ended auctions are not listed there** unless the UI is extended to pass `status=ended`.

## Bidding

- A bid is rejected once **`ends_at`** has passed (auction is treated as ended).
- A user **cannot** bid on **their own** listing (same seller as the auction listing).
- Each bid must be at least **`current_highest_bid + min_increment`** when there is at least one bid.
- If there are **no bids yet**, the first valid bid must be at least **`starting_bid`**.
- Concurrent bids on the same auction are serialized with a DB transaction and row lock; losing races get **409** `BID_TOO_LOW` (see [`API.md`](API.md)).

## Winning

- The **highest bid when the auction ends** wins; **`winner_id`** is set from that bid.
- After the auction ends, **winner** and **seller** can call **`GET /api/auctions/{id}/contact`** (authenticated) to view each other’s **profile contact fields** in the response.

## Tie-breaking

- If two bids have the **same amount**, the bid with the **higher `bids.id`** (created later) wins.

## Live updates (SPA)

- While an auction detail page shows **`status === active`**, the React client **polls** auction state and bid history every **3 seconds** (`AuctionDetailPage`).

## Notifications

- When you are **outbid**, you receive:
  - an **in-app notification**
  - an **email** (`AuctionOutbidNotification`), if mail is configured and sending succeeds.
- When an auction **ends**:
  - **Winner** (if any): **in-app** (`auction_ended_winner`) + **email** (`AuctionWonNotification`).
  - **Seller**: **in-app** (`auction_ended_seller`) only — **no seller email** is sent on auction end in the current codebase.

## Scheduler

Reliable transition to **ended** status plus one-time end notifications should assume Laravel’s scheduler runs **`auctions:process-due`** every minute (see [`README.md`](../README.md) and [`PROJECT.md`](PROJECT.md)).
