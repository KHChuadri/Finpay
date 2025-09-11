import TransactionItem, { TransactionItemType } from "../../model/TransactionItem";

/**
 * <Find active withdraw request>
 * 
 * @param {number} page 
 * @param {number} limit 
 * @returns {requests: List of TransactionItem object, currentPage: number, totalRequest: number,
 *  totalPages: number} Object containing transaction request that will fit in a certain page
 */
export const adminGetRequest = async (page: number, limit: number) => {
  const skip = (page - 1) * limit;

  const requestDocs = await TransactionItem.find({transactionType: "Withdraw"})
    .limit(limit)
    .skip(skip);

  let totalRequest = requestDocs.length;

  const requests = requestDocs.map((request: TransactionItemType) => ({
    itemid: request._id.toString(),
    name: request.name,
    transactionId: request.transactionId,
    currency: request.currency,
    amount: request.amount,
    userId: request.userId.toString(),
  }));

  if (totalRequest === 0) {
    totalRequest = 1;
  }
  return {
    requests: requests,
    currentPage: page,
    totalRequest: totalRequest,
    totalPages: Math.ceil(totalRequest / limit),
  };
};
