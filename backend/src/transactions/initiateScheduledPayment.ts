// Legacy entry point retained during the strangler migration.
// Delegates to the layered scheduled-payment service so existing callers/tests are unaffected.
import { scheduledPaymentService } from "../modules/scheduledPayment/scheduledPayment.container";

export const initiateScheduledPayment = async (
  debtorUserId: string,
  creditorUserEmail: string,
  scheduledDate: string,
  amountSrc: number,
  amountDest: number,
  currencySrc: string,
  currencyDest: string
) =>
  scheduledPaymentService.initiateScheduledPayment({
    debtorUserId,
    creditorUserEmail,
    scheduledDate,
    amountSrc,
    amountDest,
    currencySrc,
    currencyDest,
  });
