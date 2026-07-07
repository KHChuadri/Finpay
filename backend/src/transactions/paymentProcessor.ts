import mongoose from "mongoose";
import User from "../../model/User";
import TransactionHistory from "../../model/TransactionHistory";
import WalletInfo from "../../model/WalletInfo";
import ScheduledPayment from "../../model/ScheduledPayment";
import { createWallet } from "../helper/createWallet";
import { challengeService } from "../modules/challenge/challenge.container";

const { checkBalanceChallenges } = challengeService;

interface PaymentTransactionData {
  debtorId: string;
  creditorId: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
  paymentId: string;
}

/**
 * <Handles Scheduled Payment Proccessing>
 * 
 * @param PaymentTransactionData 
 * @returns {status: string, transactionId: string / Error: Error} object containing process status and transaction history id or error message
 */
export const processPaymentTransaction = async (data: PaymentTransactionData) => {
  const session = await mongoose.startSession();

  try {
    let transactionId: string | null = null;

    const result = await session.withTransaction(async () => {
      const [debtor, creditor] = await Promise.all([
        User.findById(data.debtorId).session(session),
        User.findById(data.creditorId).session(session),
      ]);

      if (!debtor || !creditor) {
        throw new Error('Debtor or creditor user not found');
      }

      const [creditorWallet] = await Promise.all([
        WalletInfo.findOne({ userId: data.debtorId, walletCurrency: data.currencySrc }).session(session),
        WalletInfo.findOne({ userId: data.creditorId, walletCurrency: data.currencyDest }).session(session),
      ]);

      if (!creditorWallet) {
        await createWallet(data.creditorId, data.currencyDest, data.amountDest);
      }

      const [txn] = await TransactionHistory.create([{
        amountSrc: data.amountSrc,
        currencySource: data.currencySrc,
        amountDest: data.amountDest,
        currencyDest: data.currencyDest,
        fromAccount: debtor._id,
        toAccount: creditor._id,
        fromAccountEmail: debtor.email,
        toAccountEmail: creditor.email,
        fromAccountId: debtor._id,
        toAccountId: creditor._id,
        description: "Scheduled payment",
      }], { session });

      transactionId = txn._id.toString();

      await WalletInfo.findOneAndUpdate(
        { userId: data.creditorId, walletCurrency: data.currencyDest },
        { $inc: { walletBalance: data.amountDest } },
        { session }
      );

      await checkBalanceChallenges(data.creditorId);
      await checkBalanceChallenges(data.debtorId);

      await ScheduledPayment.findByIdAndUpdate(
        data.paymentId,
        {
          status: "completed",
          processedAt: new Date(),
          transactionId,
        },
        { session }
      );
      return {
        success: true,
        transactionId,
      };
    });
    return {
      success: result.success !== undefined,
      transactionId: result.transactionId ?? undefined,
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Payment processing failed',
    };
  } finally {
    await session.endSession();
  }
};
