# MongoDB → PostgreSQL Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace MongoDB/Mongoose with PostgreSQL + Drizzle ORM in `backend/`, keeping every module's public repository interface and API serialization identical, while fixing money-as-float and gaining DB-enforced relational integrity.

**Architecture:** DB access is already isolated behind per-module repository interfaces and one `withTransaction` seam per module. Each task swaps a repository's internals from Mongoose to Drizzle without changing its exported interface or the shapes it returns. Storage is normalized (redundant ref arrays dropped, real M:N as join tables), but interfaces that previously returned id-arrays rebuild those arrays via FK/join queries so services stay untouched.

**Tech Stack:** TypeScript, Drizzle ORM, `pg` (node-postgres), `drizzle-kit` (migrations), PGlite (in-process Postgres for tests), Vitest.

## Global Constraints

- **Money type:** all monetary columns are `numeric(19, 4)`. Never `float`/`real`/`double`. Applies to: `wallets.wallet_balance`, `groups.wallet_balance`, `transactions.amount_src`, `transactions.amount_dest`, `requests.amount`, `scheduled_payments.amount_src`, `scheduled_payments.amount_dest`, `transaction_items.amount`, `challenges.amount_to_goal`.
- **Money arithmetic happens in SQL, never read-modify-write in JS.** Balance updates use `SET wallet_balance = wallet_balance + $delta` inside the transaction, not `doc.balance += delta; save()`.
- **Repository interfaces are frozen.** The exported `I*Repository` interface of each module (in `*.types.ts`) and every `*Record` return shape must remain byte-identical. Only internals change. Services, controllers, routes are not edited except where a task explicitly says so.
- **Serialization contract:** any object the API returns that the frontend keys by `_id` must carry an `_id: string` field (the uuid). Drop Mongoose `__v`. The frontend reads `_id` in `frontend/src/components/SplitBill/*` and `frontend/src/pages/GroupHistory.tsx` — do not break these.
- **Primary keys:** `id uuid primary key default gen_random_uuid()`. All FK columns are `uuid`.
- **Enums:** use Postgres `pgEnum`. Values copied verbatim from the Mongoose schemas (listed in Task 2).
- **Test runner:** Vitest. Every module keeps its existing test file passing; new/changed tests use the PGlite harness from Task 3.
- **Node:** v26. **Do not** add a new runtime dependency beyond `drizzle-orm`, `pg`, `@types/pg`, `drizzle-kit`, `@electric-sql/pglite`.

## Array → Relational Mapping (applied throughout)

These Mongoose ref-arrays are **dropped as columns** and rebuilt by query. Every task that touches them uses this table:

| Mongoose array | Normalized storage | How the old array is rebuilt |
|---|---|---|
| `User.walletInfo[]` | `wallets.user_id` FK | `SELECT ... FROM wallets WHERE user_id = $u` |
| `User.transactionHistory[]` | `transactions.from_account` / `to_account` FKs | `SELECT id FROM transactions WHERE from_account = $u OR to_account = $u` |
| `User.request[]` | `requests.user_id` FK | `SELECT ... FROM requests WHERE user_id = $u` |
| `User.groups[]` | `group_members(user_id, group_id)` join | `SELECT group_id FROM group_members WHERE user_id = $u` |
| `User.notification[]` | `notifications.receiver` FK | `SELECT ... FROM notifications WHERE receiver = $u` |
| `User.invitation[]` | `invitations.receiver` FK | `SELECT id FROM invitations WHERE receiver = $u` |
| `User.bioData` (single) | `bio_data.user_id` FK (1:1) | join on `bio_data.user_id = $u` |
| `User.bankInfo` (single) | `bank_info.user_id` FK | join on `bank_info.user_id = $u` |
| `Groups.members[]` | `group_members(user_id, group_id)` join | `SELECT user_id FROM group_members WHERE group_id = $g` |
| `Groups.transactionHistory[]` | `transactions.group_id` FK (nullable) | `SELECT id FROM transactions WHERE group_id = $g` |
| `Groups.pendingInvite[]` | `invitations.group_id` FK | `SELECT id FROM invitations WHERE group_id = $g` |

`$push`/`$pull` on these arrays become INSERT/DELETE on the join table or a no-op (when the FK already records the relationship). Each affected repo method is translated in its module's task.

---

## Task 1: Project scaffold — dependencies, db client, config, infra

**Files:**
- Modify: `backend/package.json` (deps + scripts)
- Create: `backend/lib/db.ts`
- Create: `backend/drizzle.config.ts`
- Modify: `backend/lib/mongoClient.ts` → keep for now (deleted in Task 18); add nothing
- Modify: `docker-compose.yaml` (add postgres service)
- Modify: `backend/.env.example` (swap MONGO_URI → DATABASE_URL)

**Interfaces:**
- Produces: `db` (Drizzle instance over a `pg` Pool), importable as `import { db } from "../../../lib/db"`. Type: `NodePgDatabase<typeof schema>`.
- Produces: `pool` (the `pg.Pool`) for shutdown.

- [ ] **Step 1: Install dependencies**

Run:
```bash
cd backend && npm install drizzle-orm pg && npm install -D drizzle-kit @types/pg @electric-sql/pglite
```
Expected: packages added, no peer-dep errors.

- [ ] **Step 2: Create the Drizzle db client**

Create `backend/lib/db.ts`:
```typescript
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "../src/db/schema";

export const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema });
export type DB = typeof db;
```

- [ ] **Step 3: Create drizzle-kit config**

Create `backend/drizzle.config.ts`:
```typescript
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
});
```

- [ ] **Step 4: Add npm scripts**

In `backend/package.json` `"scripts"`, add:
```json
"db:generate": "drizzle-kit generate",
"db:migrate": "drizzle-kit migrate",
"db:push": "drizzle-kit push"
```

- [ ] **Step 5: Add postgres to docker-compose**

In `docker-compose.yaml`, add under `services:` (keep `redis` as-is):
```yaml
  postgres:
    image: postgres:16
    container_name: postgres-payment
    environment:
      POSTGRES_USER: finpay
      POSTGRES_PASSWORD: finpay
      POSTGRES_DB: finpay
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
```
And under top-level `volumes:` add `postgres_data:`.

- [ ] **Step 6: Update env example**

In `backend/.env.example`, replace the `MONGO_URI` line with:
```
# PostgreSQL connection string
DATABASE_URL=postgresql://finpay:finpay@localhost:5432/finpay
```

- [ ] **Step 7: Verify build compiles (schema not yet present — expect a missing-module error only from db.ts)**

