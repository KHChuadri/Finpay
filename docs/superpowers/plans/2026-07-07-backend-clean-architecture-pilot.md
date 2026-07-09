# Backend Clean Architecture Refactor — Pilot Slice Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate the `p2ptransfer` endpoint from the 1300-line god-file `app.ts` into a layered `route → controller → service → repository` module, proving a repeatable pattern for strangling the rest of the backend.

**Architecture:** Pragmatic layered Clean Architecture (NOT full tactical DDD — no aggregates/value-objects/domain-events). Each feature becomes a self-contained module folder. Mongoose models are hidden behind a repository interface so business logic never touches the ORM. Cross-slice collaborators (exchange rate, challenge tracking) are injected as function dependencies so the service is unit-testable without a database. Migration is **strangler-pattern, incremental**: old routes/functions keep working until the new slice lands, then the old code for that slice is deleted. The existing blackbox integration test is the behavioral contract and stays green throughout.

**Tech Stack:** Node, TypeScript, Express 5, Mongoose 8, Vitest 3, `http-errors`, `mongodb-memory-server` (tests).

## Global Constraints

- Branch: `fix/backend-refactor` (already created).
- Do NOT change public HTTP behavior: same routes, request bodies, status codes, response JSON shapes.
- Do NOT edit files under `model/` — repositories wrap the existing schemas as-is.
- Keep the existing `backend/__tests__/transactions/p2ptransfer.test.ts` passing UNCHANGED — it is the safety net.
- Error style: throw `http-errors` (`HTTPError(status, msg)`); HTTP translation stays in the shared handler. Preserve exact error messages.
- TypeScript strict must still compile (`npx tsc --noEmit`).
- All commands run from `backend/`.
- Tests: `npx vitest run <path>`.

---

## Current State (diagnosis)

- `src/app.ts` — ~1300 lines, ~70 routes inline. Each route hand-parses `req.body`, calls one use-case function, funnels errors through `handleHTTPError`. Also contains raw DB logic inline (`/admin/checkAllBalanceChallenges`, `/test/*`).
- `src/<feature>/<fn>.ts` — one async function per use case. Positional primitive args. Imports Mongoose models directly. Mixes validation + business rules + persistence + cross-feature calls (`p2pTransfer` reaches into `exchangeRate`, `checkBalanceChallenges`, `trackChallengeProgress`).
- `model/` — 15 Mongoose schemas, the only "domain".
- No layering: controller = service = repository, collapsed into one function.

## Target Structure (this pilot introduces)

```
backend/src/
  shared/
    http/asyncHandler.ts          # wraps async route handlers → handleHTTPError
  modules/
    transaction/
      transaction.types.ts        # DTOs + repo/service interfaces
      transaction.repository.ts    # Mongoose adapter (hides User/WalletInfo/TransactionHistory)
      transaction.service.ts      # business logic, deps injected
      transaction.controller.ts   # req/res parsing only
      transaction.routes.ts       # express.Router wiring
      README.md                   # the pattern, for replicating to other slices
```

`src/transactions/p2ptransfer.ts` is reduced to a thin delegate that calls the new service with real dependencies wired in, so the existing integration test keeps importing the same path and stays green. It gets deleted only in the final follow-up when its test is migrated.

## File Structure map

- **Create** `src/shared/http/asyncHandler.ts` — reusable across every future slice.
- **Create** `src/modules/transaction/transaction.types.ts` — the contracts. Owned by this module.
- **Create** `src/modules/transaction/transaction.repository.ts` — only file allowed to import Mongoose models for this slice.
- **Create** `src/modules/transaction/transaction.service.ts` — pure-ish business logic.
- **Create** `src/modules/transaction/transaction.controller.ts` — thin.
- **Create** `src/modules/transaction/transaction.routes.ts` — `express.Router`.
- **Create** `src/modules/transaction/README.md` — pattern doc.
- **Modify** `src/transactions/p2ptransfer.ts` — becomes delegate.
- **Modify** `src/app.ts` — remove inline `/p2ptransfer` route + its import; mount `transactionRouter`.
- **Create tests** under `__tests__/modules/transaction/`.

---

### Task 0: Shared async handler

