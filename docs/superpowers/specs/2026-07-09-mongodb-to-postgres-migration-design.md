# MongoDB → PostgreSQL Migration Design

**Date:** 2026-07-09
**Status:** Approved design, pending implementation plan
**Scope:** Backend data layer only (`backend/`). Frontend and Redis/BullMQ untouched.

## Motivation

Finpay is a payments application. Its data is deeply relational and correctness-critical, three concrete problems motivate the move to PostgreSQL:

1. **Relational integrity.** The domain is relational, not document-shaped. `User` alone holds 10 `ObjectId` refs; wallets, transaction history, groups, requests, and notifications are all reference arrays. These relationships are currently maintained by hand with no database-enforced integrity. Postgres gives foreign keys, `CHECK` constraints, uniqueness, and enums enforced at the database.
2. **Money stored as float.** `walletBalance` and transaction amounts are Mongoose `Number` (IEEE-754 float). `doc.walletBalance += delta` on a float is a real correctness bug for money. The migration moves all money to `NUMERIC(19,4)`.
3. **Reporting / queries.** Statements, admin dashboards, and analytics are natural SQL joins/aggregates instead of hand-rolled application-side joins over ref arrays.

**Not a motivation:** ACID. MongoDB already provides ACID multi-document transactions, and this codebase already uses them (`mongoose.startSession()` + `session.withTransaction`). The move is about relational integrity, correct money types, and query ergonomics — not gaining transactions.

## Guiding principle

Database access is already isolated behind two seams per module:

- **Repository interfaces** (e.g. `ITransactionRepository`) whose methods return plain `*Record` shapes via hand-written mappers (`toUserRecord`, `toWalletRecord`).
- **A single `withTransaction` function** per module container — the only place that touches the DB runtime for transactions. Services receive an opaque `session`/`tx` and thread it into repo calls.

Migration = swap the implementations behind these seams. **Services, controllers, routes, and the `*Record` types do not change.** The repo method signatures and their return shapes stay identical; only their internals switch from Mongoose to Drizzle. The `withTransaction` internals switch from `session.withTransaction` to `db.transaction`, keeping the `(fn) => Promise<T>` signature.

No production data exists, so this is a hard swap plus reseed: no ETL, no dual-write, no cutover.

## Technology choices

| Concern | Choice | Reason |
|---|---|---|
| Driver/ORM | **Drizzle ORM** + `pg` | SQL-first, thin (no separate query engine), typed, constraints expressed in schema, migrations via `drizzle-kit`. `db.transaction(async (tx) => …)` maps 1:1 onto the existing `withTransaction(session)` seam. |
| Migrations | `drizzle-kit` | Schema-first, generates SQL migrations from the Drizzle schema. |
| Test database | **PGlite** | In-process Postgres (pure JS), no Docker required for tests. Replaces `mongodb-memory-server`. Run Drizzle migrations against it per suite. |

## Schema design (normalized)

15 Mongoose models become Postgres tables. General rules:

- Primary key: `id uuid primary key default gen_random_uuid()`.
- Timestamps: `created_at` / `updated_at timestamptz`, `updated_at` maintained by the app (Drizzle `$onUpdate`) or a trigger.
- **Money:** `NUMERIC(19,4)` for `walletBalance`, `amountSrc`, `amountDest`, and any other monetary field. Never float.
- **Enums:** Postgres `enum` types for `accountType` (`personal|business`) and `rank` (`bronze|silver|gold|platinum`).
- **Constraints:** `CHECK (wallet_balance >= 0)`, `UNIQUE(email)` on users, FKs with explicit `ON DELETE` rules.

### Normalization decisions

- **Drop redundant back-reference arrays.** `User.walletInfo[]`, `User.transactionHistory[]`, `User.request[]`, `User.notification[]` all duplicate a foreign key that already lives (or will live) on the child row. In Postgres the child owns the FK (`wallets.user_id`, `transactions.from_account` / `to_account`, `requests.user_id`, `notifications.user_id`) and these are queried, not stored as arrays.
- **Real many-to-many → join tables.** Group membership becomes `group_members (user_id, group_id)`. `UserChallengeProgress` is already its own entity → its own table with FKs.
- **Scalar arrays.** `tokens[]` and `existingPassword[]` become `text[]` columns (lazy-correct; promote to child tables only if they later need per-row metadata or querying).
- **`Invitation`, `Request`, `Notification`, `ScheduledPayment`, `BankInfo`, `BioData`, `Address`, `TransactionHistory`, `TransactionItem`, `Otp`, `WalletInfo`, `Groups`** become tables with FK columns replacing their `ObjectId` refs.

