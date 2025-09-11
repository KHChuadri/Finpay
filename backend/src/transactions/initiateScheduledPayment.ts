import ScheduledPayment from '../../model/ScheduledPayment';
import User from '../../model/User';
import HTTPError from 'http-errors';
import { PaymentJobData } from '../../types/payment.types';
import { scheduledPaymentQueue } from '../../queues/scheduledPaymentQueue';
import WalletInfo from '../../model/WalletInfo';

/**
 * <Creates a New Scheduled Payment>
 * 
 * @param {string} debtorUserId
 * @param {string} creditorUserEmail 
 * @param {string} scheduledDate 
 * @param {number} amountSrc 
 * @param {number} amountDest 
 * @param {string} currencySource 
 * @param {string} currencyDest 
 * @returns   return {
 *   success: boolean,
 *   message: {string} "Payment scheduled successfully",
 *   paymentId: string,
 *   date: string
 * } object containing new scheduledpayment information, id, date of creation, and process status
 */
export const initiateScheduledPayment = async (
  debtorUserId: string,
  creditorUserEmail: string,
  scheduledDate: string,
  amountSrc: number,
  amountDest: number,
  currencySrc: string,
  currencyDest: string
) => {
  const requiredFields = {
    debtorUserId, 
    creditorUserEmail,
    scheduledDate,
    amountSrc,
    amountDest,
    currencySrc,
    currencyDest
  };

  // check for any missing data
  const missingFields = Object.entries(requiredFields)
    .filter(([value]) => value === undefined || value === null || value === "")
    .map(([key]) => key);

  if (missingFields.length > 0) {
    throw HTTPError(400, `initiateScheduledPayment: required field(s) [${missingFields.join( ", ")}] are missing`);
  }
  
  // check to see if scheduledData is valid
  const scheduledDateTime = new Date(scheduledDate);

  if (new Date(scheduledDate) < new Date()) {
    throw HTTPError(400, `initiateScheduledPayment: date and time must be later than today`);
  }

  const debtorUser = await User.findById(debtorUserId);

  if (!debtorUser) {
    throw HTTPError(404, `schedulePayment: Debtor user with ID ${debtorUserId} not found`);
  }

  const creditorUser = await User.findOne({ email: creditorUserEmail });

  if (!creditorUser) {
    throw HTTPError(404, `schedulePayment: Creditor user with email ${creditorUserEmail} not found`);
  }

  // create new Scheduled Payment Schema
  const payment = await ScheduledPayment.create({
    debtorId: debtorUserId,
    creditorId: creditorUser._id,
    amountSrc: amountSrc,
    amountDest: amountDest,
    currencySrc: currencySrc,
    currencyDest: currencyDest,
    scheduledDate: scheduledDate,
  });
  
  // calculate time till execution
  const delay = new Date(scheduledDateTime).getTime() - Date.now();

  const jobData: PaymentJobData = {
    paymentId: payment._id.toString(),
    debtorId: debtorUserId,
    creditorId: creditorUser._id.toString(),
    amountSrc,
    amountDest,
    currencySrc,
    currencyDest,
  };

  // send job to redis server
  const job = await scheduledPaymentQueue.add(
    'scheduled-payments',
    jobData,
    {
      delay,
      jobId: payment._id.toString(),
    }
  );

  await ScheduledPayment.findByIdAndUpdate(
    payment._id, 
    { jobId: job.id },
    { new: true }
  );

  const debtorWallet = await WalletInfo.findOne({
    userId: debtorUserId,
    walletCurrency: currencySrc
  });

  if (!debtorWallet) {
    throw HTTPError(404, "initiateScheduledPayment: debtor wallet not found");
  }

  if (debtorWallet?.walletBalance < amountSrc) {
    throw HTTPError(400, "initiateScheduledPayment: insufficient balance");
  }

  debtorWallet.walletBalance -= amountSrc;
  await debtorWallet.save();

  return {
    success: true,
    message: "Payment scheduled successfully",
    paymentId: payment._id,
    date: scheduledDate
  }
};
