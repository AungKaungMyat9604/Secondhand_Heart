---
name: Fix bug (triage → regression test → fix)
description: Systematically reproduce and fix a bug with a regression test.
---

## Steps
1. **Reproduce**
   - Capture exact steps, expected vs actual behavior.
   - Determine if backend, frontend, or contract mismatch.

2. **Isolate**
   - Find the failing endpoint/component/state transition.
   - Check logs and error responses.

3. **Add regression test first**
   - Backend bug: Laravel feature/unit test.
   - Frontend bug: component/integration test if available; otherwise a documented manual test.

4. **Fix**
   - Prefer small, focused changes.
   - For bidding/auction bugs, re-check atomicity, authorization, and timing rules.

5. **Verify**
   - Tests pass.
   - Manual check for the original steps.

## Output
- A short summary of root cause + fix
- A test that prevents recurrence