Run: `cd backend && npx tsc --noEmit 2>&1 | grep "src/db/schema" | head`
Expected: the only new error references the not-yet-created `src/db/schema`. Proceed to Task 2 which creates it.

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/lib/db.ts backend/drizzle.config.ts docker-compose.yaml backend/.env.example
git commit -m "chore: scaffold Drizzle + Postgres (db client, config, compose)"
```

---

## Task 2: Drizzle schema — all tables, enums, constraints

**Files:**
- Create: `backend/src/db/schema.ts`
- Create: `backend/src/db/migrations/` (generated)

**Interfaces:**
- Produces: table objects imported as `import { users, wallets, transactions, ... } from "../../db/schema"`.
- Produces: inferred row types via `typeof users.$inferSelect` / `$inferInsert`, used by repos for their internal mapping.

- [ ] **Step 1: Write the schema file**

Create `backend/src/db/schema.ts`. Column names are snake_case; money is `numeric(19,4)`; enums copied verbatim from the Mongoose models.

```typescript
import {
  pgTable, uuid, text, numeric, integer, boolean, timestamp, pgEnum,
  primaryKey, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// --- Enums (values verbatim from Mongoose schemas) ---
export const accountTypeEnum = pgEnum("account_type", ["personal", "business"]);
export const rankEnum = pgEnum("rank", ["bronze", "silver", "gold", "platinum"]);
export const bankAccountTypeEnum = pgEnum("bank_account_type", ["savings", "checking"]);
export const notificationTypeEnum = pgEnum("notification_type", ["Mission", "Transfer", "Request", "Invitation"]);
export const challengeCategoryEnum = pgEnum("challenge_category", ["pay", "receive", "save"]);
export const transactionItemTypeEnum = pgEnum("transaction_item_type", ["Deposit", "Withdraw"]);
export const scheduledStatusEnum = pgEnum("scheduled_status", ["pending", "processing", "completed", "failed", "cancelled"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
};

// --- users ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  existingPassword: text("existing_password").array().notNull().default(sql`'{}'`),
  password: text("password").notNull(),
  passwordLength: integer("password_length"),
  bankInfoId: uuid("bank_info_id"),
  bioDataId: uuid("bio_data_id"),
  accountType: accountTypeEnum("account_type").notNull().default("personal"),
  tokens: text("tokens").array().notNull().default(sql`'{}'`),
  selfUserId: uuid("self_user_id"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordTokenExpiryDate: numeric("reset_password_token_expiry_date"),
  isVerified: boolean("is_verified").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  kycImg: text("kyc_img"),
  profileImg: text("profile_img"),
  lastNotificationSeen: timestamp("last_notification_seen", { withTimezone: true }).defaultNow(),
  depositId: uuid("deposit_id").notNull().defaultRandom(),
  rank: rankEnum("rank").notNull().default("bronze"),
  exp: integer("exp").notNull().default(0),
  ...timestamps,
});

// --- wallets (was WalletInfo) ---
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletBalance: numeric("wallet_balance", { precision: 19, scale: 4 }).notNull().default("0"),
  walletCurrency: text("wallet_currency").notNull(),
  ...timestamps,
}, (t) => [check("wallet_balance_non_negative", sql`${t.walletBalance} >= 0`)]);

// --- transactions (was TransactionHistory) ---
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionType: text("transaction_type"),
  amountSrc: numeric("amount_src", { precision: 19, scale: 4 }).notNull(),
  currencySource: text("currency_source").notNull(),
  amountDest: numeric("amount_dest", { precision: 19, scale: 4 }).notNull(),
  currencyDest: text("currency_dest").notNull(),
  fromAccount: uuid("from_account").notNull().references(() => users.id),
  toAccount: uuid("to_account").notNull().references(() => users.id),
  fromAccountEmail: text("from_account_email").notNull(),
  toAccountEmail: text("to_account_email").notNull(),
  fromAccountId: text("from_account_id").notNull(),
  toAccountId: text("to_account_id").notNull(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).defaultNow(),
  description: text("description").notNull(),
  ...timestamps,
});

// --- transaction_items (was TransactionItem) ---
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionType: transactionItemTypeEnum("transaction_type").notNull(),
  transactionId: text("transaction_id").notNull(),
  currency: text("currency").notNull().default("AUD"),
  amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
  depositId: text("deposit_id").default(""),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  name: text("name").notNull(),
  ...timestamps,
});

// --- bank_info ---
export const bankInfo = pgTable("bank_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  routingNumber: text("routing_number").notNull(),
  accountType: bankAccountTypeEnum("account_type").notNull(),
  ...timestamps,
});

// --- addresses ---
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  country: text("country"),
  ...timestamps,
});

// --- bio_data ---
export const bioData = pgTable("bio_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
  ...timestamps,
});

// --- groups ---
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletBalance: numeric("wallet_balance", { precision: 19, scale: 4 }).notNull().default("0"),
  walletCurrency: text("wallet_currency").notNull().default("AUD"),
  adminId: uuid("admin_id").notNull().references(() => users.id),
  groupName: text("group_name").notNull(),
  description: text("description"),
  ...timestamps,
});

// --- group_members (join, was Groups.members[] + User.groups[]) ---
export const groupMembers = pgTable("group_members", {
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.groupId, t.userId] })]);

// --- invitations ---
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupName: text("group_name").notNull(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  sender: uuid("sender").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiver: uuid("receiver").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverName: text("receiver_name").notNull(),
  ...timestamps,
});

// --- notifications ---
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: notificationTypeEnum("type").notNull(),
  description: text("description"),
  sender: uuid("sender").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiver: uuid("receiver").notNull().references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

// --- requests ---
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderEmail: text("sender_email").notNull(),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
  notes: text("notes").default(""),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  ...timestamps,
});

// --- scheduled_payments ---
export const scheduledPayments = pgTable("scheduled_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  debtorId: uuid("debtor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creditorId: uuid("creditor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountSrc: numeric("amount_src", { precision: 19, scale: 4 }).notNull(),
  amountDest: numeric("amount_dest", { precision: 19, scale: 4 }).notNull(),
  currencySrc: text("currency_src").notNull(),
  currencyDest: text("currency_dest").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  status: scheduledStatusEnum("status").notNull().default("pending"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  transactionId: text("transaction_id"),
  failureReason: text("failure_reason"),
  lastAttempt: timestamp("last_attempt", { withTimezone: true }),
  jobId: text("job_id"),
  ...timestamps,
});

// --- challenges ---
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exp: integer("exp").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  category: challengeCategoryEnum("category").notNull(),
  amountToGoal: numeric("amount_to_goal", { precision: 19, scale: 4 }).notNull(),
});

// --- user_challenge_progress ---
export const userChallengeProgress = pgTable("user_challenge_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id").references(() => challenges.id, { onDelete: "cascade" }),
  progress: numeric("progress", { precision: 19, scale: 4 }).notNull().default("0"),
  completed: boolean("completed").notNull().default(false),
  lastCheckedDate: timestamp("last_checked_date", { withTimezone: true }),
  ...timestamps,
});

// --- otps ---
export const otps = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  otp: text("otp").notNull(),
  expiredAt: timestamp("expired_at", { withTimezone: true }).notNull(),
});
```

> Note on `users.bankInfoId`/`bioDataId`: kept as plain nullable `uuid` columns (not `.references()`) to avoid a circular FK with `bank_info`/`bio_data` which reference `users`. The child tables' `user_id` FK is the authoritative link; these mirror the old single-ref fields for interface parity. `progress` on `user_challenge_progress` is `numeric` because challenge progress tracks money amounts (see `trackChallengeProgress(category, userId, amount)`).

- [ ] **Step 2: Generate the initial migration**

Run: `cd backend && npm run db:generate`
Expected: a SQL file appears under `src/db/migrations/` with all `CREATE TABLE`/`CREATE TYPE` statements. Open it and confirm every money column is `numeric(19,4)` and the `wallet_balance_non_negative` check exists.

- [ ] **Step 3: Verify schema typechecks**

Run: `cd backend && npx tsc --noEmit 2>&1 | grep "src/db/schema" | head`
Expected: no errors referencing `src/db/schema`.

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/schema.ts backend/src/db/migrations
git commit -m "feat(db): add Drizzle schema for all tables with money as numeric + constraints"
```