### Table inventory

`users`, `wallets`, `transactions` (from `TransactionHistory`), `transaction_items`, `bank_info`, `bio_data`, `addresses`, `groups`, `group_members` (join), `invitations`, `requests`, `notifications`, `scheduled_payments`, `challenges`, `user_challenge_progress`, `otps`.

## Data-access layer changes

- `backend/lib/mongoClient.ts` → `backend/lib/db.ts`: create the Drizzle instance over a `pg` pool using `DATABASE_URL`. Export `db` and the transaction helper primitive.
- **Per module `*.repository.ts`:** rewrite query bodies to Drizzle. Keep the exported interface and every `*Record` mapper output byte-identical, so services are unaffected. Example: `transactionRepository.adjustWalletBalance(walletId, delta, tx)` still returns the new balance `number` (converted from `NUMERIC` at the mapper boundary — decide string vs number representation in the plan; money crossing into JS must not silently re-enter float territory for arithmetic).
- **Per module `*.container.ts`:** rewrite `withTransaction` from `mongoose.startSession()` to `db.transaction(async (tx) => …)`. Signature stays `<T>(fn: (tx) => Promise<T>) => Promise<T>`. Rename the threaded parameter `session` → `tx`; the threading pattern is unchanged.

## Infrastructure and config

- `docker-compose.yaml`: add a `postgres` service (with a named volume). Leave `redis` as-is.
- Env: replace `MONGO_URI` with `DATABASE_URL` in code and in both `backend/.env.example` and runtime config. Frontend `.env.example` unchanged.
- `package.json`: remove `mongodb`, `mongoose`, `mongodb-memory-server`; add `drizzle-orm`, `pg`, `@types/pg`, `drizzle-kit`, and the PGlite test dependency.
- Add `drizzle.config.ts` and npm scripts for `drizzle-kit generate` / `migrate`.

## Testing

- `backend/__tests__/setup/setup.ts`: replace `mongodb-memory-server` with PGlite. Spin up an in-process Postgres, run the generated Drizzle migrations, expose the `db` handle to tests, reset between suites.
- The transaction module's rollback test is the acceptance gate for the ACID path: a mid-operation throw must leave balances and history unchanged.

## Order of work

Each step is independently verifiable (build + its module's tests green).

1. **Scaffold.** `lib/db.ts`, `drizzle.config.ts`, `postgres` in compose, PGlite test harness, env swap.
2. **Schema.** All 15 tables + constraints + enums in the Drizzle schema; generate the first migration.
3. **Leaf modules** (no cross-refs): `otp`, `exchange`, `bank`, `profile`.
4. **Core path:** `user`, `wallet`, `transaction`. Verify the transaction rollback test passes against Postgres.
5. **Relational modules:** `group`, `request`, `challenge`, `notification`, `scheduledPayment`, `invitation`, `admin`.
6. **Remove Mongo:** delete `backend/model/`, `lib/mongoClient.ts`, and the Mongo dependencies. Grep-verify no residual `mongoose`/`ObjectId`/`MongoClient` references.

## Risks and edge cases

- **Schema-eval-time defaults.** Mongo sets some defaults at schema evaluation, e.g. `depositId: new UUID()` and `lastNotificationSeen: new Date()` — these are effectively constant per process start in Mongoose. Convert to real DB defaults (`gen_random_uuid()`, `now()`).
- **Raw ObjectId comparisons.** Any service comparing `String(_id)` or passing raw ObjectIds must be grepped and updated to uuid strings. The `*Record` shapes already expose `id: string`, which contains the blast radius.
- **Money representation at the JS boundary.** `NUMERIC` comes back from `pg` as a string. The plan must define where/whether it converts to `number`, and ensure balance arithmetic does not reintroduce float error. Prefer doing arithmetic in SQL (`balance = balance + $delta`) inside the transaction rather than read-modify-write in JS.
- **Redis / BullMQ untouched.** Queues and workers are not a database concern; they keep using `REDIS_URL`.

## Out of scope

ETL / data migration, dual-write, phased cutover (no production data). Frontend changes. Redis/queue changes. Any new features.
