---
name: Update documentation
description: Keep README/API/auction rules docs consistent with code and contracts.
---

## When to use
Use whenever you change:
- API endpoints / request/response shapes
- authentication approach
- DB schema that affects API outputs
- auction/bidding rules
- setup/run commands

## Docs checklist (update what applies)
- `README.md`
  - prerequisites
  - setup steps
  - env var names (no secrets)
  - run commands (backend/frontend)
  - local URLs/ports
- `API.md` or `docs/openapi.yaml`
  - endpoints, auth, error shapes
  - examples for key endpoints:
    - create listing
    - start auction
    - place bid
    - get auction details
- `docs/auction-rules.md`
  - min increment
  - auction start/end timing rules
  - self-bidding policy
  - outbid notifications (broadcasting vs polling)

## Definition of done
- Docs are accurate and copy-pastable
- Any breaking API change is reflected immediately in docs
