import { bankService } from "../modules/bank/bank.container";

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
  return bankService.createItem(
    userId,
    requestType,
    amount,
    buyer_id,
    seller_id,
    transaction_token
  );
};
