import User from "../../model/User";
import HTTPError from "http-errors";
import TransactionHistory from "../../model/TransactionHistory";

/**
 * <Get User's Transaction History>
 * 
 * @param {string} userId 
 * @returns Array of Transaction History Owned By User
 */
export const getUserTransactionHistory = async (userId: string) => {
  const findUser = await User.findById(userId);

  // error checking for non-existent user
  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  const History = await TransactionHistory.find({
    _id: { $in: findUser.transactionHistory },
  });

  return History;
};
