import { Worker, Job } from 'bullmq';
import connection from '../config/redis';
import ScheduledPayment from '../model/ScheduledPayment';
import User from '../model/User';
import { PaymentJobData, PaymentResult } from '../types/payment.types';
import { processPaymentTransaction } from '../src/transactions/paymentProcessor';

const processScheduledPayment = async (job: Job<PaymentJobData>): Promise<PaymentResult> => {
  const { paymentId, debtorId, creditorId, amountSrc, amountDest, currencySrc, currencyDest } = job.data;
    
  try {
    // Update payment status to processing
    await ScheduledPayment.findByIdAndUpdate(paymentId, {
      status: 'processing',
    });

    // Fetch users
    const [debtor, creditor] = await Promise.all([
      User.findById(debtorId),
      User.findById(creditorId),
    ]);

    if (!debtor || !creditor) {
      throw new Error('User not found');
    }

    const paymentResult = await processPaymentTransaction({
      debtorId,
      creditorId,
      amountSrc,
      amountDest,
      currencySrc,
      currencyDest,
      paymentId
    });

    if (paymentResult.success) {
      // Update payment status to completed
      await ScheduledPayment.findByIdAndUpdate(paymentId, {
        status: 'completed',
        processedAt: new Date(),
        transactionId: paymentResult.transactionId,
      });

      return {
        success: true,
        transactionId: paymentResult.transactionId,
        processedAt: new Date(),
      };
    } else {
      throw new Error(paymentResult.error || 'Payment processing failed');
    }
  } catch (error) {
    console.error(`Payment ${paymentId} failed:`, error);
    
    // Update payment status to failed
    await ScheduledPayment.findByIdAndUpdate(paymentId, {
      status: 'failed',
      failureReason: error instanceof Error ? error.message : 'Unknown error',
      lastAttempt: new Date(),
    });
    
    throw error; // This will trigger retry based on job options
  }
};

export const scheduledPaymentWorker = new Worker<PaymentJobData>(
  'scheduled-payments',
  processScheduledPayment,
  {
    connection,
    concurrency: 1, // Process up to 5 payments simultaneously
  }
);

scheduledPaymentWorker.on('completed', (job) => {
  console.log(`Payment ${job.data.paymentId} completed successfully`);
});

scheduledPaymentWorker.on('failed', (job, err) => {
  console.error(`Payment ${job?.data.paymentId} failed after ${job?.attemptsMade} attempts:`, err);
});
