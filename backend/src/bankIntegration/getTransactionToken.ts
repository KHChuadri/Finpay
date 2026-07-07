import { fetchTransactionToken } from "../modules/bank/bank.container";

/**
 * <send request to zai Api to get new transaction token (only valid for 60 mniutes)>
 *
 * @returns Zai Access Token {string}
 */
export const getTransactionToken = async () => {
  return fetchTransactionToken();
};
