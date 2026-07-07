// Legacy entry point retained during the strangler migration.
// Delegates to the layered scheduled-payment service so existing callers/tests are unaffected.
import { scheduledPaymentService } from "../modules/scheduledPayment/scheduledPayment.container";

export const cancelScheduledPayment = async (
  paymentId: string,
  userId: string
) => scheduledPaymentService.cancelScheduledPayment(paymentId, userId);
