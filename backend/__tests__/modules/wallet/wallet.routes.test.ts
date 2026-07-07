import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express, { Request, Response } from "express";
import mongoose from "mongoose";
import { walletService } from "../../../src/modules/wallet/wallet.container";
const getUserWallet = (userId: string) => walletService.getAllWallets(userId);
const getUserWalletInfo = (userId: string, currency: string) =>
  walletService.getWalletInfoByCurrency(userId, currency);
const storeMultiWallet = (userId: string, walletCurrency: string) =>
  walletService.createCurrencyWallet(userId, walletCurrency);
const getCurrentWallet = (currency: string, userId: string) =>
  walletService.getCurrentWallet(userId, currency);
const deleteWallet = (currency: string, userId: string) =>
  walletService.deleteWallet(userId, currency);
import { handleHTTPError } from "../../../src/helper/handleHTTPError";
import { createTestUser, createTestWallet } from "../../helpers/testFactories";
import { UserType } from "../../../model/User";

// Mirrors the inline route wiring in src/app.ts exactly. The legacy handler
// files are reshaped into thin delegates to the new wallet service during the
// migration, so this test keeps exercising them through the same HTTP
// contract (params/query/body/status/JSON) across the refactor.
const makeApp = () => {
  const app = express();
  app.use(express.json());

  app.get("/wallet/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const currency = req.query.currency as string;
      const response = currency
        ? await getUserWalletInfo(userId, currency)
        : await getUserWallet(userId);

      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  app.put("/wallet/:userId", async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const { walletCurrency } = req.body;

      const response = await storeMultiWallet(userId, walletCurrency);
      res.json(response);
    } catch (err: unknown) {
      handleHTTPError(err, res);
    }
  });

  app.get(
    "/currencywallet/:currency/:userId",
    async (req: Request, res: Response) => {
      try {
        const { currency, userId } = req.params;
        const response = await getCurrentWallet(currency, userId);

        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  app.delete(
    "/currencywallet/:currency/:userId",
    async (req: Request, res: Response) => {
      try {
        const { currency, userId } = req.params;
        const response = await deleteWallet(currency, userId);

        res.json(response);
      } catch (err: unknown) {
        handleHTTPError(err, res);
      }
    }
  );

  return app;
};

describe("Wallet routes", () => {
  let user: UserType;

  beforeEach(async () => {
    user = await createTestUser({ email: "wallet@test.com" });
  });

  describe("GET /wallet/:userId (no currency)", () => {
    it("returns all of the user's wallets", async () => {
      const audWallet = await createTestWallet(
        user._id.toString(),
        "AUD",
        1000
      );
      const usdWallet = await createTestWallet(
        user._id.toString(),
        "USD",
        500
      );

      const res = await request(makeApp()).get(
        `/wallet/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body.wallets).toHaveLength(2);
      expect(res.body.wallets).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: audWallet._id.toString(),
            walletCurrency: "AUD",
            walletBalance: 1000,
            userId: user._id.toString(),
          }),
          expect.objectContaining({
            _id: usdWallet._id.toString(),
            walletCurrency: "USD",
            walletBalance: 500,
            userId: user._id.toString(),
          }),
        ])
      );
      // Locks the raw-doc shape: `_id`, not a flattened `id`.
      for (const wallet of res.body.wallets) {
        expect(wallet._id).toBeDefined();
        expect(wallet.id).toBeUndefined();
      }
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const res = await request(makeApp()).get(`/wallet/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "getUserWallet: user not found" });
    });
  });

  describe("GET /wallet/:userId?currency=", () => {
    it("returns the matching currency wallet", async () => {
      const wallet = await createTestWallet(user._id.toString(), "AUD", 1000);

      const res = await request(makeApp()).get(
        `/wallet/${user._id.toString()}?currency=AUD`
      );

      expect(res.status).toBe(200);
      expect(res.body.correspondingWallet).toMatchObject({
        _id: wallet._id.toString(),
        walletCurrency: "AUD",
        walletBalance: 1000,
        userId: user._id.toString(),
      });
      // Locks the raw-doc shape: `_id`, not a flattened `id`.
      expect(res.body.correspondingWallet._id).toBeDefined();
      expect(res.body.correspondingWallet.id).toBeUndefined();
    });

    it("returns 404 when the user has no wallet in that currency", async () => {
      const res = await request(makeApp()).get(
        `/wallet/${user._id.toString()}?currency=EUR`
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        errorMsg:
          "getUserWalletInfo: User has no wallet with corresponding currency.",
      });
    });
  });

  describe("PUT /wallet/:userId", () => {
    it("creates a new currency wallet", async () => {
      const res = await request(makeApp())
        .put(`/wallet/${user._id.toString()}`)
        .send({ walletCurrency: "EUR" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Store multi wallet successful" });
    });

    it("returns 400 when the currency already exists on the wallet", async () => {
      await createTestWallet(user._id.toString(), "AUD", 1000);

      const res = await request(makeApp())
        .put(`/wallet/${user._id.toString()}`)
        .send({ walletCurrency: "AUD" });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "This currency has already been added to your wallet",
      });
    });
  });

  describe("GET /currencywallet/:currency/:userId", () => {
    it("returns the wallet id/balance/currency", async () => {
      const wallet = await createTestWallet(user._id.toString(), "AUD", 1000);

      const res = await request(makeApp()).get(
        `/currencywallet/AUD/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        walletId: wallet._id.toString(),
        walletBalance: 1000,
        walletCurrency: "AUD",
      });
    });

    it("returns 404 when the wallet does not exist", async () => {
      const res = await request(makeApp()).get(
        `/currencywallet/EUR/${user._id.toString()}`
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "wallet not found" });
    });
  });

  describe("DELETE /currencywallet/:currency/:userId", () => {
    it("deletes the wallet", async () => {
      await createTestWallet(user._id.toString(), "AUD", 1000);

      const res = await request(makeApp()).delete(
        `/currencywallet/AUD/${user._id.toString()}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Wallet deleted successfully" });

      const remaining = await request(makeApp()).get(
        `/currencywallet/AUD/${user._id.toString()}`
      );
      expect(remaining.status).toBe(404);
    });

    it("returns 404 when the wallet does not exist", async () => {
      const res = await request(makeApp()).delete(
        `/currencywallet/EUR/${user._id.toString()}`
      );

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "wallet not found" });
    });
  });
});
