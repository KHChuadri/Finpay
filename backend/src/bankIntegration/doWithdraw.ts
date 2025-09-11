import axios from "axios";
import TransactionItem from "../../model/TransactionItem";
import HttpError from "http-errors";


/**
 * <proccess a transaction item in Zai>
 * 
 * @param {string} transaction_token 
 * @param {string} transactionId 
 * @returns Transaction Object
 */
export const doWithdraw = async (
    transaction_token: string,
    transactionId: string,
) => {
  try {
    const transaction = TransactionItem.findOneAndDelete({transactionId: transactionId});
    if (!transaction) {
      throw HttpError(404, "Request not found");
    }
    
    // send request to zai Api to do the item transaction
    const response = await axios.patch(
      `https://test.api.promisepay.com/items/${transactionId}/make_payment`,
      {
        account_id: "b877e330-4846-013e-03af-0a58a9feac03"
      },
      {
        headers: {
          accept: 'application/json',
          authorization: `Bearer ${transaction_token}`,
          'content-type': 'application/json'
        },
        maxBodyLength: Infinity
      }
    );

    return response.data;
  } catch (error) {
    console.error('Error fetching Assembly token:', error);
    throw error;
  }
};
