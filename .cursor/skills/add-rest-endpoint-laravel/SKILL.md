---
name: Add REST endpoint (Laravel)
description: Add a new Laravel REST endpoint with validation, authorization, consistent responses, and tests.
---

## When to use
Use this for any new Laravel API route (GET/POST/PUT/DELETE).

## Steps
1. **Define contract**
   - Method + path
   - Auth requirement
   - Request body/query params
   - Response shape + error shape

2. **Implement in Laravel**
   - Route in `routes/api.php` (or consistent file)
   - Controller method (thin)
   - `FormRequest` for validation
   - `Policy`/`Gate` for authorization + `authorize()` call
   - Service/action for business logic
   - `JsonResource` (or consistent transformer) for responses

3. **Safety**
   - Wrap state changes in DB transactions as needed
   - Rate limit if endpoint is sensitive (bidding/auth)

4. **Tests**
   - Feature test covers:
     - unauthorized/forbidden
     - validation failure
     - success response

5. **Docs**
   - Add endpoint to `API.md` or OpenAPI spec
