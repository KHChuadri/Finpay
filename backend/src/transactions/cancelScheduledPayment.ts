import ScheduledPayment from '../../model/ScheduledPayment';
import HTTPError from 'http-errors';
import { scheduledPaymentQueue } from '../../queues/scheduledPaymentQueue';
import WalletInfo from '../../model/WalletInfo';

/**
 * <Cancel Existing  Scheduled Payment>
 * 
 * @param {string} paymentId 
 * @param {string} userId 
 * @returns { success: boolean, message: string } object containing process status and 'Payment cancelled successfully' message
 */
export const cancelScheduledPayment = async (paymentId: string, userId: string) => {
  const payment = await ScheduledPayment.findById(paymentId);
  if (!payment) {
    throw HTTPError(404, 'Payment not found');
  }

  if (payment.debtorId.toString() !== userId) {
    throw HTTPError(403, 'Unauthorized to cancel this payment');
  }

  if (payment.status !== 'pending') {
    throw HTTPError(400, 'Only pending payments can be cancelled');
  }

  if (payment.jobId) {
    const job = await scheduledPaymentQueue.getJob(payment.jobId);
    if (job) {
      await job.remove();
      await ScheduledPayment.findByIdAndDelete(paymentId);
    }
  }
  await WalletInfo.findOneAndUpdate(
    {
      userId: userId,
      walletCurrency: payment.currencySrc
    }, 
    {
      $inc: { walletBalance: payment.amountSrc }
    }
  );
  return {
    success: true,
    message: 'Payment cancelled successfully',
  };
};