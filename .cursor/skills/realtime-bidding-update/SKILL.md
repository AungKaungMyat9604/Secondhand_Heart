---
name: Real-time bidding updates
description: Implement live bid updates via Laravel broadcasting/WebSockets or fallback polling.
---

## When to use
Use when the UI must update current highest bid without refresh.

## Default approach
- Prefer **Laravel Broadcasting** when available.
- Fallback to **polling** (interval fetch) when sockets aren’t set up yet.

## Broadcasting path (preferred)
1. **Backend**
   - Define a bid-placed domain event (after commit) that includes:
     - auction id
     - current highest bid amount
     - bidder id (optional)
     - timestamp
   - Broadcast on a channel scoped to auction id.
   - Authorize channel subscription (users can only subscribe to public auction data).

2. **Frontend**
   - Subscribe to the auction channel.
   - On event, update local state for:
     - current highest bid
     - “you are highest bidder” indicator (based on bidder id or follow-up fetch)
   - Handle reconnect and initial state load.

## Polling fallback
1. Add a lightweight endpoint:
   - `GET /auctions/{id}` includes current highest bid + status + end time
2. Frontend:
   - Poll every 2–5 seconds while auction is active
   - Stop polling when auction ends or page unmounts

## Definition of done
- Highest bid updates without manual refresh
- No excessive network usage
- Document whether the project uses broadcasting or polling in `docs/auction-rules.md`
