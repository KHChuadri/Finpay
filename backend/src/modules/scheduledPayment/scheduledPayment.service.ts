import HTTPError from "http-errors";
import type { PaymentJobData } from "../../../types/payment.types";
import type {
  InitiateScheduledPaymentInput,
  ScheduledPaymentServiceDeps,
} from "./scheduledPayment.types";

export const createScheduledPaymentService = (
  deps: ScheduledPaymentServiceDeps
) => {
  const { repo, queue } = deps;

  /** Mirrors legacy initiateScheduledPayment. */
  const initiateScheduledPayment = async (
    input: InitiateScheduledPaymentInput
  ) => {
    const {
      debtorUserId,
      creditorUserEmail,
      scheduledDate,
      amountSrc,
      amountDest,
      currencySrc,
      currencyDest,
    } = input;

    const requiredFields = {
      debtorUserId,
      creditorUserEmail,
      scheduledDate,
      amountSrc,
      amountDest,
      currencySrc,
      currencyDest,
    };

    // check for any missing data
    const missingFields = Object.entries(requiredFields)
      .filter(
        ([, value]) => value === undefined || value === null || value === ""
      )
      .map(([key]) => key);

    if (missingFields.length > 0) {
      throw HTTPError(
        400,
        `initiateScheduledPayment: required field(s) [${missingFields.join(", ")}] are missing`
      );
    }

    // check to see if scheduledDate is valid
    const scheduledDateTime = new Date(scheduledDate);

    if (new Date(scheduledDate) < new Date()) {
      throw HTTPError(
        400,
        `initiateScheduledPayment: date and time must be later than today`
      );
    }

    const debtorUser = await repo.findUserById(debtorUserId);
    if (!debtorUser) {
      throw HTTPError(
        404,
        `schedulePayment: Debtor user with ID ${debtorUserId} not found`
      );
    }

    const creditorUser = await repo.findUserByEmail(creditorUserEmail);
    if (!creditorUser) {
      throw HTTPError(
        404,
        `schedulePayment: Creditor user with email ${creditorUserEmail} not found`
      );
    }

    const payment = await repo.createPayment({
      debtorId: debtorUserId,
      creditorId: creditorUser.id,
      amountSrc,
      amountDest,
      currencySrc,
      currencyDest,
      scheduledDate,
    });

    // calculate time till execution
    const delay = scheduledDateTime.getTime() - Date.now();

    const jobData: PaymentJobData = {
      paymentId: payment.id,
      debtorId: debtorUserId,
      creditorId: creditorUser.id,
      amountSrc,
      amountDest,
      currencySrc,
      currencyDest,
    };

    // send job to redis server
    const job = await queue.add("scheduled-payments", jobData, {
      delay,
      jobId: payment.id,
    });

    await repo.updateJobId(payment.id, job.id ?? payment.id);

    const debtorWallet = await repo.findWalletByUserAndCurrency(
      debtorUserId,
      currencySrc
    );

    if (!debtorWallet) {
      throw HTTPError(404, "initiateScheduledPayment: debtor wallet not found");
    }

    if (debtorWallet.walletBalance < amountSrc) {
      throw HTTPError(400, "initiateScheduledPayment: insufficient balance");
    }

    await repo.debitWalletById(debtorWallet.id, amountSrc);

    return {
      success: true as const,
      message: "Payment scheduled successfully",
      paymentId: payment.id,
      date: scheduledDate,
    };
  };

  /** Mirrors legacy cancelScheduledPayment. */
  const cancelScheduledPayment = async (paymentId: string, userId: string) => {
    const payment = await repo.findPaymentById(paymentId);
    if (!payment) {
      throw HTTPError(404, "Payment not found");
    }

    if (payment.debtorId !== userId) {
      throw HTTPError(403, "Unauthorized to cancel this payment");
    }

    if (payment.status !== "pending") {
      throw HTTPError(400, "Only pending payments can be cancelled");
    }

    if (payment.jobId) {
      const job = await queue.getJob(payment.jobId);
      if (job) {
        await job.remove();
        await repo.deletePaymentById(paymentId);
      }
    }

    await repo.creditWallet(userId, payment.currencySrc, payment.amountSrc);

    return {
      success: true as const,
      message: "Payment cancelled successfully",
    };
  };

  /** Mirrors legacy getScheduledPayment. */
  const getScheduledPayments = async (
    userId: string,
    page: number,
    limit: number
  ) => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "getScheduledPayment: User not found");
    }

    const skip = (page - 1) * limit;

    const totalDocuments = await repo.countPaymentsByDebtor(userId);

    const payments = await repo.findPendingPaymentsByDebtor(
      userId,
      skip,
      limit
    );

    const scheduledPaymentList = await Promise.all(
      payments.map(async (payment) => {
        const debtor = await repo.findUserById(payment.debtorId);
        const creditor = await repo.findUserById(payment.creditorId);

        return {
          _id: payment.id,
          debtorId: payment.debtorId,
          debtorEmail: debtor ? debtor.email : "Locked or deleted user",
          creditorId: payment.creditorId,
          creditorEmail: creditor ? creditor.email : "Locked or deleted user",
          amountSrc: payment.amountSrc,
          amountDest: payment.amountDest,
          currencySrc: payment.currencySrc,
          currencyDest: payment.currencyDest,
          scheduledDate: payment.scheduledDate,
        };
      })
    );

    const totalPages = Math.ceil(totalDocuments / limit);

    return {
      scheduledPayment: scheduledPaymentList,
      currentPage: page,
      totalPayments: totalDocuments,
      totalPages,
    };
  };

  return {
    initiateScheduledPayment,
    cancelScheduledPayment,
    getScheduledPayments,
  };
};
