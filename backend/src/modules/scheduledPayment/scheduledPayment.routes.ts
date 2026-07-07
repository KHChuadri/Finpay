import { Router } from "express";
import { asyncHandler } from "../../shared/http/asyncHandler";
import {
  cancelScheduledPaymentController,
  getScheduledPaymentsController,
  initiateScheduledPaymentController,
} from "./scheduledPayment.controller";

export const scheduledPaymentRouter = Router();

scheduledPaymentRouter.post(
  "/schedule/payment",
  asyncHandler(initiateScheduledPaymentController)
);
scheduledPaymentRouter.delete(
  "/schedule/payment/:paymentId",
  asyncHandler(cancelScheduledPaymentController)
);
scheduledPaymentRouter.get(
  "/getScheduledPayments/:userId",
  asyncHandler(getScheduledPaymentsController)
);
