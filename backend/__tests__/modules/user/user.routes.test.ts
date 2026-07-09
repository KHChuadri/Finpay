import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { userRouter } from "../../../src/modules/user/user.routes";
import { createTestUser } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { transactions } from "../../../src/db/schema";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(userRouter);
  return app;
};

describe("User routes", () => {
  let user: TestUser;

  beforeEach(async () => {
    user = await createTestUser({ email: "user-routes@test.com", rank: "gold" });
  });

  describe("GET /:userId/rank", () => {
    it("returns the user's rank", async () => {
      const res = await request(makeApp()).get(`/${user.id}/rank`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ rank: "gold" });
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp()).get(`/${missingId}/rank`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        errorMsg: `getUserRank: User with id ${missingId} not found!`,
      });
    });
  });

  describe("GET /isAdmin/:userId", () => {
    it("returns success + isAdmin flag", async () => {
      const admin = await createTestUser({
        email: "admin@test.com",
        isAdmin: true,
      });

      const res = await request(makeApp()).get(`/isAdmin/${admin.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, isAdmin: true });
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp()).get(`/isAdmin/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        errorMsg: `getUserIsAdmin: User with id ${missingId} not found`,
      });
    });
  });

  describe("GET /user/transaction/history", () => {
    it("returns the raw transaction history docs owned by the user", async () => {
      const [tx1, tx2] = await getDb()
        .insert(transactions)
        .values([
          {
            amountSrc: "100",
            currencySource: "AUD",
            amountDest: "100",
            currencyDest: "AUD",
            fromAccount: user.id,
            toAccount: user.id,
            fromAccountEmail: user.email,
            toAccountEmail: user.email,
            fromAccountId: user.id,
            toAccountId: user.id,
            description: "first",
          },
          {
            amountSrc: "50",
            currencySource: "USD",
            amountDest: "50",
            currencyDest: "USD",
            fromAccount: user.id,
            toAccount: user.id,
            fromAccountEmail: user.email,
            toAccountEmail: user.email,
            fromAccountId: user.id,
            toAccountId: user.id,
            description: "second",
          },
        ])
        .returning();

      const res = await request(makeApp()).get(
        `/user/transaction/history?userId=${user.id}`
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(2);
      expect(res.body).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            _id: tx1.id,
            description: "first",
            amountSrc: 100,
            currencySource: "AUD",
          }),
          expect.objectContaining({
            _id: tx2.id,
            description: "second",
            amountSrc: 50,
            currencySource: "USD",
          }),
        ])
      );
      // Locks the raw-doc shape: `_id`, not a flattened `id`.
      for (const tx of res.body) {
        expect(tx._id).toBeDefined();
        expect(tx.id).toBeUndefined();
        expect(tx.createdAt).toBeDefined();
      }
    });

    it("returns 400 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp()).get(
        `/user/transaction/history?userId=${missingId}`
      );

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "User not found or does not exist",
      });
    });
  });
});