---

## Task 3: PGlite test harness

**Files:**
- Modify: `backend/__tests__/setup/setup.ts` (replace Mongo memory server)
- Create: `backend/__tests__/setup/pgTestDb.ts`

**Interfaces:**
- Produces: `getTestDb(): DB` — a Drizzle instance backed by in-process PGlite, migrations applied, importable by any test.
- Produces: `resetDb(): Promise<void>` — truncates all tables between tests.

- [ ] **Step 1: Write the PGlite test-db helper**

Create `backend/__tests__/setup/pgTestDb.ts`:
```typescript
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { sql } from "drizzle-orm";
import * as schema from "../../src/db/schema";

let client: PGlite;
let testDb: ReturnType<typeof drizzle<typeof schema>>;

export async function initTestDb() {
  client = new PGlite();
  testDb = drizzle(client, { schema });
  await migrate(testDb, { migrationsFolder: "./src/db/migrations" });
  return testDb;
}

export function getTestDb() {
  return testDb;
}

export async function resetDb() {
  const tables = Object.values(schema).filter(
    (t): t is any => typeof t === "object" && t !== null && "getSQL" in t
  );
  // Truncate every table, restart identities, cascade FKs.
  await testDb.execute(
    sql.raw(
      `TRUNCATE ${["users","wallets","transactions","transaction_items","bank_info","addresses","bio_data","groups","group_members","invitations","notifications","requests","scheduled_payments","challenges","user_challenge_progress","otps"].join(", ")} RESTART IDENTITY CASCADE`
    )
  );
}

export async function closeTestDb() {
  await client.close();
}
```

- [ ] **Step 2: Rewrite the global test setup**

Replace `backend/__tests__/setup/setup.ts` entirely with:
```typescript
import { afterAll, afterEach, beforeAll } from "vitest";
import { initTestDb, resetDb, closeTestDb } from "./pgTestDb";

beforeAll(async () => {
  await initTestDb();
});

afterEach(async () => {
  await resetDb();
});

afterAll(async () => {
  await closeTestDb();
});
```

- [ ] **Step 3: Point repositories at the test db (injection seam)**

