import { bankService } from "../modules/bank/bank.container";

/**
 * <proccess a transaction item in Zai>
 *
 * @param {string} transaction_token
 * @param {string} transactionId
 * @returns Transaction Object
 */
export const doWithdraw = async (
  transaction_token: string,
  transactionId: string
) => {
  return bankService.doWithdraw(transaction_token, transactionId);
};
