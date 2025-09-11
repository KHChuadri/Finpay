import HTTPError from "http-errors";
import TransactionHistory from "../model/TransactionHistory";
import User from "../model/User";
import { UserType } from "../model/User";

interface SavedRecipientProp {
  email: string,
  firstName: string,
  lastName: string
}

/**
 * <Find list of past transaction recepient>
 * 
 * @param {string} userId 
 * @returns {recepient: SavedRecipientProp[]} object containing list of SavedRecipientProp.
 */
export const getSavedRecipient = async (userId: string) => {
  const user = User.findById(userId);

  if (!user) {
    throw HTTPError(404, "User id does not exist");
  }

  const transactionSent = await TransactionHistory.find({ fromAccount: userId }).populate<{toAccount: UserType, firstName: string, lastName: string}>('toAccount');
  
  const savedRecipient = transactionSent.map(transaction => {
    return ({
      email: transaction.toAccountEmail,
      firstName: transaction.toAccount.firstName,
      lastName: transaction.toAccount.lastName
    })
  });

  // Only return unique element to the frontend
  const savedRecipientSet = new Set(savedRecipient.map(recipient => recipient.email));

  const uniqueRecipientList: SavedRecipientProp[] = [];
  savedRecipientSet.forEach((r) => {
    const recipient = savedRecipient.find(recipient => recipient.email === r);
    if (recipient) {
      uniqueRecipientList.push(recipient);
    }
  });

  return {
    recipients: uniqueRecipientList
  }
}