The repos import the real `db` from `lib/db.ts`. For tests to hit PGlite, `lib/db.ts` must resolve to the test instance under Vitest. Add to `lib/db.ts` a lazy getter that prefers a test override:
```typescript
// appended to lib/db.ts
let override: DB | null = null;
export function __setDbForTests(d: DB) { override = d; }
export function getDb(): DB { return override ?? db; }
```
Then in `pgTestDb.ts` `initTestDb`, after creating `testDb`, call `__setDbForTests(testDb as unknown as DB)`. Repos use `getDb()` internally (established in Task 4's pattern).

- [ ] **Step 4: Run the existing suite to confirm harness boots**

Run: `cd backend && npx vitest run __tests__/setup 2>&1 | tail -20`
Expected: setup file loads, PGlite migrates without error. (Module tests still reference Mongoose until their tasks land — that is fine; run per-module suites as each task completes.)

- [ ] **Step 5: Commit**

```bash
git add backend/__tests__/setup backend/lib/db.ts
git commit -m "test: replace mongodb-memory-server with PGlite harness"
```

---

## Repository Migration Recipe (reference — every module task below applies this)

This is the mechanical pattern each module task follows. It is written out once; per-module tasks give the specific queries and gotchas rather than repeating this prose.

1. Open the module's `*.types.ts`. The `I*Repository` interface and `*Record` shapes are the frozen contract. Do not change them (except: replace any imported raw Mongoose doc type — `WalletInfoType`, `TransactionHistoryType` — with a locally-defined equivalent, see below).
2. In `*.repository.ts`, replace Mongoose model imports with `import { getDb } from "../../../lib/db"` and the needed tables from `../../db/schema`, plus `eq, and, or, inArray, sql` from `drizzle-orm`.
3. Translate each method query-by-query using the Array→Relational Mapping table. `findById` → `db.select().from(t).where(eq(t.id, id))`; `updateOne $set` → `db.update(t).set(...).where(...)`; `create` → `db.insert(t).values(...).returning()`; `$push`/`$pull` on a ref-array → INSERT/DELETE on the corresponding join table (or nothing when an FK already records it).
4. **Money out of the DB is a string** (`numeric` → JS string). At the mapper boundary, convert with `Number(row.walletBalance)` when the interface's `*Record` declares `number`. Keep it a string only if the interface says string.
5. **`session` parameter → Drizzle tx.** Where a method accepts `session?: ClientSession`, change the parameter to `tx?: DbOrTx` and run the query on `(tx ?? getDb())`. Define once per module: `type DbOrTx = DB | Parameters<Parameters<DB["transaction"]>[0]>[0];`. The interface's `ClientSession` type is replaced by this `DbOrTx` in `*.types.ts` **only for the session param type** — this is the one allowed interface edit, applied identically everywhere.
6. **Raw `.lean()` docs** that were returned directly (`WalletInfoType[]`, `TransactionHistoryType[]`) are replaced by mapping Drizzle rows to an object with the same field names **plus `_id: string`** (the uuid) and **without `__v`**, so API serialization the frontend depends on still works.
7. Update the module's `*.container.ts`: if it defines `withTransaction`, rewrite it (Task 4 shows the exact replacement). Otherwise no container change.
8. Keep the module's existing test file; adapt fixture setup to insert rows via Drizzle (Task 4 shows the pattern). Run that module's suite green before committing.

---

## Task 4: transaction module (reference implementation — the ACID path)

**Files:**
- Modify: `backend/src/modules/transaction/transaction.repository.ts`
- Modify: `backend/src/modules/transaction/transaction.container.ts`
- Modify: `backend/src/modules/transaction/transaction.types.ts` (session param type only)
- Modify: `backend/src/transactions/paymentProcessor.ts` (uses `mongoose.startSession`)
- Test: `backend/src/modules/transaction/__tests__/` (existing) + new rollback test

**Interfaces:**
- Consumes: tables `users`, `wallets`, `transactions` from schema; `getDb` from `lib/db`.
- Produces: unchanged `ITransactionRepository` (findUserById, findUserByEmail, findWallet, createWallet, adjustWalletBalance, recordTransaction) returning the same `UserRecord`/`WalletRecord`/`string` shapes. `withTransaction<T>(fn: (tx) => Promise<T>) => Promise<T>` with a Drizzle tx replacing `ClientSession`.

- [ ] **Step 1: Write the failing rollback test**

Create `backend/src/modules/transaction/__tests__/rollback.pg.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../../../../__tests__/setup/pgTestDb";
import { users, wallets } from "../../../db/schema";
import { eq } from "drizzle-orm";
import { transactionRepository } from "../transaction.repository";
import { transactionContainerWithTransaction as withTransaction } from "../transaction.container";

describe("transaction ACID rollback", () => {
  let debtorId: string;
  beforeEach(async () => {
    const db = getTestDb();
    const [d] = await db.insert(users).values({
      firstName: "D", lastName: "R", email: "d@x.com", password: "h",
    }).returning();
    debtorId = d.id;
    await db.insert(wallets).values({ userId: d.id, walletBalance: "100.0000", walletCurrency: "AUD" });
  });

  it("rolls back the balance change when the tx body throws", async () => {
    const db = getTestDb();
    const [w] = await db.select().from(wallets).where(eq(wallets.userId, debtorId));
    await expect(withTransaction(async (tx) => {
      await transactionRepository.adjustWalletBalance(w.id, -50, tx);
      throw new Error("boom");
    })).rejects.toThrow("boom");
    const [after] = await db.select().from(wallets).where(eq(wallets.id, w.id));
    expect(Number(after.walletBalance)).toBe(100);
  });
});
```

- [ ] **Step 2: Run it — expect failure (imports not yet migrated)**

Run: `cd backend && npx vitest run src/modules/transaction/__tests__/rollback.pg.test.ts 2>&1 | tail -20`
Expected: FAIL — `transactionContainerWithTransaction` not exported / repo still on Mongoose.

- [ ] **Step 3: Rewrite the container's withTransaction**

Replace `backend/src/modules/transaction/transaction.container.ts` transaction plumbing:
```typescript
import { getDb } from "../../../lib/db";
import { createTransactionService } from "./transaction.service";
import { transactionRepository } from "./transaction.repository";
import { exchangeService } from "../exchange/exchange.container";
import { challengeService } from "../challenge/challenge.container";

type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];

export const transactionContainerWithTransaction = async <T>(
  fn: (tx: Tx) => Promise<T>
): Promise<T> => {
  return getDb().transaction(async (tx) => fn(tx));
};

export const transactionService = createTransactionService({
  repo: transactionRepository,
  exchangeRate: exchangeService.getRate,
  checkBalanceChallenges: challengeService.checkBalanceChallenges,
  trackChallengeProgress: challengeService.trackChallengeProgress,
  withTransaction: transactionContainerWithTransaction,
});
```

- [ ] **Step 4: Migrate the transaction types (session param only)**

In `backend/src/modules/transaction/transaction.types.ts`, replace `import type { ClientSession } from "mongoose";` with:
```typescript
import type { getDb } from "../../../lib/db";
export type Tx = Parameters<Parameters<ReturnType<typeof getDb>["transaction"]>[0]>[0];
export type DbOrTx = ReturnType<typeof getDb> | Tx;
```
Then replace every `session?: ClientSession` with `session?: DbOrTx` and `withTransaction: <T>(fn: (session: ClientSession) => ...` with `fn: (session: Tx) => ...`. Leave all other types identical.

- [ ] **Step 5: Rewrite the repository**

Replace `backend/src/modules/transaction/transaction.repository.ts`:
```typescript
import { getDb } from "../../../lib/db";
import { users, wallets, transactions } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import HTTPError from "http-errors";
import type {
  ITransactionRepository, RecordTransactionInput, UserRecord, WalletRecord, DbOrTx,
} from "./transaction.types";

const run = (session?: DbOrTx) => session ?? getDb();

const toUserRecord = (r: { id: string; email: string; rank: string }): UserRecord =>
  ({ id: r.id, email: r.email, rank: r.rank });
const toWalletRecord = (r: { id: string; userId: string; walletBalance: string; walletCurrency: string }): WalletRecord =>
  ({ id: r.id, userId: r.userId, balance: Number(r.walletBalance), currency: r.walletCurrency });

export const transactionRepository: ITransactionRepository = {
  async findUserById(id, session) {
    const [r] = await run(session).select().from(users).where(eq(users.id, id));
    return r ? toUserRecord(r) : null;
  },
  async findUserByEmail(email, session) {
    const [r] = await run(session).select().from(users).where(eq(users.email, email));
    return r ? toUserRecord(r) : null;
  },
  async findWallet(userId, currency, session) {
    const [r] = await run(session).select().from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return r ? toWalletRecord(r) : null;
  },
  async createWallet(userId, currency, session) {
    const [r] = await run(session).insert(wallets)
      .values({ userId, walletBalance: "0", walletCurrency: currency }).returning();
    return toWalletRecord(r);
  },
  async adjustWalletBalance(walletId, delta, session) {
    // Money arithmetic in SQL; CHECK (wallet_balance >= 0) enforces non-negative.
    const [r] = await run(session).update(wallets)
      .set({ walletBalance: sqlAdd(delta) })
      .where(eq(wallets.id, walletId)).returning();
    if (!r) throw HTTPError(404, "Wallet not found");
    return Number(r.walletBalance);
  },
  async recordTransaction(input: RecordTransactionInput, session) {
    const [tx] = await run(session).insert(transactions).values({
      amountSrc: String(input.amountSrc), currencySource: input.currencySource,
      amountDest: String(input.amountDest), currencyDest: input.currencyDest,
      fromAccount: input.fromUser.id, toAccount: input.toUser.id,
      fromAccountEmail: input.fromUser.email, toAccountEmail: input.toUser.email,
      fromAccountId: input.fromUser.id, toAccountId: input.toUser.id,
      description: input.description,
    }).returning({ id: transactions.id });
    return tx.id;
    // Note: User.transactionHistory[] array is dropped; history is derived by
    // querying transactions.from_account/to_account (see Array→Relational Mapping).
  },
};

import { sql } from "drizzle-orm";
const sqlAdd = (delta: number) => sql`${wallets.walletBalance} + ${String(delta)}`;
```

- [ ] **Step 6: Migrate paymentProcessor**

In `backend/src/transactions/paymentProcessor.ts`, replace `const session = await mongoose.startSession(); ... session.withTransaction(async () => {...})` with `await getDb().transaction(async (tx) => {...})`, threading `tx` where `session` was passed. Remove the `mongoose` import.

- [ ] **Step 7: Run the rollback test — expect pass**

Run: `cd backend && npx vitest run src/modules/transaction/__tests__/rollback.pg.test.ts 2>&1 | tail -20`
Expected: PASS.

- [ ] **Step 8: Run the full transaction module suite**

Run: `cd backend && npx vitest run src/modules/transaction 2>&1 | tail -30`
Expected: PASS. Fix any fixture that inserted via Mongoose to insert via Drizzle (`db.insert(users)...`).

- [ ] **Step 9: Commit**

```bash
git add backend/src/modules/transaction backend/src/transactions/paymentProcessor.ts
git commit -m "feat(transaction): migrate repository + tx seam to Drizzle/Postgres"
```

---

## Task 5: wallet module

**Files:** Modify `backend/src/modules/wallet/wallet.repository.ts`, `wallet.types.ts`. Test: existing `wallet` suite.

**Interfaces:**
- Consumes: `wallets`, `users` tables. Frozen `IWalletRepository`: `findUserById`, `findUserWithWallets`, `findWalletsByUserId`, `findWallet`, `createWallet`, `deleteWalletById`.
- Produces: same shapes. **Replace the raw `WalletInfoType` import** — `findUserWithWallets`/`findWalletsByUserId` now return wallet rows mapped to `{ _id, userId, walletBalance, walletCurrency, createdAt, updatedAt }` (with `_id` = uuid string) so API serialization is unchanged.

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/wallet/__tests__/wallet.pg.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../../../../__tests__/setup/pgTestDb";
import { users } from "../../../db/schema";
import { walletRepository } from "../wallet.repository";

describe("walletRepository (pg)", () => {
  let userId: string;
  beforeEach(async () => {
    const [u] = await getTestDb().insert(users).values({
      firstName: "A", lastName: "B", email: "w@x.com", password: "h",
    }).returning();
    userId = u.id;
  });
  it("creates a wallet and lists it by user with an _id field", async () => {
    const created = await walletRepository.createWallet(userId, "AUD");
    expect(created).toMatchObject({ userId, walletBalance: 0, walletCurrency: "AUD" });
    const list = await walletRepository.findWalletsByUserId(userId);
    expect(list).toHaveLength(1);
    expect(String((list[0] as any)._id)).toBe(created.id);
  });
});
```

- [ ] **Step 2: Run — expect fail.** Run: `cd backend && npx vitest run src/modules/wallet/__tests__/wallet.pg.test.ts 2>&1 | tail -15` — FAIL (repo on Mongoose).

- [ ] **Step 3: Rewrite the repository**

Replace `backend/src/modules/wallet/wallet.repository.ts`:
```typescript
import { getDb } from "../../../lib/db";
import { wallets, users } from "../../db/schema";
import { eq, and } from "drizzle-orm";
import type { IWalletRepository, UserWithWallets, WalletRecord } from "./wallet.types";

type WalletRow = typeof wallets.$inferSelect;
// Serialized wallet doc matching legacy `.lean()` output the frontend consumes.
const toLeanWallet = (r: WalletRow) => ({
  _id: r.id, userId: r.userId, walletBalance: Number(r.walletBalance),
  walletCurrency: r.walletCurrency, createdAt: r.createdAt, updatedAt: r.updatedAt,
});
const toWalletRecord = (r: WalletRow): WalletRecord => ({
  id: r.id, userId: r.userId, walletBalance: Number(r.walletBalance), walletCurrency: r.walletCurrency,
});

export const walletRepository: IWalletRepository = {
  async findUserById(userId) {
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId));
    return u ? { id: u.id } : null;
  },
  async findUserWithWallets(userId): Promise<UserWithWallets | null> {
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId));
    if (!u) return null;
    const rows = await getDb().select().from(wallets).where(eq(wallets.userId, userId));
    return { id: u.id, wallets: rows.map(toLeanWallet) as any };
  },
  async findWalletsByUserId(userId) {
    const rows = await getDb().select().from(wallets).where(eq(wallets.userId, userId));
    return rows.map(toLeanWallet) as any;
  },
  async findWallet(userId, currency) {
    const [r] = await getDb().select().from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return r ? toWalletRecord(r) : null;
  },
  async createWallet(userId, currency) {
    const [r] = await getDb().insert(wallets)
      .values({ userId, walletBalance: "0", walletCurrency: currency }).returning();
    return toWalletRecord(r);
  },
  async deleteWalletById(walletId) {
    const deleted = await getDb().delete(wallets).where(eq(wallets.id, walletId)).returning({ id: wallets.id });
    return deleted.length > 0;
  },
};
```
In `wallet.types.ts`, replace `import type { WalletInfoType } from "../../../model/WalletInfo";` and the `WalletInfoType[]` usages with a local `LeanWallet` type: `export interface LeanWallet { _id: string; userId: string; walletBalance: number; walletCurrency: string; createdAt: Date; updatedAt: Date; }` and use `LeanWallet[]`.

- [ ] **Step 4: Run — expect pass.** Run: `cd backend && npx vitest run src/modules/wallet 2>&1 | tail -20` — PASS.

- [ ] **Step 5: Commit.** `git add backend/src/modules/wallet && git commit -m "feat(wallet): migrate repository to Drizzle/Postgres"`

---

## Task 6: user module

**Files:** Modify `backend/src/modules/user/user.repository.ts`, `user.types.ts`. Test: existing `user` suite.

**Interfaces:**
- Frozen `IUserRepository`: `findUserRankById`, `findUserAdminById`, `findUserWithTransactionHistory`, `findTransactionHistoryByIds`.
- `findUserWithTransactionHistory` rebuilds the id-array via `SELECT id FROM transactions WHERE from_account = $u OR to_account = $u`. `findTransactionHistoryByIds` returns transaction rows mapped to lean docs with `_id`.

- [ ] **Step 1: Write the failing test**

Create `backend/src/modules/user/__tests__/user.pg.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../../../../__tests__/setup/pgTestDb";
import { users, transactions } from "../../../db/schema";
import { userRepository } from "../user.repository";

