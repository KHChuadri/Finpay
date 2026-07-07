// Legacy entry point retained during the strangler migration.
// Delegates to the layered scheduled-payment service so existing callers/tests are unaffected.
import { scheduledPaymentService } from "../modules/scheduledPayment/scheduledPayment.container";

export const getScheduledPayment = async (
  userId: string,
  page: number,
  limit: number
) => scheduledPaymentService.getScheduledPayments(userId, page, limit);
