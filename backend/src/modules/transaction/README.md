# Module pattern (layered clean architecture)

Reference slice: `transaction/`. Replicate per feature area.

## Layers (one file each)
- `*.types.ts` — DTOs + repository/service interfaces. No imports of Mongoose or Express.
- `*.repository.ts` — the ONLY file that imports `model/*`. Maps Mongoose docs → flat records.
- `*.service.ts` — business logic. Deps (repo + cross-slice functions) injected via `create*Service(deps)`. Throws `http-errors`. No Express, no Mongoose.
- `*.controller.ts` — composition root (wires real deps once) + thin `req`/`res` parsing.
- `*.routes.ts` — `express.Router`, wraps controllers in `asyncHandler`.

## Rules
- Business logic never imports a Mongoose model.
- Preserve exact HTTP behavior when migrating (routes, bodies, status codes, JSON).
- Errors: `throw HTTPError(status, msg)`; `asyncHandler` translates.

## Strangler steps per slice
1. Build `types → service (unit test, fake repo) → repository (integration test)`.
2. Add `controller + routes`; supertest the route.
3. Reduce the old `src/<feature>/<fn>.ts` to a delegate so its existing test stays green.
4. Remove the inline route(s) from `app.ts`; mount the new router.
5. Run the full suite + `tsc --noEmit`. Commit.

## Migration order (by risk/leverage)
1. transaction (done — reference)
2. group topup/withdraw (shares transfer mechanics)
3. auth (login/register/logout/otp)
4. wallet (get/create/delete/currency)
5. profile, challenges, admin, notifications, requests, scheduled payments
6. Last: delete `/test/*` and inline `/admin/checkAllBalanceChallenges` DB logic from `app.ts` (move into services or drop test-only routes).