describe("userRepository (pg)", () => {
  let a: string, b: string;
  beforeEach(async () => {
    const db = getTestDb();
    const [ua] = await db.insert(users).values({ firstName: "A", lastName: "A", email: "a@x.com", password: "h" }).returning();
    const [ub] = await db.insert(users).values({ firstName: "B", lastName: "B", email: "b@x.com", password: "h" }).returning();
    a = ua.id; b = ub.id;
    await db.insert(transactions).values({
      amountSrc: "10", currencySource: "AUD", amountDest: "10", currencyDest: "AUD",
      fromAccount: a, toAccount: b, fromAccountEmail: "a@x.com", toAccountEmail: "b@x.com",
      fromAccountId: a, toAccountId: b, description: "t",
    });
  });
  it("derives transaction history from from/to account", async () => {
    const res = await userRepository.findUserWithTransactionHistory(a);
    expect(res?.transactionHistory).toHaveLength(1);
    const rank = await userRepository.findUserRankById(a);
    expect(rank).toEqual({ id: a, rank: "bronze" });
  });
});
```

- [ ] **Step 2: Run — expect fail.** Run: `cd backend && npx vitest run src/modules/user/__tests__/user.pg.test.ts 2>&1 | tail -15` — FAIL.

- [ ] **Step 3: Rewrite the repository**

Replace `backend/src/modules/user/user.repository.ts`:
```typescript
import { getDb } from "../../../lib/db";
import { users, transactions } from "../../db/schema";
import { eq, or, inArray } from "drizzle-orm";
import type { IUserRepository, UserAdminRecord, UserRankRecord, UserWithTransactionHistory } from "./user.types";

type TxRow = typeof transactions.$inferSelect;
const toLeanTx = (r: TxRow) => ({
  _id: r.id, transactionType: r.transactionType,
  amountSrc: Number(r.amountSrc), currencySource: r.currencySource,
  amountDest: Number(r.amountDest), currencyDest: r.currencyDest,
  fromAccount: r.fromAccount, toAccount: r.toAccount,
  fromAccountEmail: r.fromAccountEmail, toAccountEmail: r.toAccountEmail,
  fromAccountId: r.fromAccountId, toAccountId: r.toAccountId,
  transactionDate: r.transactionDate, description: r.description,
  createdAt: r.createdAt, updatedAt: r.updatedAt,
});

