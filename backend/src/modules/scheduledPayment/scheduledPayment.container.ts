// Composition root for the scheduled-payment slice: wires the real
// repository and the real BullMQ queue (injected so the service never
// imports bullmq/express directly).
import { createScheduledPaymentService } from "./scheduledPayment.service";
import { scheduledPaymentRepository } from "./scheduledPayment.repository";
import { scheduledPaymentQueue } from "../../../queues/scheduledPaymentQueue";

export const scheduledPaymentService = createScheduledPaymentService({
  repo: scheduledPaymentRepository,
  queue: scheduledPaymentQueue,
});
