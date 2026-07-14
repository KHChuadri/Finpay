import { Request, Response } from "express";
import { scheduledPaymentService } from "./scheduledPayment.container";

export const initiateScheduledPaymentController = async (
  req: Request,
  res: Response
) => {
  const {
    debtorUserId,
    creditorUserEmail,
    scheduledDate,
    amountSrc,
    amountDest,
    currencySrc,
    currencyDest,
  } = req.body;

  const response = await scheduledPaymentService.initiateScheduledPayment({
    debtorUserId,
    creditorUserEmail,
    scheduledDate,
    amountSrc,
    amountDest,
    currencySrc,
    currencyDest,
  });

  res.status(200).json(response);
};

export const cancelScheduledPaymentController = async (
  req: Request,
  res: Response
) => {
  const { paymentId } = req.params;
  const userId = req.query.userId as string;

  const response = await scheduledPaymentService.cancelScheduledPayment(
    paymentId,
    userId
  );
  res.status(200).json(response);
};

export const getScheduledPaymentsController = async (
  req: Request,
  res: Response
) => {
  const { userId } = req.params;
  const page = parseInt(req.query.page as string);
  const limit = parseInt(req.query.limit as string);

  const response = await scheduledPaymentService.getScheduledPayments(
    userId,
    page,
    limit
  );
  res.status(200).json(response);
};