**Files:**
- Create: `backend/src/shared/http/asyncHandler.ts`
- Test: `backend/__tests__/shared/asyncHandler.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `asyncHandler(fn: (req: Request, res: Response) => Promise<void>): RequestHandler` — catches thrown errors and routes them through the existing `handleHTTPError(err, res)`.

- [ ] **Step 1: Write the failing test**

```ts
// backend/__tests__/shared/asyncHandler.test.ts
import { describe, it, expect, vi } from "vitest";
import type { Request, Response } from "express";
import HTTPError from "http-errors";
import { asyncHandler } from "../../src/shared/http/asyncHandler";

const mockRes = () => {
  const res = {} as Response;
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
};

describe("asyncHandler", () => {
  it("passes success through without touching the error handler", async () => {
    const res = mockRes();
    const handler = asyncHandler(async (_req, r) => {
      r.status(200).json({ ok: true });
    });
    await handler({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(200);
  });

  it("translates a thrown HTTPError into status + errorMsg", async () => {
    const res = mockRes();
    const handler = asyncHandler(async () => {
      throw HTTPError(404, "nope");
    });
    await handler({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({ errorMsg: "nope" });
  });

  it("translates an unknown error into 500", async () => {
    const res = mockRes();
    const handler = asyncHandler(async () => {
      throw new Error("boom");
    });
    await handler({} as Request, res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ errorMsg: "Unexpected error" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/shared/asyncHandler.test.ts`
Expected: FAIL — cannot find module `../../src/shared/http/asyncHandler`.

- [ ] **Step 3: Write minimal implementation**

```ts
// backend/src/shared/http/asyncHandler.ts
import { Request, Response, NextFunction, RequestHandler } from "express";
import { handleHTTPError } from "../../helper/handleHTTPError";

/**
 * Wraps an async route handler so thrown errors are funneled through
 * the shared HTTP error translator instead of being repeated per-route.
 */
export const asyncHandler =
  (fn: (req: Request, res: Response) => Promise<void>): RequestHandler =>
  async (req: Request, res: Response, _next: NextFunction) => {
    try {
      await fn(req, res);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/shared/asyncHandler.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add src/shared/http/asyncHandler.ts __tests__/shared/asyncHandler.test.ts
git commit -m "feat(shared): add asyncHandler for layered route error handling"
```

---

### Task 1: Transaction module contracts (types)

**Files:**
- Create: `backend/src/modules/transaction/transaction.types.ts`

**Interfaces:**
- Consumes: nothing.
- Produces (relied on by Tasks 2–4):
  - `interface UserRecord { id: string; email: string; rank: string }`
  - `interface WalletRecord { id: string; userId: string; balance: number; currency: string }`
  - `interface TransferInput { debtorUserId: string; creditorEmail: string; amountSrc: number; amountDest: number; currencySource: string; currencyDest: string }`
  - `interface TransferResult { success: true; message: string; debtorWalletId: string; creditorWalletId: string; amountTransferred: string; newDebtorBalance: number; newCreditorBalance: number }`
  - `interface ITransactionRepository` (methods listed below)
  - `interface TransactionServiceDeps { repo: ITransactionRepository; exchangeRate: (src: string, dest: string) => Promise<{ rate: number }>; checkBalanceChallenges: (userId: string) => Promise<unknown>; trackChallengeProgress: (category: string, userId: string, amount: number) => Promise<unknown> }`

- [ ] **Step 1: Write the contracts file** (no test — pure type declarations, exercised by Tasks 2–3 tests)

```ts
// backend/src/modules/transaction/transaction.types.ts

export interface UserRecord {
  id: string;
  email: string;
  rank: string;
}

export interface WalletRecord {
  id: string;
  userId: string;
  balance: number;
  currency: string;
}

export interface TransferInput {
  debtorUserId: string;
  creditorEmail: string;
  amountSrc: number;
  amountDest: number;
  currencySource: string;
  currencyDest: string;
}

export interface TransferResult {
  success: true;
  message: string;
  debtorWalletId: string;
  creditorWalletId: string;
  amountTransferred: string;
  newDebtorBalance: number;
  newCreditorBalance: number;
}

export interface RecordTransactionInput {
  fromUser: UserRecord;
  toUser: UserRecord;
  amountSrc: number;
  amountDest: number;
  currencySource: string;
  currencyDest: string;
  description: string;
}

export interface ITransactionRepository {
  findUserById(id: string): Promise<UserRecord | null>;
  findUserByEmail(email: string): Promise<UserRecord | null>;
  findWallet(userId: string, currency: string): Promise<WalletRecord | null>;
  createWallet(userId: string, currency: string): Promise<WalletRecord>;
  /** Applies delta to the wallet balance, persists, returns the new balance. */
  adjustWalletBalance(walletId: string, delta: number): Promise<number>;
  /** Creates a TransactionHistory doc and appends its id to both users' history
   *  (once only when fromUser.id === toUser.id). Returns the new transaction id. */
  recordTransaction(input: RecordTransactionInput): Promise<string>;
}

export interface TransactionServiceDeps {
  repo: ITransactionRepository;
  exchangeRate: (src: string, dest: string) => Promise<{ rate: number }>;
  checkBalanceChallenges: (userId: string) => Promise<unknown>;
  trackChallengeProgress: (
    category: string,
    userId: string,
    amount: number
  ) => Promise<unknown>;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/modules/transaction/transaction.types.ts
git commit -m "feat(transaction): define layered module contracts"
```

---

### Task 2: Transaction service (business logic, deps injected)

**Files:**
- Create: `backend/src/modules/transaction/transaction.service.ts`
- Test: `backend/__tests__/modules/transaction/transaction.service.test.ts`

**Interfaces:**
- Consumes: everything from `transaction.types.ts`; `Ranks` from `src/ranks`.
- Produces: `createTransactionService(deps: TransactionServiceDeps): { transfer(input: TransferInput): Promise<TransferResult> }`

The `transfer` logic must reproduce `src/transactions/p2ptransfer.ts` exactly: amount>0 guard, debtor lookup, debtor-wallet lookup, self-transfer shortcut, creditor lookup, lazy creditor-wallet creation, insufficient-balance guard, rank service fee, transaction record, balance adjustments, challenge checks, AUD-normalized challenge progress, identical return shape and messages.

- [ ] **Step 1: Write the failing test** (pure unit test, fake repo, no DB)

```ts
// backend/__tests__/modules/transaction/transaction.service.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import HTTPError from "http-errors";
import { createTransactionService } from "../../../src/modules/transaction/transaction.service";
import type {
  ITransactionRepository,
  UserRecord,
  WalletRecord,
} from "../../../src/modules/transaction/transaction.types";

vi.mock("../../../src/ranks", () => ({
  Ranks: [{ name: "bronze", serviceFee: 0.05 }],
}));

const debtor: UserRecord = { id: "d1", email: "debtor@test.com", rank: "bronze" };
const creditor: UserRecord = { id: "c1", email: "creditor@test.com", rank: "bronze" };

const makeRepo = (over: Partial<ITransactionRepository> = {}): ITransactionRepository => ({
  findUserById: vi.fn(async (id) => (id === "d1" ? debtor : null)),
  findUserByEmail: vi.fn(async (e) => (e === creditor.email ? creditor : null)),
  findWallet: vi.fn(async (userId, currency): Promise<WalletRecord | null> => {
    if (userId === "d1" && currency === "AUD")
      return { id: "w-d", userId: "d1", balance: 1000, currency: "AUD" };
    if (userId === "c1" && currency === "AUD")
      return { id: "w-c", userId: "c1", balance: 500, currency: "AUD" };
    return null;
  }),
  createWallet: vi.fn(async (userId, currency) => ({
    id: "w-new", userId, balance: 0, currency,
  })),
  adjustWalletBalance: vi.fn(async (walletId, delta) =>
    (walletId === "w-d" ? 1000 : 500) + delta
  ),
  recordTransaction: vi.fn(async () => "tx1"),
  ...over,
});

const makeDeps = (repo: ITransactionRepository) => ({
  repo,
  exchangeRate: vi.fn(async () => ({ rate: 1 })),
  checkBalanceChallenges: vi.fn(async () => undefined),
  trackChallengeProgress: vi.fn(async () => undefined),
});

describe("transaction.service.transfer", () => {
  let repo: ITransactionRepository;
  let deps: ReturnType<typeof makeDeps>;

  beforeEach(() => {
    repo = makeRepo();
    deps = makeDeps(repo);
  });

  it("transfers between two users, applying the bronze service fee", async () => {
    const service = createTransactionService(deps);
    const result = await service.transfer({
      debtorUserId: "d1",
      creditorEmail: creditor.email,
      amountSrc: 100,
      amountDest: 100,
      currencySource: "AUD",
      currencyDest: "AUD",
    });

    expect(result).toEqual({
      success: true,
      message: "Transfer successful",
      debtorWalletId: "w-d",
      creditorWalletId: "w-c",
      amountTransferred: "100AUD",
      newDebtorBalance: 900,
      newCreditorBalance: 600 - 0.05,
    });
    expect(repo.adjustWalletBalance).toHaveBeenCalledWith("w-d", -100);
    expect(repo.adjustWalletBalance).toHaveBeenCalledWith("w-c", 100 - 0.05);
    expect(deps.checkBalanceChallenges).toHaveBeenCalledTimes(2);
    expect(deps.trackChallengeProgress).toHaveBeenCalledWith("pay", "d1", 100);
    expect(deps.trackChallengeProgress).toHaveBeenCalledWith("receive", "c1", 100);
  });

  it("rejects non-positive amounts", async () => {
    const service = createTransactionService(deps);
    await expect(
      service.transfer({
        debtorUserId: "d1", creditorEmail: creditor.email,
        amountSrc: 0, amountDest: 0, currencySource: "AUD", currencyDest: "AUD",
      })
    ).rejects.toThrow(HTTPError(400, "Invalid transfer amount"));
  });

  it("rejects when the debtor does not exist", async () => {
    const service = createTransactionService(deps);
    await expect(
      service.transfer({
        debtorUserId: "ghost", creditorEmail: creditor.email,
        amountSrc: 100, amountDest: 100, currencySource: "AUD", currencyDest: "AUD",
      })
    ).rejects.toThrow("p2ptransfer: UserId: ghost not found");
  });

  it("rejects on insufficient balance", async () => {
    const service = createTransactionService(deps);
    await expect(
      service.transfer({
        debtorUserId: "d1", creditorEmail: creditor.email,
        amountSrc: 5000, amountDest: 5000, currencySource: "AUD", currencyDest: "AUD",
      })
    ).rejects.toThrow("Insufficient balance");
  });

  it("lazily creates the creditor wallet when missing", async () => {
    const service = createTransactionService(deps);
    await service.transfer({
      debtorUserId: "d1", creditorEmail: creditor.email,
      amountSrc: 100, amountDest: 100, currencySource: "AUD", currencyDest: "USD",
    });
    expect(repo.createWallet).toHaveBeenCalledWith("c1", "USD");
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/modules/transaction/transaction.service.test.ts`
Expected: FAIL — cannot find module `transaction.service`.

- [ ] **Step 3: Write the implementation**

```ts
// backend/src/modules/transaction/transaction.service.ts
import HTTPError from "http-errors";
import { Ranks } from "../../ranks";
import type {
  TransactionServiceDeps,
  TransferInput,
  TransferResult,
} from "./transaction.types";

export const createTransactionService = (deps: TransactionServiceDeps) => {
  const { repo, exchangeRate, checkBalanceChallenges, trackChallengeProgress } =
    deps;

  const transfer = async (input: TransferInput): Promise<TransferResult> => {
    const {
      debtorUserId,
      creditorEmail,
      amountSrc,
      amountDest,
      currencySource,
      currencyDest,
    } = input;

    if (amountSrc <= 0) {
      throw HTTPError(400, "Invalid transfer amount");
    }

    const debtor = await repo.findUserById(debtorUserId);
    if (!debtor) {
      throw HTTPError(404, `p2ptransfer: UserId: ${debtorUserId} not found`);
    }

    const debtorWallet = await repo.findWallet(debtorUserId, currencySource);
    if (!debtorWallet) {
      throw HTTPError(404, "p2ptransfer: Debtor wallet not found");
    }

    // Self-transfer: the debtor is also the creditor.
    let creditor;
    if (creditorEmail === debtor.email) {
      creditor = debtor;
    } else {
      creditor = await repo.findUserByEmail(creditorEmail);
      if (!creditor) {
        throw HTTPError(404, "User not found");
      }
    }

    const creditorWallet =
      (await repo.findWallet(creditor.id, currencyDest)) ??
      (await repo.createWallet(creditor.id, currencyDest));

    if (debtorWallet.balance - Number(amountSrc) < 0) {
      throw HTTPError(400, "Insufficient balance");
    }

    const serviceFee =
      Ranks.find((rank) => rank.name === debtor.rank)?.serviceFee ?? 0;

    await repo.recordTransaction({
      fromUser: debtor,
      toUser: creditor,
      amountSrc,
      amountDest,
      currencySource,
      currencyDest,
      description: "P2P Transfer",
    });

    const newDebtorBalance = await repo.adjustWalletBalance(
      debtorWallet.id,
      -Number(amountSrc)
    );
    const newCreditorBalance = await repo.adjustWalletBalance(
      creditorWallet.id,
      Number(amountDest - serviceFee)
    );

    await checkBalanceChallenges(debtorUserId);
    await checkBalanceChallenges(creditor.id);

    // Normalize to AUD for challenge progress, matching legacy behavior.
    const srcToAud = await exchangeRate(currencySource, "AUD");
    const destToAud = await exchangeRate(currencyDest, "AUD");
    await trackChallengeProgress("pay", debtor.id, amountSrc * srcToAud.rate);
    await trackChallengeProgress(
      "receive",
      creditor.id,
      amountDest * destToAud.rate
    );

    return {
      success: true,
      message: "Transfer successful",
      debtorWalletId: debtorWallet.id,
      creditorWalletId: creditorWallet.id,
      amountTransferred: `${amountSrc}${currencySource}`,
      newDebtorBalance,
      newCreditorBalance,
    };
  };

  return { transfer };
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/modules/transaction/transaction.service.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/transaction/transaction.service.ts __tests__/modules/transaction/transaction.service.test.ts
git commit -m "feat(transaction): add dependency-injected transfer service"
```

---

### Task 3: Transaction repository (Mongoose adapter)

**Files:**
- Create: `backend/src/modules/transaction/transaction.repository.ts`
- Test: `backend/__tests__/modules/transaction/transaction.repository.test.ts` (integration, in-memory Mongo)

**Interfaces:**
- Consumes: `ITransactionRepository` etc. from `transaction.types.ts`; models `User`, `WalletInfo`, `TransactionHistory`.
- Produces: `export const transactionRepository: ITransactionRepository` (a concrete Mongoose-backed singleton).

> The test setup file `__tests__/setup/setup.ts` already boots `mongodb-memory-server` (used by the existing p2ptransfer integration test). Confirm it applies to this test path; if it is wired via `vitest.config.mts` `setupFiles`, no extra work is needed.

- [ ] **Step 1: Write the failing test**

```ts
// backend/__tests__/modules/transaction/transaction.repository.test.ts
import { describe, it, expect, beforeEach } from "vitest";
import { transactionRepository as repo } from "../../../src/modules/transaction/transaction.repository";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import User, { UserType } from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import TransactionHistory from "../../../model/TransactionHistory";

describe("transactionRepository", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser({ email: "repo@test.com", rank: "bronze" });
  });

  it("maps a user document to a flat UserRecord", async () => {
    const record = await repo.findUserById(user._id.toString());
    expect(record).toEqual({
      id: user._id.toString(),
      email: "repo@test.com",
      rank: "bronze",
    });
  });

  it("returns null for a missing user", async () => {
    const record = await repo.findUserByEmail("nobody@test.com");
    expect(record).toBeNull();
  });

  it("finds a wallet as a flat WalletRecord", async () => {
    const w = await createTestWallet(user._id.toString(), "AUD", 250);
    const record = await repo.findWallet(user._id.toString(), "AUD");
    expect(record).toEqual({
      id: w._id.toString(),
      userId: user._id.toString(),
      balance: 250,
      currency: "AUD",
    });
  });

  it("creates a wallet and links it to the user", async () => {
    const record = await repo.createWallet(user._id.toString(), "USD");
    expect(record.balance).toBe(0);
    expect(record.currency).toBe("USD");
    const updated = await User.findById(user._id);
    expect(updated?.walletInfo.map(String)).toContain(record.id);
  });

  it("adjusts a wallet balance and returns the new value", async () => {
    const w = await createTestWallet(user._id.toString(), "AUD", 100);
    const balance = await repo.adjustWalletBalance(w._id.toString(), -30);
    expect(balance).toBe(70);
    const reloaded = await WalletInfo.findById(w._id);
    expect(reloaded?.walletBalance).toBe(70);
  });

  it("records a transaction and appends it to both users once", async () => {
    const other = await createTestUser({ email: "other@test.com", rank: "bronze" });
    const txId = await repo.recordTransaction({
      fromUser: { id: user._id.toString(), email: user.email, rank: "bronze" },
      toUser: { id: other._id.toString(), email: other.email, rank: "bronze" },
      amountSrc: 100, amountDest: 100,
      currencySource: "AUD", currencyDest: "AUD",
      description: "P2P Transfer",
    });

    const tx = await TransactionHistory.findById(txId);
    expect(tx?.description).toBe("P2P Transfer");
    const from = await User.findById(user._id);
    const to = await User.findById(other._id);
    expect(from?.transactionHistory.map(String)).toContain(txId);
    expect(to?.transactionHistory.map(String)).toContain(txId);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/modules/transaction/transaction.repository.test.ts`
Expected: FAIL — cannot find module `transaction.repository`.

- [ ] **Step 3: Write the implementation**

```ts
// backend/src/modules/transaction/transaction.repository.ts
import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import TransactionHistory from "../../../model/TransactionHistory";
import HTTPError from "http-errors";
import type {
  ITransactionRepository,
  RecordTransactionInput,
  UserRecord,
  WalletRecord,
} from "./transaction.types";

const toUserRecord = (doc: {
  _id: unknown;
  email: string;
  rank: string;
}): UserRecord => ({
  id: String(doc._id),
  email: doc.email,
  rank: doc.rank,
});

const toWalletRecord = (doc: {
  _id: unknown;
  userId: unknown;
  walletBalance: number;
  walletCurrency: string;
}): WalletRecord => ({
  id: String(doc._id),
  userId: String(doc.userId),
  balance: doc.walletBalance,
  currency: doc.walletCurrency,
});

export const transactionRepository: ITransactionRepository = {
  async findUserById(id) {
    const doc = await User.findById(id);
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByEmail(email) {
    const doc = await User.findOne({ email });
    return doc ? toUserRecord(doc) : null;
  },

  async findWallet(userId, currency) {
    const doc = await WalletInfo.findOne({
      userId,
      walletCurrency: currency,
    });
    return doc ? toWalletRecord(doc) : null;
  },

  async createWallet(userId, currency) {
    const doc = await WalletInfo.create({
      userId,
      walletBalance: 0,
      walletCurrency: currency,
    });
    await User.updateOne(
      { _id: userId },
      { $push: { walletInfo: doc._id } }
    );
    return toWalletRecord(doc);
  },

  async adjustWalletBalance(walletId, delta) {
    const doc = await WalletInfo.findById(walletId);
    if (!doc) {
      throw HTTPError(404, "Wallet not found");
    }
    doc.walletBalance += delta;
    await doc.save();
    return doc.walletBalance;
  },

  async recordTransaction(input: RecordTransactionInput) {
    const tx = await TransactionHistory.create({
      amountSrc: input.amountSrc,
      currencySource: input.currencySource,
      amountDest: input.amountDest,
      currencyDest: input.currencyDest,
      fromAccount: input.fromUser.id,
      toAccount: input.toUser.id,
      fromAccountEmail: input.fromUser.email,
      toAccountEmail: input.toUser.email,
      fromAccountId: input.fromUser.id,
      toAccountId: input.toUser.id,
      description: input.description,
    });

    const userIds =
      input.fromUser.id === input.toUser.id
        ? [input.fromUser.id]
        : [input.fromUser.id, input.toUser.id];

    await User.updateMany(
      { _id: { $in: userIds } },
      { $push: { transactionHistory: tx._id } }
    );

    return tx._id.toString();
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run __tests__/modules/transaction/transaction.repository.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
git add src/modules/transaction/transaction.repository.ts __tests__/modules/transaction/transaction.repository.test.ts
git commit -m "feat(transaction): add Mongoose-backed transaction repository"
```

---

### Task 4: Controller + routes + composition, strangle the old inline route

**Files:**
- Create: `backend/src/modules/transaction/transaction.controller.ts`
- Create: `backend/src/modules/transaction/transaction.routes.ts`
- Modify: `backend/src/transactions/p2ptransfer.ts` (becomes delegate)
- Modify: `backend/src/app.ts` (remove inline `/p2ptransfer` route + import; mount router)
- Test: `backend/__tests__/modules/transaction/transaction.routes.test.ts` (supertest, in-memory Mongo)

**Interfaces:**
- Consumes: `createTransactionService`, `transactionRepository`, `asyncHandler`, and the real cross-slice functions `exchangeRate` (`src/exchangeRate`), `checkBalanceChallenges` (`src/challenges/checkBalanceChallenges`), `trackChallengeProgress` (`src/challenges/trackChallengeProgress`).
- Produces:
  - `transactionRouter: express.Router` mounting `POST /p2ptransfer`.
  - `transactionService` (composed singleton) for the delegate to reuse.
  - Reshaped `p2pTransfer(debtorUserId, creditorEmail, amountSrc, amountDest, currencySource, currencyDest)` delegating to `transactionService.transfer(...)` — same signature/behavior as before.

- [ ] **Step 1: Write the failing route test**

```ts
// backend/__tests__/modules/transaction/transaction.routes.test.ts
import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { transactionRouter } from "../../../src/modules/transaction/transaction.routes";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";

vi.mock("../../../src/challenges/trackChallengeProgress", () => ({
  trackChallengeProgress: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../src/challenges/checkBalanceChallenges", () => ({
  checkBalanceChallenges: vi.fn().mockResolvedValue(undefined),
}));
vi.mock("../../../src/exchangeRate", () => ({
  exchangeRate: vi.fn().mockResolvedValue({ rate: 1 }),
}));
vi.mock("../../../src/ranks", () => ({
  Ranks: [{ name: "bronze", serviceFee: 0.05 }],
}));

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(transactionRouter);
  return app;
};

describe("POST /p2ptransfer", () => {
  let debtor: UserType;
  let creditor: UserType;

  beforeEach(async () => {
    debtor = await createTestUser({ email: "debtor@test.com", rank: "bronze" });
    creditor = await createTestUser({ email: "creditor@test.com", rank: "bronze" });
    await createTestWallet(debtor._id.toString(), "AUD", 1000);
    await createTestWallet(creditor._id.toString(), "AUD", 500);
  });

  it("returns 200 and the transfer result", async () => {
    const res = await request(makeApp())
      .post("/p2ptransfer")
      .send({
        debtorUserId: debtor._id.toString(),
        creditor: creditor.email,
        amountSrc: 100,
        amountDest: 100,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({
      success: true,
      message: "Transfer successful",
      amountTransferred: "100AUD",
      newDebtorBalance: 900,
      newCreditorBalance: 600 - 0.05,
    });
  });

  it("returns 400 on insufficient balance", async () => {
    const res = await request(makeApp())
      .post("/p2ptransfer")
      .send({
        debtorUserId: debtor._id.toString(),
        creditor: creditor.email,
        amountSrc: 99999,
        amountDest: 99999,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ errorMsg: "Insufficient balance" });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run __tests__/modules/transaction/transaction.routes.test.ts`
Expected: FAIL — cannot find module `transaction.routes`.

- [ ] **Step 3: Write the controller**

```ts
// backend/src/modules/transaction/transaction.controller.ts
import { Request, Response } from "express";
import { createTransactionService } from "./transaction.service";
import { transactionRepository } from "./transaction.repository";
import { exchangeRate } from "../../exchangeRate";
import { checkBalanceChallenges } from "../../challenges/checkBalanceChallenges";
import { trackChallengeProgress } from "../../challenges/trackChallengeProgress";

// Composition root for the transaction slice: wires real dependencies once.
export const transactionService = createTransactionService({
  repo: transactionRepository,
  exchangeRate,
  checkBalanceChallenges,
  trackChallengeProgress,
});

export const p2pTransferController = async (req: Request, res: Response) => {
  const {
    debtorUserId,
    creditor,
    amountSrc,
    amountDest,
    srcCurrency,
    destCurrency,
  } = req.body;

  const result = await transactionService.transfer({
    debtorUserId,
    creditorEmail: creditor,
    amountSrc,
    amountDest,
    currencySource: srcCurrency,
    currencyDest: destCurrency,
  });

  res.status(200).json(result);
};
```

- [ ] **Step 4: Write the routes**

```ts
// backend/src/modules/transaction/transaction.routes.ts
import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import { p2pTransferController } from "./transaction.controller";

export const transactionRouter = Router();

transactionRouter.post("/p2ptransfer", asyncHandler(p2pTransferController));
```

- [ ] **Step 5: Run the route test to verify it passes**

Run: `npx vitest run __tests__/modules/transaction/transaction.routes.test.ts`
Expected: PASS (2 tests).

- [ ] **Step 6: Reshape the legacy function into a delegate (keeps the old integration test green)**

Replace the entire contents of `backend/src/transactions/p2ptransfer.ts` with:

```ts
// backend/src/transactions/p2ptransfer.ts
// Legacy entry point retained during the strangler migration.
// Delegates to the layered transaction service so existing callers/tests are unaffected.
import { transactionService } from "../modules/transaction/transaction.controller";

export const p2pTransfer = async (
  debtorUserId: string,
  creditorEmail: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) =>
  transactionService.transfer({
    debtorUserId,
    creditorEmail,
    amountSrc,
    amountDest,
    currencySource,
    currencyDest,
  });
```

- [ ] **Step 7: Verify the legacy integration test still passes UNCHANGED**

Run: `npx vitest run __tests__/transactions/p2ptransfer.test.ts`
Expected: PASS (all existing cases). This proves behavior is preserved.

> If a case fails, STOP and diff the failing expectation against the service logic — do not edit the test. The service must match legacy behavior exactly.

- [ ] **Step 8: Strangle the inline route in `app.ts`**

In `backend/src/app.ts`:

1. Remove the import line:
```ts
import { p2pTransfer } from "./transactions/p2ptransfer";
```
2. Delete the entire inline `// Handle p2pTransfer` route block (`app.post("/p2ptransfer", ...)` through its closing `});`).
3. Add the router import near the other imports:
```ts
import { transactionRouter } from "./modules/transaction/transaction.routes";
```
4. Mount it right after `app.use(express.json({ limit: "2mb" }));`:
```ts
  app.use(transactionRouter);
```

- [ ] **Step 9: Verify the whole suite + type-check**

Run: `npx vitest run`
Expected: PASS (all suites, including the untouched legacy p2ptransfer test).

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 10: Commit**

```bash
git add src/modules/transaction/transaction.controller.ts \
        src/modules/transaction/transaction.routes.ts \
        src/transactions/p2ptransfer.ts \
        src/app.ts \
        __tests__/modules/transaction/transaction.routes.test.ts
git commit -m "refactor(transaction): route p2ptransfer through layered module, strangle inline route"
```

---

### Task 5: Pattern doc for replicating to the remaining slices

**Files:**
- Create: `backend/src/modules/transaction/README.md`

**Interfaces:**
- Consumes: the finished transaction module as the reference implementation.
- Produces: a checklist future slices follow.

- [ ] **Step 1: Write the pattern doc**

```markdown
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
```

- [ ] **Step 2: Commit**

```bash
git add src/modules/transaction/README.md
git commit -m "docs(transaction): document layered module pattern for replication"
```

---

## Follow-up (out of scope for this plan — do after pilot review)

Once this pilot is reviewed and the pattern is accepted, replicate Tasks 1–4 per feature area in the migration order above. Each slice is its own plan/PR. Final cleanup: migrate the legacy `__tests__/transactions/p2ptransfer.test.ts` to import the service directly and delete `src/transactions/p2ptransfer.ts`; remove `/test/*` routes from `app.ts`.

## Self-Review

- **Spec coverage:** Scaffolding (Task 0 asyncHandler), layered module for one slice (Tasks 1–4: types/service/repository/controller+routes), strangler cut-over keeping old test green (Task 4 steps 6–9), replication guidance (Task 5). Decisions confirmed with user: pragmatic layered, incremental strangler, pilot one slice. All covered.
- **Placeholder scan:** No TBD/"add validation"/"similar to". Every code step shows full code; error messages copied verbatim from `p2ptransfer.ts`.
- **Type consistency:** `UserRecord`/`WalletRecord`/`ITransactionRepository`/`TransactionServiceDeps`/`TransferInput`/`TransferResult` defined in Task 1 and used unchanged in Tasks 2–4. `createTransactionService(deps).transfer(input)` signature consistent across service impl, controller, delegate, and tests. Route body fields (`creditor`, `srcCurrency`, `destCurrency`) match the legacy inline route in `app.ts:226`.

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-07-07-backend-clean-architecture-pilot.md`. Two execution options:

1. **Subagent-Driven (recommended)** — fresh subagent per task, review between tasks, fast iteration.
2. **Inline Execution** — execute tasks in this session with checkpoints for review.

Which approach?
