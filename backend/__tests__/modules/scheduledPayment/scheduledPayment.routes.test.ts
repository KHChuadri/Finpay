import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import mongoose from "mongoose";
import { scheduledPaymentRouter } from "../../../src/modules/scheduledPayment/scheduledPayment.routes";
import {
  createTestUser,
  createTestWallet,
  createTestScheduledPayment,
} from "../../helpers/testFactories";
import { UserType } from "../../../model/User";
import ScheduledPayment from "../../../model/ScheduledPayment";
import WalletInfo from "../../../model/WalletInfo";

// The container wires in the real BullMQ queue instance; mocking the queue
// module here avoids constructing a real Redis connection (which throws if
// REDIS_URL isn't set) and lets us assert exactly what's enqueued.
vi.mock("../../../queues/scheduledPaymentQueue", () => ({
  scheduledPaymentQueue: {
    add: vi.fn(async (_name: string, _data: unknown, opts: { jobId: string }) => ({
      id: opts.jobId,
    })),
    getJob: vi.fn(async () => undefined),
  },
}));

import { scheduledPaymentQueue } from "../../../queues/scheduledPaymentQueue";

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(scheduledPaymentRouter);
  return app;
};

describe("Scheduled payment routes", () => {
  let debtor: UserType;
  let creditor: UserType;

  beforeEach(async () => {
    vi.mocked(scheduledPaymentQueue.add).mockClear();
    vi.mocked(scheduledPaymentQueue.getJob).mockClear();
    vi.mocked(scheduledPaymentQueue.getJob).mockResolvedValue(undefined);

    debtor = await createTestUser({ email: "debtor@test.com" });
    creditor = await createTestUser({ email: "creditor@test.com" });
    await createTestWallet(debtor._id.toString(), "AUD", 1000);
  });

  describe("POST /schedule/payment", () => {
    it("creates the payment, enqueues the job with the exact payload/opts, and debits the wallet", async () => {
      const scheduledDate = new Date(Date.now() + 60_000).toISOString();

      const res = await request(makeApp())
        .post("/schedule/payment")
        .send({
          debtorUserId: debtor._id.toString(),
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
      const payment = await ScheduledPayment.findById(res.body.paymentId);
      expect(payment).not.toBeNull();
      expect(payment).toMatchObject({
        debtorId: debtor._id,
        creditorId: creditor._id,
        amountSrc: 100,
        amountDest: 100,
        currencySrc: "AUD",
        currencyDest: "AUD",
        status: "pending",
        jobId: res.body.paymentId,
      });

      // Job enqueued with the exact legacy payload/opts.
      expect(scheduledPaymentQueue.add).toHaveBeenCalledTimes(1);
      const [name, jobData, opts] = vi.mocked(scheduledPaymentQueue.add).mock
        .calls[0];
      expect(name).toBe("scheduled-payments");
      expect(jobData).toEqual({
        paymentId: res.body.paymentId,
        debtorId: debtor._id.toString(),
        creditorId: creditor._id.toString(),
        amountSrc: 100,
        amountDest: 100,
        currencySrc: "AUD",
        currencyDest: "AUD",
      });
      expect(opts.jobId).toBe(res.body.paymentId);
      expect(opts.delay).toBeGreaterThan(0);
      expect(opts.delay).toBeLessThanOrEqual(60_000);

      // Wallet debited by amountSrc.
      const wallet = await WalletInfo.findOne({
        userId: debtor._id,
        walletCurrency: "AUD",
      });
      expect(wallet?.walletBalance).toBe(900);
    });

    it("returns 400 on insufficient balance (payment/job already created, matching legacy)", async () => {
      const scheduledDate = new Date(Date.now() + 60_000).toISOString();

      const res = await request(makeApp())
        .post("/schedule/payment")
        .send({
          debtorUserId: debtor._id.toString(),
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
      const payments = await ScheduledPayment.find({ debtorId: debtor._id });
      expect(payments).toHaveLength(1);

      const wallet = await WalletInfo.findOne({
        userId: debtor._id,
        walletCurrency: "AUD",
      });
      expect(wallet?.walletBalance).toBe(1000);
    });
  });

  describe("DELETE /schedule/payment/:paymentId", () => {
    it("removes the queue job, deletes the payment, and refunds the wallet", async () => {
      const payment = await createTestScheduledPayment({
        debtorId: debtor._id.toString(),
        creditorId: creditor._id.toString(),
        amountSrc: 100,
        currencySrc: "AUD",
        jobId: "job-123",
      });

      const removeMock = vi.fn(async () => undefined);
      vi.mocked(scheduledPaymentQueue.getJob).mockResolvedValueOnce({
        remove: removeMock,
      });

      const res = await request(makeApp())
        .delete(`/schedule/payment/${payment._id.toString()}`)
        .query({ userId: debtor._id.toString() });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        message: "Payment cancelled successfully",
      });

      expect(scheduledPaymentQueue.getJob).toHaveBeenCalledWith("job-123");
      expect(removeMock).toHaveBeenCalledTimes(1);

      const remaining = await ScheduledPayment.findById(payment._id);
      expect(remaining).toBeNull();

      const wallet = await WalletInfo.findOne({
        userId: debtor._id,
        walletCurrency: "AUD",
      });
      expect(wallet?.walletBalance).toBe(1100);
    });

    it("returns 404 when the payment does not exist", async () => {
      const missingId = new mongoose.Types.ObjectId().toString();

      const res = await request(makeApp())
        .delete(`/schedule/payment/${missingId}`)
        .query({ userId: debtor._id.toString() });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "Payment not found" });
    });
  });

  describe("GET /getScheduledPayments/:userId", () => {
    it("returns only pending payments (raw _id shape), with legacy pagination counting all statuses", async () => {
      const pending1 = await createTestScheduledPayment({
        debtorId: debtor._id.toString(),
        creditorId: creditor._id.toString(),
        amountSrc: 50,
      });
      const missingCreditorId = new mongoose.Types.ObjectId().toString();
      const pending2 = await createTestScheduledPayment({
        debtorId: debtor._id.toString(),
        creditorId: missingCreditorId,
        amountSrc: 75,
      });
      await createTestScheduledPayment({
        debtorId: debtor._id.toString(),
        creditorId: creditor._id.toString(),
        amountSrc: 20,
        status: "completed",
      });

      const res = await request(makeApp())
        .get(`/getScheduledPayments/${debtor._id.toString()}`)
        .query({ page: 1, limit: 10 });

      expect(res.status).toBe(200);
      expect(res.body.currentPage).toBe(1);
      // Legacy quirk: totalPayments counts ALL statuses, not just pending.
      expect(res.body.totalPayments).toBe(3);
      expect(res.body.totalPages).toBe(1);
      expect(res.body.scheduledPayment).toHaveLength(2);

      const ids = res.body.scheduledPayment.map(
        (p: { _id: string }) => p._id
      );
      expect(ids).toEqual(
        expect.arrayContaining([
          pending1._id.toString(),
          pending2._id.toString(),
        ])
      );

      // Locks the raw shape: `_id` present, resolved emails, and the
      // "Locked or deleted user" fallback for a missing creditor.
      const item2 = res.body.scheduledPayment.find(
        (p: { _id: string }) => p._id === pending2._id.toString()
      );
      expect(item2).toMatchObject({
        _id: pending2._id.toString(),
        debtorId: debtor._id.toString(),
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
      const missingId = new mongoose.Types.ObjectId().toString();

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
