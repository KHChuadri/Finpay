import TransactionHistory from "../../model/TransactionHistory";
import HTTPError from "http-errors";
import User from "../../model/User";
import WalletInfo from "../../model/WalletInfo";
import TransactionItem from "../../model/TransactionItem";

interface DepositInfoType {
  items: {
    id: string;
    name: string;
    description: string;
    custom_descriptor: string | null;
    payout_descriptor: string | null;
    created_at: string;
    updated_at: string;
    state: string;
    net_amount: number;
    chargedback_amount: number;
    refunded_amount: number;
    released_amount: number;
    seller_url: string;
    buyer_url: string;
    remaining_amount: number;
    status: number;
    amount: number;
    payment_type_id: number;
    due_date: string | null;
    requested_release_amount: number;
    pending_release_amount: number;
    dynamic_descriptor: string | null;
    invoice_url: string | null;
    deposit_reference: string;
    buyer_fees: number;
    seller_fees: number;
    credit_card_fee: number;
    direct_debit_fee: number;
    paypal_fee: number;
    promisepay_fee: number;
    batch_state: string | null;
    total_outstanding: number;
    total_amount: number;
    currency: string;
    payment_method: string;
    buyer_name: string;
    buyer_email: string;
    buyer_country: string;
    seller_name: string;
    seller_email: string;
    seller_country: string;
    payment_credit_card_enabled: boolean;
    payment_direct_debit_enabled: boolean;
    related: {
      buyers: string;
      sellers: string;
    };
    links: {
      self: string;
      buyers: string;
      sellers: string;
      status: string;
      fees: string;
      transactions: string;
      batch_transactions: string;
      wire_details: string;
      bpay_details: string;
    };
  };
}

/**
 * <Handles Finalisation of Withdraw and Deposit Requests>
 * 
 * @param {Object Of Zai Item Response} depositData (Object response caught by webhook)
 * @returns {depositId: string} object containing transaction history id
 */
export const setDepositData = async (depositData: DepositInfoType) => {
  if (!depositData) {
    throw HTTPError(404, "Transaction Data not found");
  } else if (depositData.items.state.toString() !== "completed") {
    throw HTTPError(404, "Transaction Failed");
  }

  const deleted = await TransactionItem.findOneAndDelete({
    transactionId: depositData.items.id.toString(),
  });

  if (
    deleted === null &&
    depositData.items.name.toString() == "Deposit-Request"
  ) {
    throw HTTPError(400, "Deposit Has Been Processed");
  }

  const remittance = depositData.items.description.toString();
  if (!remittance) {
    throw HTTPError(400, "Missing remittance_information");
  }
  const user = await User.findOne({ depositId: remittance });
  if (!user) {
    throw HTTPError(400, "Invalid depositId, please contact support");
  }

  let transaction;
  if (depositData.items.name.toString() === "Deposit-Request") {
    const depositwallet = await WalletInfo.findOne({
      userId: user._id,
      walletCurrency: depositData.items.currency.toString(),
    });
    if (!depositwallet) {
      throw HTTPError(400, "Invalid DepoWallet, please contact support");
    }
    depositwallet.walletBalance += depositData.items.amount / 100;
    transaction = await TransactionHistory.create({
      transactionType: "Deposit",
      amountSrc: depositData.items.amount / 100,
      currencySource: depositData.items.currency.toString(),
      amountDest: depositData.items.amount / 100,
      currencyDest: depositData.items.currency.toString(),
      fromAccount: user._id,
      toAccount: user._id,
      fromAccountEmail: "finpay.admin@gmail.com",
      toAccountEmail: user.email,
      fromAccountId: "Finpay",
      toAccountId: user._id.toString(),
      description: "Deposit",
    });

    await depositwallet.save();
  } else {
    transaction = await TransactionHistory.create({
      amountSrc: depositData.items.amount / 100,
      currencySource: depositData.items.currency,
      amountDest: depositData.items.amount / 100,
      currencyDest: depositData.items.currency,
      fromAccount: user._id,
      toAccount: user._id,
      fromAccountEmail: user.email,
      toAccountEmail: "finpay.admin@gmail.com",
      fromAccountId: user._id.toString(),
      toAccountId: "Finpay",
      description: "Withdraw",
    });
  }

  user.transactionHistory.push(transaction._id);
  await user.save();
  return {
    depositId: transaction._id.toString(),
  };
};
