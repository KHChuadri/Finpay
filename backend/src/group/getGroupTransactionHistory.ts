import HTTPError from "http-errors";
import TransactionHistory from "../../model/TransactionHistory";
import Groups from "../../model/Groups";

/**
 * <Get Group Transaction History from its group Id>
 * 
 * @param {string} groupId 
 * @returns List of History Object owned by the group
 */
export const getGroupTransactionHistory = async (groupId: string) => {
  const findGroup = await Groups.findById(groupId);

  // error checking for non-existent user
  if (!findGroup) {
    throw HTTPError(400, "User not found or does not exist");
  }

  const History = await TransactionHistory.find({
    _id: { $in: findGroup.transactionHistory },
  });

  return History;
};
