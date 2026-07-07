import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { transactionRouter } from "../../../src/modules/transaction/transaction.routes";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";

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

  it("nets a same-currency self-transfer to startBalance - fee (no inflation)", async () => {
    const startBalance = 1000; // debtor seeded with 1000 AUD in beforeEach

    const res = await request(makeApp())
      .post("/p2ptransfer")
      .send({
        debtorUserId: debtor._id.toString(),
        creditor: debtor.email, // self-transfer
        amountSrc: 100,
        amountDest: 100,
        srcCurrency: "AUD",
        destCurrency: "AUD",
      });

    expect(res.status).toBe(200);

    const wallet = await WalletInfo.findOne({
      userId: debtor._id,
      walletCurrency: "AUD",
    });
    // Not inflated to startBalance + amount - fee; correctly nets to startBalance - fee.
    expect(wallet?.walletBalance).toBeCloseTo(startBalance - 0.05, 5);
  });
});
