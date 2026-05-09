---
name: DB migration + seed (Laravel)
description: Safely evolve MySQL schema with Laravel migrations, factories, and seeders.
---

## When to use
Use when adding/changing tables for auctions/listings/bids/users/admin features.

## Steps
1. **Model the data**
   - Identify entities + relationships (Auction ↔ Listing, Auction ↔ Bid, Bid ↔ User).
   - Decide indexing needs:
     - `bids(auction_id, amount)` or `(auction_id, created_at)`
     - `auctions(status, ends_at)`

2. **Write migration**
   - Use proper column types for money (decimal).
   - Add foreign keys and indexes.
   - Consider soft deletes for listings if moderation is needed.

3. **Factories/seeders**
   - Create realistic seed data for:
     - sample listings
     - active auctions
     - multiple bids per auction

4. **Backward compatibility**
   - For non-trivial changes, prefer additive migrations (add column → backfill → later drop).

5. **Docs**
   - Update `API.md` or docs if schema changes affect responses/requests.