export const userRepository: IUserRepository = {
  async findUserRankById(userId): Promise<UserRankRecord | null> {
    const [u] = await getDb().select({ id: users.id, rank: users.rank }).from(users).where(eq(users.id, userId));
    return u ? { id: u.id, rank: u.rank } : null;
  },
  async findUserAdminById(userId): Promise<UserAdminRecord | null> {
    const [u] = await getDb().select({ id: users.id, isAdmin: users.isAdmin }).from(users).where(eq(users.id, userId));
    return u ? { id: u.id, isAdmin: u.isAdmin } : null;
  },
  async findUserWithTransactionHistory(userId): Promise<UserWithTransactionHistory | null> {
    const [u] = await getDb().select({ id: users.id }).from(users).where(eq(users.id, userId));
    if (!u) return null;
    const rows = await getDb().select({ id: transactions.id }).from(transactions)
      .where(or(eq(transactions.fromAccount, userId), eq(transactions.toAccount, userId)));
    return { id: u.id, transactionHistory: rows.map((r) => r.id) };
  },
  async findTransactionHistoryByIds(ids) {
    if (ids.length === 0) return [] as any;
    const rows = await getDb().select().from(transactions).where(inArray(transactions.id, ids));
    return rows.map(toLeanTx) as any;
  },
};
```
In `user.types.ts`, replace the `TransactionHistoryType` import with a local `LeanTransaction` type mirroring `toLeanTx`'s shape, and use `LeanTransaction[]` in `findTransactionHistoryByIds`' return.

- [ ] **Step 4: Run — expect pass.** Run: `cd backend && npx vitest run src/modules/user 2>&1 | tail -20` — PASS.

- [ ] **Step 5: Commit.** `git add backend/src/modules/user && git commit -m "feat(user): migrate repository to Drizzle/Postgres"`

---

## Task 7: group module (largest — join tables + money + tx)

**Files:** Modify `backend/src/modules/group/group.repository.ts`, `group.types.ts`, `group.container.ts`. Test: existing `group` suite.

**Interfaces:**
- Frozen `IGroupRepository` (~30 methods). Uses tables `groups`, `group_members`, `users`, `wallets`, `transactions`, `transaction_items`, `invitations`, `notifications`.
- Array translations (from the mapping table):
  - `appendUserGroup(userId, groupId)` → `INSERT INTO group_members (group_id, user_id) VALUES (...) ON CONFLICT DO NOTHING`.
  - `removeUserGroup(userId, groupId)` → `DELETE FROM group_members WHERE group_id=$g AND user_id=$u`.
  - `appendGroupTransactionHistory(groupId, txId)` → `UPDATE transactions SET group_id=$g WHERE id=$tx`.
  - `findGroupById.transactionHistoryIds` / `findGroupDetailById.transactionHistoryIds` → `SELECT id FROM transactions WHERE group_id=$g`.
  - `findGroupDetailById.members` → `SELECT user_id FROM group_members WHERE group_id=$g`.
  - `findGroupDetailById.pendingInvite` → `SELECT id FROM invitations WHERE group_id=$g`.
  - `addUserInvitation`/`removeUserInvitation` → no-op on users (an invitation row's `receiver` FK already records it); `removeUserInvitation` maps to deleting/marking the invitation in `invitationRepository` — keep as a no-op here if the service also calls the invitation delete, otherwise `DELETE FROM invitations WHERE id=$i`. Inspect the service call sites before choosing; preserve observable behavior.
  - `addUserNotification` → no-op (notification row's `receiver` FK records it).
  - `appendUserTransactionHistory` → no-op (derived from `transactions.from_account`/`to_account`).
- `adjustGroupBalance`/`adjustWalletBalance` → SQL `SET wallet_balance = wallet_balance + $delta ... RETURNING`, return `Number(...)`. `session` param → `DbOrTx` (recipe rule 5).
- `recordTransaction` → insert into `transactions` (with `group_id` when applicable), `.returning({ id })`.
- `findWalletByIdsAndCurrency` → `inArray(wallets.id, ids)` + `eq(walletCurrency, currency)`.
- `find*Raw`/`findUsersByIds`/`findMembersByIds` → select mapped rows; where they returned `.lean()` docs, map to `{ _id, ...fields }`.

- [ ] **Step 1: Write the failing test (membership + group tx history via join/FK)**

Create `backend/src/modules/group/__tests__/group.pg.test.ts`:
```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { getTestDb } from "../../../../__tests__/setup/pgTestDb";
import { users, groups } from "../../../db/schema";
import { groupRepository } from "../group.repository";

