import { vi } from "vitest";

// Mock the challenge slice's cross-slice deps (checkBalanceChallenges + trackChallengeProgress)
vi.mock("../../src/modules/challenge/challenge.container", () => ({
  challengeService: {
    trackChallengeProgress: vi.fn().mockResolvedValue({
      success: true,
      completedChallenges: [],
    }),
    checkBalanceChallenges: vi.fn().mockResolvedValue(undefined),
  },
}));

vi.mock("../../src/modules/exchange/exchange.container", () => ({
  exchangeService: {
    getRate: vi
      .fn()
      .mockImplementation(async (source: string, destination: string) => {
      // Simulate exchange rates
      const rates: Record<string, number> = {
        USD: 1.0,
        AUD: 1.5,
        EUR: 0.85,
        GBP: 0.73,
        JPY: 110.0,
        SGD: 1.35,
        // Add more currencies as needed
      };

      if (!rates[source]) {
        throw new Error(
          `Currency exchange from ${source} is not yet supported`
        );
      }
      if (!rates[destination]) {
        throw new Error(
          `Currency exchange to ${destination} is not yet supported`
        );
      }

      const rate = rates[destination] / rates[source];
      return { rate };
    }),
  },
}));

vi.mock("../../src/ranks", () => ({
  Ranks: [
    { name: "bronze", serviceFee: 0.05 },    // 0.05 fee for bronze
    { name: "silver", serviceFee: 0.03 },    // 0.03 fee for silver
    { name: "gold", serviceFee: 0.01 },      // 0.01 fee for gold
    { name: "platinum", serviceFee: 0 },     // No fee for platinum
  ]
}));

