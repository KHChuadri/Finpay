import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { scheduledPaymentRouter } from "../../../src/modules/scheduledPayment/scheduledPayment.routes";
import {
  createTestUser,
  createTestWallet,
  createTestScheduledPayment,
} from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { scheduledPayments, wallets } from "../../../src/db/schema";
import { and, eq } from "drizzle-orm";

// The container wires in the real BullMQ queue instance; mocking the queue
// module here avoids constructing a real Redis connection and lets us assert
// exactly what's enqueued.
vi.mock("../../../queues/scheduledPaymentQueue", () => ({
  scheduledPaymentQueue: {
    add: vi.fn(async (_name: string, _data: unknown, opts: { jobId: string }) => ({
      id: opts.jobId,
    })),
    getJob: vi.fn(async () => undefined),
  },
}));

import { scheduledPaymentQueue } from "../../../queues/scheduledPaymentQueue";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(scheduledPaymentRouter);
  return app;
};

const walletBalance = async (userId: string, currency: string) => {
  const [w] = await getDb()
    .select()
    .from(wallets)
    .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
  return w ? Number(w.walletBalance) : undefined;
};

describe("Scheduled payment routes", () => {
  let debtor: TestUser;
  let creditor: TestUser;

  beforeEach(async () => {
    vi.mocked(scheduledPaymentQueue.add).mockClear();
    vi.mocked(scheduledPaymentQueue.getJob).mockClear();
    vi.mocked(scheduledPaymentQueue.getJob).mockResolvedValue(undefined);

    debtor = await createTestUser({ email: "debtor@test.com" });
    creditor = await createTestUser({ email: "creditor@test.com" });
    await createTestWallet(debtor.id, "AUD", 1000);
  });

  describe("POST /schedule/payment", () => {
    it("creates the payment, enqueues the job with the exact payload/opts, and debits the wallet", async () => {
      const scheduledDate = new Date(Date.now() + 60_000).toISOString();

      const res = await request(makeApp())
        .post("/schedule/payment")
        .send({
          debtorUserId: debtor.id,
          creditorUserEmail: creditor.email,
          scheduledDate,
          amountSrc: 100,
          amountDest: 100,
          currencySrc: "AUD",
          currencyDest: "AUD",
        });

      expect(res.status).toBe(200);
      expect(res.body).toMatchObject({
        success: true,
        message: "Payment scheduled successfully",
        date: scheduledDate,
      });
      expect(res.body.paymentId).toBeDefined();

      // DB record shape.
      const [payment] = await getDb()
        .select()
        .from(scheduledPayments)
        .where(eq(scheduledPayments.id, res.body.paymentId));
      expect(payment).toBeDefined();
      expect(payment).toMatchObject({
        debtorId: debtor.id,
        creditorId: creditor.id,
        currencySrc: "AUD",
        currencyDest: "AUD",
        status: "pending",
        jobId: res.body.paymentId,
      });
      expect(Number(payment.amountSrc)).toBe(100);
      expect(Number(payment.amountDest)).toBe(100);

      // Job enqueued with the exact legacy payload/opts.
      expect(scheduledPaymentQueue.add).toHaveBeenCalledTimes(1);
      const [name, jobData, opts] = vi.mocked(scheduledPaymentQueue.add).mock.calls[0];
      expect(name).toBe("scheduled-payments");
      expect(jobData).toEqual({
        paymentId: res.body.paymentId,
        debtorId: debtor.id,
        creditorId: creditor.id,
        amountSrc: 100,
        amountDest: 100,
        currencySrc: "AUD",
        currencyDest: "AUD",
      });
      expect(opts.jobId).toBe(res.body.paymentId);
      expect(opts.delay).toBeGreaterThan(0);
      expect(opts.delay).toBeLessThanOrEqual(60_000);

      // Wallet debited by amountSrc.
      expect(await walletBalance(debtor.id, "AUD")).toBe(900);
    });

    it("returns 400 on insufficient balance (payment/job already created, matching legacy)", async () => {
      const scheduledDate = new Date(Date.now() + 60_000).toISOString();

      const res = await request(makeApp())
        .post("/schedule/payment")
        .send({
          debtorUserId: debtor.id,
          creditorUserEmail: creditor.email,
          scheduledDate,
          amountSrc: 5000,
          amountDest: 5000,
          currencySrc: "AUD",
          currencyDest: "AUD",
        });

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "initiateScheduledPayment: insufficient balance",
      });

      // Legacy quirk: the job/payment are enqueued/created before the
      // balance check runs, so they still exist despite the 400.
      expect(scheduledPaymentQueue.add).toHaveBeenCalledTimes(1);
      const payments = await getDb()
        .select()
        .from(scheduledPayments)
        .where(eq(scheduledPayments.debtorId, debtor.id));
      expect(payments).toHaveLength(1);

      expect(await walletBalance(debtor.id, "AUD")).toBe(1000);
    });
  });

  describe("DELETE /schedule/payment/:paymentId", () => {
    it("removes the queue job, deletes the payment, and refunds the wallet", async () => {
      const payment = await createTestScheduledPayment({
        debtorId: debtor.id,
        creditorId: creditor.id,
        amountSrc: 100,
        currencySrc: "AUD",
        jobId: "job-123",
      });

      const removeMock = vi.fn(async () => undefined);
      vi.mocked(scheduledPaymentQueue.getJob).mockResolvedValueOnce({
        remove: removeMock,
      });

      const res = await request(makeApp())
        .delete(`/schedule/payment/${payment.id}`)
        .query({ userId: debtor.id });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: "Payment cancelled successfully",
      });

      expect(scheduledPaymentQueue.getJob).toHaveBeenCalledWith("job-123");
      expect(removeMock).toHaveBeenCalledTimes(1);

      const [remaining] = await getDb()
        .select()
        .from(scheduledPayments)
        .where(eq(scheduledPayments.id, payment.id));
      expect(remaining).toBeUndefined();

      expect(await walletBalance(debtor.id, "AUD")).toBe(1100);
    });

    it("returns 404 when the payment does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp())
        .delete(`/schedule/payment/${missingId}`)
        .query({ userId: debtor.id });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "Payment not found" });
    });
  });

  describe("GET /getScheduledPayments/:userId", () => {
    it("returns only pending payments (raw _id shape), with legacy pagination counting all statuses", async () => {
      const pending1 = await createTestScheduledPayment({
        debtorId: debtor.id,
        creditorId: creditor.id,
        amountSrc: 50,
      });
      const missingCreditorId = randomUUID();
      const pending2 = await createTestScheduledPayment({
        debtorId: debtor.id,
        creditorId: missingCreditorId,
        amountSrc: 75,
      });
      await createTestScheduledPayment({
        debtorId: debtor.id,
        creditorId: creditor.id,
        amountSrc: 20,
        status: "completed",
      });

      const res = await request(makeApp())
        .get(`/getScheduledPayments/${debtor.id}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.currentPage).toBe(1);
      // Legacy quirk: totalPayments counts ALL statuses, not just pending.
      expect(res.body.totalPayments).toBe(3);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.scheduledPayment).toHaveLength(2);

      const ids = res.body.scheduledPayment.map((p: { _id: string }) => p._id);
      expect(ids).toEqual(expect.arrayContaining([pending1.id, pending2.id]));

      // Locks the raw shape: `_id` present, resolved emails, and the
      // "Locked or deleted user" fallback for a missing creditor.
      const item2 = res.body.scheduledPayment.find(
        (p: { _id: string }) => p._id === pending2.id
      );
      expect(item2).toMatchObject({
        _id: pending2.id,
        debtorId: debtor.id,
        debtorEmail: debtor.email,
        creditorId: missingCreditorId,
        creditorEmail: "Locked or deleted user",
        amountSrc: 75,
        amountDest: 100,
        currencySrc: "AUD",
        currencyDest: "AUD",
      });
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp())
        .get(`/getScheduledPayments/${missingId}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({
        errorMsg: "getScheduledPayment: User not found",
      });
    });
  });
});
