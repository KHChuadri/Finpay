import { Worker, Job } from 'bullmq';
import connection from '../config/redis';
import { getDb } from '../lib/db';
import { users, scheduledPayments } from '../src/db/schema';
import { eq } from 'drizzle-orm';
import { PaymentJobData, PaymentResult } from '../types/payment.types';
import { processPaymentTransaction } from '../src/transactions/paymentProcessor';

const processScheduledPayment = async (job: Job<PaymentJobData>): Promise<PaymentResult> => {
  const { paymentId, debtorId, creditorId, amountSrc, amountDest, currencySrc, currencyDest } = job.data;
    
  try {
    // Update payment status to processing
    await getDb()
      .update(scheduledPayments)
      .set({ status: 'processing' })
      .where(eq(scheduledPayments.id, paymentId));

    // Fetch users
    const [debtor] = await getDb().select().from(users).where(eq(users.id, debtorId));
    const [creditor] = await getDb().select().from(users).where(eq(users.id, creditorId));

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
      await getDb()
        .update(scheduledPayments)
        .set({
          status: 'completed',
          processedAt: new Date(),
          transactionId: paymentResult.transactionId,
        })
        .where(eq(scheduledPayments.id, paymentId));

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
    await getDb()
      .update(scheduledPayments)
      .set({
        status: 'failed',
        failureReason: error instanceof Error ? error.message : 'Unknown error',
        lastAttempt: new Date(),
      })
      .where(eq(scheduledPayments.id, paymentId));
    
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
