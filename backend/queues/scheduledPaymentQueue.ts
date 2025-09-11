import { Queue, QueueOptions } from 'bullmq';
import connection from '../config/redis';
import { PaymentJobData } from '../types/payment.types';

const queueOptions: QueueOptions = {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: {
      age: 24 * 3600, // Keep completed jobs for 24 hours
      count: 100,     // Keep last 100 completed jobs
    },
    removeOnFail: {
      age: 7 * 24 * 3600, // Keep failed jobs for 7 days
    },
  },
};

export const scheduledPaymentQueue = new Queue<PaymentJobData>('scheduled-payments', queueOptions);