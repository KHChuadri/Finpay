import HTTPError from "http-errors";
import type { BankServiceDeps } from "./bank.types";

export const createBankService = (deps: BankServiceDeps) => {
  const { repo, fetchTransactionToken, fetchCreateItem, fetchDoWithdraw } = deps;

  /** Mirrors legacy createItem. */
  const createItem = async (
    userId: string,
    requestType: string,
    amount: number,
    buyerId: string,
    sellerId: string,
    transactionToken: string
  ) => {
    const user = await repo.findUserById(userId);
    if (!user) {
      throw HTTPError(404, "User user not found");
    }

    const wallet = await repo.findMainWallet(userId);
    if (!wallet) {
      throw HTTPError(404, "user main wallet not found");
    } else if (
      requestType === "Withdraw-Request" &&
      wallet.walletBalance < amount
    ) {
      throw HTTPError(400, "User Main Balance Is Insufficient");
    }

    const transactionId = await repo.generateUniqueTransactionId();

    try {
      await fetchCreateItem(
        {
          id: transactionId,
          name: requestType,
          amount: amount * 100,
          payment_type: "2",
          buyer_id: buyerId,
          seller_id: sellerId,
          description: user.depositId,
        },
        transactionToken
      );

      if (requestType === "Withdraw-Request") {
        await repo.createTransactionItem({
          transactionType: "Withdraw",
          userId,
          transactionId,
          amount,
          depositId: user.depositId,
          name: `${user.firstName} ${user.lastName}`,
        });
        await repo.debitMainWallet(userId, amount);
      } else if (requestType === "Deposit-Request") {
        await repo.createTransactionItem({
          transactionType: "Deposit",
          userId,
          transactionId,
          amount,
          depositId: user.depositId,
          name: `${user.firstName} ${user.lastName}`,
        });
      }

      return { message: "Item Created" };
    } catch (error) {
      console.error("Error fetching Assembly token:", error);
      throw error;
    }
  };

  /** Mirrors legacy GET /bankintegration/withdraw. */
  const withdrawRequest = async (userId: string, amount: number) => {
    const token = await fetchTransactionToken();
    return createItem(
      userId,
      "Withdraw-Request",
      amount,
      "buyer-1556502326027",
      "buyer-6543217890",
      token
    );
  };

  /** Mirrors legacy GET /bankintegration/deposit. */
  const depositRequest = async (userId: string, amount: number) => {
    const token = await fetchTransactionToken();
    return createItem(
      userId,
      "Deposit-Request",
      amount,
      "buyer-6543217890",
      "buyer-1556502326027",
      token
    );
  };

  /** Mirrors legacy doWithdraw. */
  const doWithdraw = async (transactionToken: string, transactionId: string) => {
    try {
      const transaction = repo.deleteTransactionItemByTransactionId(transactionId);
      if (!transaction) {
        throw HTTPError(404, "Request not found");
      }

      return await fetchDoWithdraw(transactionToken, transactionId);
    } catch (error) {
      console.error("Error fetching Assembly token:", error);
      throw error;
    }
  };

  /** Mirrors legacy GET /bankintegration/doTransaction/:transactionId. */
  const processWithdrawalRequest = async (transactionId: string) => {
    const token = await fetchTransactionToken();
    return doWithdraw(token, transactionId);
  };

  return {
    createItem,
    withdrawRequest,
    depositRequest,
    doWithdraw,
    processWithdrawalRequest,
  };
};
