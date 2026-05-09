---
name: Add auction feature (end-to-end)
description: Implement a new auction-related feature across Laravel API + React UI with tests and docs.
---

## When to use
Use this skill when adding or changing an auction flow (listing, bidding, auction lifecycle, notifications).

## Inputs to collect (ask user if missing)
- Feature goal (what user can do)
- Target roles (buyer/seller/admin)
- Success criteria + edge cases
- Whether updates should be real-time (broadcasting) or acceptable via polling

## Steps
1. **Design the contract**
   - Define REST endpoints (routes, request body, response shape, error shape).
   - Define DB changes (migrations).
   - Update docs plan (`API.md` / `docs/openapi.yaml`, `docs/auction-rules.md` if rules change).

2. **Backend: Laravel**
   - Create migration(s) + model changes.
   - Add FormRequest validation.
   - Add Policy/authorization for the action.
   - Implement service/action with DB transaction where bidding/auction state changes happen.
   - Add controller + route(s).
   - Add feature tests including negative cases.

3. **Frontend: React + Bootstrap**
   - Add/extend API client in `src/api/**`.
   - Build UI (form, loading/empty/error states).
   - Handle validation errors and conflict errors (e.g. bid outbid 409).
   - Prevent double-submit.

4. **Docs + verification**
   - Update docs touched by the change.
   - Manual test checklist:
     - happy path
     - at least 2 failure paths

## Definition of done
- Backend tests pass (`php artisan test`)
- Frontend build/dev runs (once present)
- Docs updated for any contract/rule changes