describe("groupRepository (pg)", () => {
  let admin: string, member: string, groupId: string;
  beforeEach(async () => {
    const db = getTestDb();
    const [a] = await db.insert(users).values({ firstName: "Ad", lastName: "M", email: "ad@x.com", password: "h" }).returning();
    const [m] = await db.insert(users).values({ firstName: "Me", lastName: "M", email: "me@x.com", password: "h" }).returning();
    admin = a.id; member = m.id;
    const [g] = await db.insert(groups).values({ adminId: a.id, groupName: "G", walletCurrency: "AUD" }).returning();
    groupId = g.id;
  });
  it("adds a member and reports it in group detail", async () => {
    await groupRepository.appendUserGroup(member, groupId);
    const detail = await groupRepository.findGroupDetailById(groupId);
    expect(detail?.members).toContain(member);
  });
  it("adjusts group balance in SQL", async () => {
    const bal = await groupRepository.adjustGroupBalance(groupId, 25);
    expect(bal).toBe(25);
  });
});
```

- [ ] **Step 2: Run — expect fail.** Run: `cd backend && npx vitest run src/modules/group/__tests__/group.pg.test.ts 2>&1 | tail -15` — FAIL.

- [ ] **Step 3: Rewrite `group.repository.ts`** applying the Recipe + the array translations listed above. Use `getDb()`/`run(session)` per method. Define `toLeanX` mappers with `_id` for any method that returned `.lean()` docs (`findUserRawById`, `findUsersByIds`, `findTransactionHistoryByIds`, `findGroupDetailById`). Rewrite `group.container.ts`'s `withTransaction` exactly as in Task 4 Step 3 (same Drizzle `getDb().transaction` body). In `group.types.ts`, replace `ClientSession` with the shared `DbOrTx`/`Tx` types and any raw Mongoose doc imports with local lean types.

> Because this repo is large, migrate it method-by-method, running the module suite after each cluster (reads, then writes, then tx methods). Do not change method names or return shapes.

- [ ] **Step 4: Run the full group suite — expect pass.** Run: `cd backend && npx vitest run src/modules/group 2>&1 | tail -30` — PASS. Adapt any Mongoose-based fixtures to Drizzle inserts.

- [ ] **Step 5: Commit.** `git add backend/src/modules/group && git commit -m "feat(group): migrate repository + tx seam to Drizzle/Postgres"`

---

## Task 8: request module

**Files:** Modify `backend/src/modules/request/request.repository.ts`, `request.types.ts`. Test: existing suite.

**Interfaces:** Open `request.types.ts` for the frozen `IRequestRepository`. `requests.user_id` FK replaces `User.request[]`; `$push` to `User.request` becomes just the `INSERT INTO requests` (the FK records ownership). Any "list a user's requests" reads `WHERE user_id = $u`. Money `amount` → `numeric`, convert `Number()` at the boundary.

- [ ] **Step 1: Write a failing CRUD test** at `backend/src/modules/request/__tests__/request.pg.test.ts` that inserts a user, creates a request via the repo, lists it back by user id, and asserts `amount` is a number and the row is found. (Mirror Task 6 Step 1's structure; use the actual repo method names from `request.types.ts`.)
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Rewrite `request.repository.ts`** per the Recipe: `getDb()`, tables `requests`/`users`, `eq`/`inArray`; drop any `$push` to `User.request` (FK covers it); `INSERT ... returning`; map `amount` with `Number()`; keep interface + `_id` serialization where reads returned lean docs.
- [ ] **Step 4: Run `npx vitest run src/modules/request` — expect pass.**
- [ ] **Step 5: Commit** `feat(request): migrate repository to Drizzle/Postgres`.

---

## Task 9: notification module

**Files:** Modify `backend/src/modules/notification/notification.repository.ts`, `notification.types.ts`. Test: existing suite.

**Interfaces:** Frozen `INotificationRepository` (open the types file). `notifications.receiver` FK replaces `User.notification[]`; listing a user's notifications reads `WHERE receiver = $u ORDER BY created_at DESC`. `type` is the `notification_type` enum. Reads that returned lean docs map to `{ _id, ... }`.

- [ ] **Step 1: Failing test** at `notification/__tests__/notification.pg.test.ts`: insert sender+receiver users, create a notification, list by receiver, assert presence and `_id` string.
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Rewrite `notification.repository.ts`** per Recipe (`getDb()`, `notifications` table, `eq(notifications.receiver, ...)`; drop `$push` to `User.notification`).
- [ ] **Step 4: Run `npx vitest run src/modules/notification` — expect pass.**
- [ ] **Step 5: Commit** `feat(notification): migrate repository to Drizzle/Postgres`.

---

## Task 10: challenge + user_challenge_progress module

**Files:** Modify `backend/src/modules/challenge/challenge.repository.ts`, `challenge.types.ts`. Test: existing suite.

**Interfaces:** Frozen `IChallengeRepository` (open types file). Tables `challenges`, `user_challenge_progress`. `challenges.amount_to_goal` and `user_challenge_progress.progress` are `numeric` — convert `Number()` at boundary; `exp` is `integer`. `checkBalanceChallenges`/`trackChallengeProgress` are used by the transaction service (Task 4 deps) — keep their signatures and return types exactly. Progress upsert: `INSERT ... ON CONFLICT (user_id, challenge_id) DO UPDATE` (add a unique index on `(user_id, challenge_id)` in the schema if the code upserts — check the repo; if it does, add `unique().on(t.userId, t.challengeId)` to `userChallengeProgress` in `schema.ts` and regenerate the migration).

- [ ] **Step 1: Failing test** at `challenge/__tests__/challenge.pg.test.ts`: create a challenge, create/update a user's progress, assert `progress`/`amountToGoal` are numbers and completion toggles.
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: If the repo upserts progress, add the unique index** to `userChallengeProgress` in `schema.ts`, run `npm run db:generate`, commit the migration. Then rewrite `challenge.repository.ts` per Recipe.
- [ ] **Step 4: Run `npx vitest run src/modules/challenge` — expect pass.**
- [ ] **Step 5: Commit** `feat(challenge): migrate repository to Drizzle/Postgres`.

---

## Task 11: scheduledPayment module

**Files:** Modify `backend/src/modules/scheduledPayment/scheduledPayment.repository.ts`, types. Also check `backend/queues/` and `backend/workers/` for direct Mongoose model use of `ScheduledPayment`. Test: existing suite.

**Interfaces:** Frozen `IScheduledPaymentRepository`. Table `scheduled_payments`; `status` is the `scheduled_status` enum; `amount_src`/`amount_dest` numeric; date fields are `timestamptz`. The BullMQ worker that processes due payments (`workers/`) may query/update this table directly — migrate those queries too (grep for `ScheduledPayment` model imports).

- [ ] **Step 1: Grep for all ScheduledPayment model usage.** Run: `cd backend && grep -rn "model/ScheduledPayment\|ScheduledPayment" src queues workers | grep -v "\.test\." ` — list every file to migrate.
- [ ] **Step 2: Failing test** at `scheduledPayment/__tests__/scheduledPayment.pg.test.ts`: create a scheduled payment, query due ones by `scheduled_date <= now()` and `status = 'pending'`, mark processing, assert status transition.
- [ ] **Step 3: Run — expect fail.**
- [ ] **Step 4: Rewrite the repository and any worker/queue queries** per Recipe (`getDb()`, `scheduledPayments` table, `and(lte(scheduledDate, now), eq(status, "pending"))`, `db.update(...).set({ status: "processing" })`).
- [ ] **Step 5: Run `npx vitest run src/modules/scheduledPayment` — expect pass.**
- [ ] **Step 6: Commit** `feat(scheduledPayment): migrate repository + worker queries to Drizzle/Postgres`.

---

## Task 12: invitation module

**Files:** Modify `backend/src/modules/*invitation*` repository + types (the invitation routes live under `invitation/` or within `group/` — locate via `grep -rn "invitation" src/modules --include=*.routes.ts`). Test: existing suite.

**Interfaces:** Table `invitations` (groupId, sender, receiver FKs). `User.invitation[]` and `Groups.pendingInvite[]` are both derived from `invitations` rows (`WHERE receiver=$u` / `WHERE group_id=$g`). Processing an invitation (accept/decline) deletes the invitation row (matches the old `$pull` from both arrays). Reads returning lean docs map to `{ _id, ... }` (frontend keys invitations by `_id`).

- [ ] **Step 1: Locate the invitation repository.** Run: `grep -rln "Invitation" backend/src/modules | grep repository`.
- [ ] **Step 2: Failing test**: create sender+receiver+group, create an invitation, list by receiver, process (delete), assert it is gone and carried an `_id`.
- [ ] **Step 3: Run — expect fail.**
- [ ] **Step 4: Rewrite** per Recipe; process = `DELETE FROM invitations WHERE id=$i RETURNING`.
- [ ] **Step 5: Run the invitation suite — expect pass.**
- [ ] **Step 6: Commit** `feat(invitation): migrate repository to Drizzle/Postgres`.

---

## Task 13: otp module

**Files:** Modify `backend/src/modules/otp/otp.repository.ts` (if present; otp.service.ts references SendGrid, not the DB directly — check), types. Test: existing suite.

**Interfaces:** Table `otps` (`user_id` FK, `otp`, `expired_at timestamptz`). Lookups: latest valid otp for a user = `WHERE user_id=$u AND expired_at > now() ORDER BY expired_at DESC LIMIT 1`. Old Mongoose TTL (if any) is replaced by the app-side `expired_at > now()` check. Keep the repo interface identical.

- [ ] **Step 1: Locate DB access.** Run: `grep -rn "model/Otp\|Otp\b" backend/src/modules/otp` — confirm which file queries otps.
- [ ] **Step 2: Failing test**: insert an otp, fetch the valid one, assert expiry filtering (an expired row is not returned).
- [ ] **Step 3: Run — expect fail.**
- [ ] **Step 4: Rewrite** per Recipe (`getDb()`, `otps` table, `gt(otps.expiredAt, new Date())`).
- [ ] **Step 5: Run `npx vitest run src/modules/otp` — expect pass.**
- [ ] **Step 6: Commit** `feat(otp): migrate repository to Drizzle/Postgres`.

---

## Task 14: bank module

**Files:** Modify `backend/src/modules/bank/bank.repository.ts`, types. Test: existing suite.

**Interfaces:** Table `bank_info` (`user_id` FK, `account_type` = `bank_account_type` enum). Replaces `User.bankInfo` single ref: setting bank info = upsert a `bank_info` row for the user (and optionally set `users.bank_info_id`). Reads by user = `WHERE user_id=$u`. Keep interface + `_id` where serialized.

- [ ] **Step 1: Failing test**: insert user, create bank info, read back by user, assert enum value and `_id`.
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Rewrite** per Recipe. If the service sets `users.bankInfoId`, update it in the same call.
- [ ] **Step 4: Run `npx vitest run src/modules/bank` — expect pass.**
- [ ] **Step 5: Commit** `feat(bank): migrate repository to Drizzle/Postgres`.

---

## Task 15: profile module (bio_data + addresses)

**Files:** Modify `backend/src/modules/profile/profile.repository.ts`, types. Test: existing suite.

**Interfaces:** Tables `bio_data` (`user_id` FK, `address_id` FK), `addresses` (`user_id` FK). Replaces `User.bioData` and `BioData.address` single refs with FKs. Profile read joins user → bio_data → address. Keep the interface and any serialized `_id` fields.

- [ ] **Step 1: Failing test**: insert user, create bio data + address, read the assembled profile, assert nested fields and `_id`s.
- [ ] **Step 2: Run — expect fail.**
- [ ] **Step 3: Rewrite** per Recipe with the two-table join (`leftJoin(addresses, eq(bioData.addressId, addresses.id))`).
- [ ] **Step 4: Run `npx vitest run src/modules/profile` — expect pass.**
- [ ] **Step 5: Commit** `feat(profile): migrate repository to Drizzle/Postgres`.

---

## Task 16: admin, auth, passwordReset — remaining User access

**Files:** Modify `backend/src/modules/admin/*.repository.ts`, and any Mongoose `User` access in `auth` and `passwordReset` services. Test: existing suites.

**Interfaces:** These modules read/write `users` directly (auth: create user, find by email, set tokens/isVerified/resetPasswordToken; admin: list/lock users). `User.tokens[]` and `User.existingPassword[]` are `text[]` columns — append with `sql`array_append`` or read-modify-write the array (small arrays, acceptable). `resetPasswordToken`/`resetPasswordTokenExpiryDate` are plain columns. Keep every repo/service interface identical.

- [ ] **Step 1: Grep every remaining Mongoose `User` usage.** Run: `cd backend && grep -rln "model/User\|from \"mongoose\"\|from 'mongoose'" src | grep -v __tests__` — this is the master to-do list for this task.
- [ ] **Step 2: Failing test** for the auth repo path most critical to correctness (create user → find by email → set isVerified). Place under `auth/__tests__/auth.pg.test.ts`.
- [ ] **Step 3: Run — expect fail.**
- [ ] **Step 4: Migrate each file from Step 1** to Drizzle (`getDb()`, `users` table). For token/array mutations use `sql`array_append(${users.tokens}, ${token})``. Preserve `email` uniqueness reliance (now a DB `UNIQUE` — catch the constraint error where the code expected a duplicate check).
- [ ] **Step 5: Run `npx vitest run src/modules/auth src/modules/admin src/modules/passwordReset` — expect pass.**
- [ ] **Step 6: Commit** `feat(auth,admin): migrate remaining User access to Drizzle/Postgres`.

---

## Task 17: app bootstrap — swap DB connection

**Files:** Modify `backend/src/server.ts` (calls `connectToDB`), `backend/lib/mongoClient.ts` usage.

**Interfaces:** Replace the Mongo connect call at startup with a Postgres readiness check (the `pg` Pool connects lazily; add a `SELECT 1` ping and run pending migrations on boot in non-test env).

- [ ] **Step 1: Grep the startup path.** Run: `cd backend && grep -rn "connectToDB\|mongoClient" src` — find the call site in `server.ts`.
- [ ] **Step 2: Replace the connect call** in `server.ts`:
```typescript
import { pool } from "../lib/db";
// ...at startup, replacing connectToDB():
await pool.query("SELECT 1");
console.log("✅ Connected to PostgreSQL");
```
- [ ] **Step 3: Run migrations on deploy.** Document in `backend/README` (or wherever run instructions live) that `npm run db:migrate` runs before boot. If the app auto-migrates, add `await migrate(db, { migrationsFolder: "./src/db/migrations" })` guarded to non-test env.
- [ ] **Step 4: Build check.** Run: `cd backend && npx tsc --noEmit 2>&1 | tail -20` — no errors.
- [ ] **Step 5: Commit** `feat(server): connect to Postgres at startup instead of Mongo`.

---

## Task 18: remove MongoDB — models, client, dependencies

**Files:** Delete `backend/model/`, `backend/lib/mongoClient.ts`. Modify `backend/package.json`.

- [ ] **Step 1: Verify no residual Mongo references.** Run: `cd backend && grep -rn "mongoose\|mongodb\|ObjectId\|MongoClient\|\.lean()\|startSession" src lib model queues workers | grep -v node_modules` — expected: only lines inside files about to be deleted (`model/`). Any hit elsewhere is a missed migration — fix it before proceeding.
- [ ] **Step 2: Delete the Mongo layer.** Run: `cd backend && rm -rf model lib/mongoClient.ts`
- [ ] **Step 3: Remove dependencies.** Run: `cd backend && npm uninstall mongoose mongodb mongodb-memory-server`
- [ ] **Step 4: Full typecheck + full test suite.** Run: `cd backend && npx tsc --noEmit && npx vitest run 2>&1 | tail -40`
Expected: typecheck clean, all suites PASS.
- [ ] **Step 5: Update the migration design/README note** if `MONGO_URI` is referenced anywhere in docs. Run: `grep -rn "MONGO_URI\|MongoDB\|mongoose" backend README.md docker-compose.yaml | grep -v node_modules` and fix stale references.
- [ ] **Step 6: Commit** `chore: remove MongoDB models, client, and dependencies`.

---

## Self-Review (completed by plan author)

**Spec coverage:**
- Relational integrity / FKs / constraints → Task 2 (schema with FKs, `CHECK`, `UNIQUE`, enums). ✓
- Money-as-float fix → Global Constraints + Task 2 (`numeric(19,4)`) + SQL arithmetic in Tasks 4/7. ✓
- Reporting/query ergonomics → normalized schema + FK-derived queries (Array→Relational Mapping). ✓
- Drizzle ORM → Tasks 1–2. ✓
- Normalize properly (drop redundant arrays, join tables for M:N) → Array→Relational Mapping + Tasks 5/6/7. ✓
- PGlite tests replacing mongodb-memory-server → Task 3. ✓
- docker-compose postgres, env swap, deps → Tasks 1, 18. ✓
- Interface/serialization preservation (spec's "services untouched") → Recipe + `_id` serialization rule; the one discovered wrinkle (leaked `WalletInfoType`/`TransactionHistoryType`, `_id`/`__v`) is handled by lean-doc mappers in Tasks 5/6/7. ✓
- All 15 models → Task 2 tables; all 15+ modules → Tasks 4–16. ✓
- Risks (schema-eval defaults, ObjectId comparisons, money at JS boundary, redis untouched) → Task 2 defaults use DB `defaultRandom()`/`defaultNow()`; Recipe rule 4 + SQL arithmetic; Task 18 grep for residual ObjectId. ✓

**Placeholder scan:** Tasks 8–16 intentionally reference each module's own `*.types.ts` for exact method names rather than duplicating unread service internals, but each carries its concrete table, query translations, test to write, and commit — no "TBD"/"add error handling"/"similar to Task N (without specifics)". The repeated repo mechanics are defined once in the Recipe (DRY) and each task states its specific deltas.

**Type consistency:** `DbOrTx`/`Tx` session types defined in Task 4, reused in Tasks 7/11. `getDb()` seam defined in Task 3, used everywhere. `_id`-bearing lean mappers used consistently in Tasks 5/6/7 and referenced in 8–16.

**Open item for the implementer to confirm during Task 10:** whether `user_challenge_progress` needs a `unique(user_id, challenge_id)` index — depends on whether the challenge repo upserts (checked in Task 10 Step 3). If yes, the schema/migration is amended there.