import { describe, it, expect, beforeEach } from "vitest";
import { transactionService } from "../../src/modules/transaction/transaction.container";
const p2pTransfer = (
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
import { createTestUser, createTestWallet } from "../helpers/testFactories";
import WalletInfo, { WalletInfoType } from "../../model/WalletInfo";
import TransactionHistory from "../../model/TransactionHistory";
import User, { UserType } from "../../model/User";
import mongoose from "mongoose";

describe("P2P Transfer - Blackbox Tests", () => {
  let debtor: UserType;
  let creditor: UserType;
  let debtorWallet: WalletInfoType;
  let creditorWallet: WalletInfoType;

  beforeEach(async () => {
    // Create test users
    debtor = await createTestUser({
      email: "debtor@test.com",
      rank: "bronze",
    });

    creditor = await createTestUser({
      email: "creditor@test.com",
    });

    // Create wallets for both users
    debtorWallet = await createTestWallet(debtor._id.toString(), "AUD", 1000);
    creditorWallet = await createTestWallet(
      creditor._id.toString(),
      "AUD",
      500
    );
  });

  describe("Successful Transfers", () => {
    it("should transfer money between two users with same currency", async () => {
      const transferAmount = 100;
      const serviceFee = 0.05

      const result = await p2pTransfer(
        debtor._id.toString(),
        creditor.email,
        transferAmount,
        transferAmount,
        "AUD",
        "AUD"
      );

      // Verify response
      expect(result).toEqual({
        success: true,
        message: "Transfer successful",
        debtorWalletId: debtorWallet._id.toString(),
        creditorWalletId: creditorWallet._id.toString(),
        amountTransferred: `${transferAmount}AUD`,
        newDebtorBalance: 900,
        newCreditorBalance: 600 - serviceFee,
      });

      // Verify database state - debtor wallet
      const updatedDebtorWallet = await WalletInfo.findById(debtorWallet._id);
      expect(updatedDebtorWallet?.walletBalance).toBe(900);

      // Verify database state - creditor wallet
      const updatedCreditorWallet = await WalletInfo.findById(
        creditorWallet._id
      );
      expect(updatedCreditorWallet?.walletBalance).toBe(600 - serviceFee);

      // Verify transaction history was created
      const transactions = await TransactionHistory.find({
        fromAccountId: debtor._id,
        toAccountId: creditor._id,
      });
      expect(transactions).toHaveLength(1);
      expect(transactions[0]).toMatchObject({
        amountSrc: transferAmount,
        amountDest: transferAmount,
        currencySource: "AUD",
        currencyDest: "AUD",
        description: "P2P Transfer",
      });

      // Verify users have transaction in their history
      const updatedDebtor = await User.findById(debtor._id);
      const updatedCreditor = await User.findById(creditor._id);
      expect(updatedDebtor?.transactionHistory).toContainEqual(
        transactions[0]._id
      );
      expect(updatedCreditor?.transactionHistory).toContainEqual(
        transactions[0]._id
      );
    });

    it("should create a new wallet for creditor if it does not exist", async () => {
      // Create creditor without a USD wallet
      const creditorWithoutUsdWallet = await createTestUser({
        email: "new-creditor@test.com",
      });

      const result = await p2pTransfer(
        debtor._id.toString(),
        creditorWithoutUsdWallet.email,
        100,
        100,
        "AUD",
        "USD" // Different currency
      );

      expect(result.success).toBe(true);

      // Verify new wallet was created
      const newWallet = await WalletInfo.findOne({
        userId: creditorWithoutUsdWallet._id,
        walletCurrency: "USD",
      });
      expect(newWallet).toBeDefined();
      expect(newWallet?.walletBalance).toBeGreaterThanOrEqual(0);

      // Verify user's walletInfo was updated
      const updatedUser = await User.findById(creditorWithoutUsdWallet._id);
      expect(updatedUser?.walletInfo).toContainEqual(newWallet?._id);
    });

    it("should handle self-transfer to different wallet currency", async () => {
      // Create USD wallet for debtor
      await createTestWallet(debtor._id.toString(), "USD", 0);

      const result = await p2pTransfer(
        debtor._id.toString(),
        debtor.email, // Self transfer
        100,
        95, // With some conversion
        "AUD",
        "USD"
      );

      expect(result.success).toBe(true);

      // Verify AUD wallet decreased
      const audWallet = await WalletInfo.findOne({
        userId: debtor._id,
        walletCurrency: "AUD",
      });
      expect(audWallet?.walletBalance).toBe(900);

      // Verify USD wallet increased
      const usdWallet = await WalletInfo.findOne({
        userId: debtor._id,
        walletCurrency: "USD",
      });
      expect(usdWallet?.walletBalance).toBeGreaterThan(0);
    });
  });

  describe("Error Cases", () => {
    it("should throw error when debtor does not exist", async () => {
      const fakeUserId = new mongoose.Types.ObjectId().toString();

      await expect(
        p2pTransfer(fakeUserId, creditor.email, 100, 100, "AUD", "AUD")
      ).rejects.toThrow(`p2ptransfer: UserId: ${fakeUserId} not found`);
    });

    it("should throw error when debtor wallet does not exist", async () => {
      // Create user without wallet
      const userWithoutWallet = await createTestUser({
        email: "no-wallet@test.com",
      });

      await expect(
        p2pTransfer(
          userWithoutWallet._id.toString(),
          creditor.email,
          100,
          100,
          "EUR", // Currency that user doesn't have
          "AUD"
        )
      ).rejects.toThrow("p2ptransfer: Debtor wallet not found");
    });

    it("should throw error when balance is insufficient", async () => {
      await expect(
        p2pTransfer(
          debtor._id.toString(),
          creditor.email,
          2000, // More than the 1000 balance
          2000,
          "AUD",
          "AUD"
        )
      ).rejects.toThrow("Insufficient balance");
    });

    it("should throw error when creditor user does not exist", async () => {
      await expect(
        p2pTransfer(
          debtor._id.toString(),
          "nonexistent@test.com",
          100,
          100,
          "AUD",
          "AUD"
        )
      ).rejects.toThrow("User not found");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero amount transfer", async () => {
      await expect (p2pTransfer(
        debtor._id.toString(),
        creditor.email,
        0,
        0,
        "AUD",
        "AUD"
      )).rejects.toThrow("Invalid transfer amount");

      // Balances should remain unchanged
      const debtorWalletAfter = await WalletInfo.findById(debtorWallet._id);
      const creditorWalletAfter = await WalletInfo.findById(creditorWallet._id);

      expect(debtorWalletAfter?.walletBalance).toBe(1000);
      expect(creditorWalletAfter?.walletBalance).toBe(500);
    });

    it("should handle transfers with different source and destination amounts", async () => {
      // Simulating currency conversion
      const result = await p2pTransfer(
        debtor._id.toString(),
        creditor.email,
        100, // Source amount
        95, // Destination amount (after conversion)
        "AUD",
        "USD"
      );

      expect(result.success).toBe(true);

      const debtorWalletAfter = await WalletInfo.findById(debtorWallet._id);
      expect(debtorWalletAfter?.walletBalance).toBe(900);
    });
  });
});
