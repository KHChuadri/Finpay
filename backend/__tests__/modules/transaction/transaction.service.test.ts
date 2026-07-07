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

  it("nets a same-currency self-transfer to startBalance - fee (no inflation)", async () => {
    // Legacy bug: two separate wallet reads let the debit be lost, inflating funds.
    // The refactor debits/credits the SAME wallet via cumulative adjustWalletBalance,
    // so a same-currency self-transfer nets startBalance - fee, not + amount - fee.
    const startBalance = 1000;
    const balances = new Map<string, number>([["w-self", startBalance]]);
    const selfRepo: ITransactionRepository = {
      findUserById: vi.fn(async () => debtor),
      findUserByEmail: vi.fn(async () => debtor),
      // Same userId + same currency for both debtor and creditor lookups -> same wallet id.
      findWallet: vi.fn(async (): Promise<WalletRecord> => ({
        id: "w-self",
        userId: debtor.id,
        balance: balances.get("w-self")!,
        currency: "AUD",
      })),
      createWallet: vi.fn(async (userId, currency) => ({
        id: "w-new", userId, balance: 0, currency,
      })),
      // Mutable, cumulative: the second call sees the first call's mutation.
      adjustWalletBalance: vi.fn(async (walletId, delta) => {
        const next = balances.get(walletId)! + delta;
        balances.set(walletId, next);
        return next;
      }),
      recordTransaction: vi.fn(async () => "tx1"),
    };
    const service = createTransactionService(makeDeps(selfRepo));

    const result = await service.transfer({
      debtorUserId: "d1",
      creditorEmail: debtor.email, // self-transfer
      amountSrc: 100,
      amountDest: 100,
      currencySource: "AUD",
      currencyDest: "AUD",
    });

    // Debit is the intermediate value; credit is the final single-wallet balance.
    expect(result.newDebtorBalance).toBe(startBalance - 100);
    expect(result.newCreditorBalance).toBe(startBalance - 0.05);
    expect(balances.get("w-self")).toBe(startBalance - 0.05);
    // Both adjustments hit the SAME wallet id.
    expect(selfRepo.adjustWalletBalance).toHaveBeenCalledTimes(2);
    expect(selfRepo.adjustWalletBalance).toHaveBeenNthCalledWith(1, "w-self", -100);
    expect(selfRepo.adjustWalletBalance).toHaveBeenNthCalledWith(2, "w-self", 100 - 0.05);
  });
});
