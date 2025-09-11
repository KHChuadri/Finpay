import axios from "axios";
import TransactionItem from "../../model/TransactionItem";
import mongoose from "mongoose";
import { UUID } from "mongodb";
import User from "../../model/User";
import HttpError from "http-errors";
import WalletInfo from "../../model/WalletInfo";

/**
 * <create new transaction item in Zai>
 * 
 * @param {string} userId 
 * @param {string} requestType 
 * @param {number} amount 
 * @param {string} buyer_id 
 * @param {string} seller_id 
 * @param {string} transaction_token 
 * @returns { message: string } object with message : Item Creted
 */
export const createItem = async (
  userId: string,
  requestType: string,
  amount: number,
  buyer_id: string,
  seller_id: string,
  transaction_token: string
) => {
  const user = await User.findById(userId);
  if (!user) {
    throw HttpError(404, "User user not found");
  }

  const wallet = await WalletInfo.findOne({
    userId: userId,
    walletCurrency: "AUD",
  });

  if (!wallet) {
    throw HttpError(404, "user main wallet not found");
  } else if (
    requestType === "Withdraw-Request" &&
    wallet.walletBalance < amount
  ) {
    throw HttpError(400, "User Main Balance Is Insufficient");
  }

  // create a unique item id
  let transactionId = new UUID();
  while (
    (await TransactionItem.findOne({ transactionId: transactionId })) != null
  ) {
    transactionId = new UUID();
  }

  // send request to zai Api to create new item
  try {
    await axios.post(
      "https://test.api.promisepay.com/items",
      {
        id: transactionId,
        name: requestType,
        amount: amount * 100,
        payment_type: "2",
        buyer_id: buyer_id,
        seller_id: seller_id,
        description: user.depositId,
      },
      {
        headers: {
          accept: "application/json",
          authorization: `Bearer ${transaction_token}`,
          "content-type": "application/json",
        },
        maxBodyLength: Infinity,
      }
    );

    if (requestType === "Withdraw-Request") {
      const newItem = new TransactionItem({
        transactionType: "Withdraw",
        userId: new mongoose.Types.ObjectId(userId),
        transactionId: transactionId,
        amount: amount,
        depositId: user.depositId,
        date: new Date(),
        currency: "AUD",
        name: `${user.firstName} ${user.lastName}`
      });

      await newItem.save();
      wallet.walletBalance = wallet.walletBalance - amount;
      await wallet.save();
    } else if (requestType === "Deposit-Request") {
      const newItem = new TransactionItem({
        transactionType: "Deposit",
        userId: new mongoose.Types.ObjectId(userId),
        transactionId: transactionId,
        amount: amount,
        depositId: user.depositId,
        date: new Date(),
        currency: "AUD",
        name: `${user.firstName} ${user.lastName}`
      });

      await newItem.save();
    }

    return {
      message: "Item Created",
    };
  } catch (error) {
    console.error("Error fetching Assembly token:", error);
    throw error;
  }
};
