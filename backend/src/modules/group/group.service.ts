import HTTPError from "http-errors";
import type {
  DepositResult,
  DepositWebhookPayload,
  GroupServiceDeps,
  TopupInput,
  TopupResult,
  WithdrawInput,
  WithdrawResult,
} from "./group.types";

export const createGroupService = (deps: GroupServiceDeps) => {
  const {
    repo,
    exchangeRate,
    checkBalanceChallenges,
    trackChallengeProgress,
    withTransaction,
  } = deps;

  /** Mirrors legacy `setDepositData` (the Zai webhook handler). */
  const setDepositData = async (
    depositData: DepositWebhookPayload
  ): Promise<DepositResult> => {
    if (!depositData) {
      throw HTTPError(404, "Transaction Data not found");
    }
    if (depositData.items.state.toString() !== "completed") {
      throw HTTPError(404, "Transaction Failed");
    }

    const deletedExisted = await repo.deleteTransactionItemByTransactionId(
      depositData.items.id.toString()
    );

    if (!deletedExisted && depositData.items.name.toString() === "Deposit-Request") {
      throw HTTPError(400, "Deposit Has Been Processed");
    }

    const remittance = depositData.items.description.toString();
    if (!remittance) {
      throw HTTPError(400, "Missing remittance_information");
    }

    const user = await repo.findUserByDepositId(remittance);
    if (!user) {
      throw HTTPError(400, "Invalid depositId, please contact support");
    }

    const { transactionId } = await withTransaction(async (session) => {
      let txId: string;
      if (depositData.items.name.toString() === "Deposit-Request") {
        const depositWallet = await repo.findWalletByUserAndCurrency(
          user.id,
          depositData.items.currency.toString(),
          session
        );
        if (!depositWallet) {
          throw HTTPError(400, "Invalid DepoWallet, please contact support");
        }

        txId = await repo.recordTransaction(
          {
            transactionType: "Deposit",
            amountSrc: depositData.items.amount / 100,
            currencySource: depositData.items.currency.toString(),
            amountDest: depositData.items.amount / 100,
            currencyDest: depositData.items.currency.toString(),
            fromAccount: user.id,
            toAccount: user.id,
            fromAccountEmail: "finpay.admin@gmail.com",
            toAccountEmail: user.email,
            fromAccountId: "Finpay",
            toAccountId: user.id,
            description: "Deposit",
          },
          session
        );

        await repo.adjustWalletBalance(
          depositWallet.id,
          depositData.items.amount / 100,
          session
        );
      } else {
        txId = await repo.recordTransaction(
          {
            amountSrc: depositData.items.amount / 100,
            currencySource: depositData.items.currency,
            amountDest: depositData.items.amount / 100,
            currencyDest: depositData.items.currency,
            fromAccount: user.id,
            toAccount: user.id,
            fromAccountEmail: user.email,
            toAccountEmail: "finpay.admin@gmail.com",
            fromAccountId: user.id,
            toAccountId: "Finpay",
            description: "Withdraw",
          },
          session
        );
      }

      await repo.appendUserTransactionHistory(user.id, txId, session);

      return { transactionId: txId };
    });

    return { depositId: transactionId };
  };

  /** Mirrors legacy `topup` (user wallet -> shared group wallet). */
  const topup = async (input: TopupInput): Promise<TopupResult> => {
    const {
      debtorWalletId,
      groupId,
      amountSrc,
      amountDest,
      currencySource,
      currencyDest,
    } = input;

    const debtorWallet = await repo.findWalletById(debtorWalletId);
    const group = await repo.findGroupById(groupId);

    if (!debtorWallet) {
      throw HTTPError(404, "topup: Debtor wallet not found");
    }
    if (!group) {
      throw HTTPError(404, "topup: Shared wallet not found");
    }

    const debtorUser = await repo.findUserById(debtorWallet.userId);
    if (!debtorUser) {
      throw HTTPError(404, "User not found");
    }

    if (debtorWallet.balance - Number(amountSrc) < 0) {
      throw HTTPError(400, "Insufficient balance");
    }

    const { newDebtorBalance, newGroupBalance } = await withTransaction(
      async (session) => {
        const transactionId = await repo.recordTransaction(
          {
            amountSrc,
            currencySource,
            amountDest,
            currencyDest,
            fromAccount: debtorUser.id,
            toAccount: group.id,
            fromAccountEmail: debtorUser.email,
            toAccountEmail: group.groupName,
            fromAccountId: debtorUser.id,
            toAccountId: group.id,
            description: "Shared Wallet Topup",
          },
          session
        );

        await repo.appendUserTransactionHistory(
          debtorUser.id,
          transactionId,
          session
        );
        await repo.appendGroupTransactionHistory(
          group.id,
          transactionId,
          session
        );

        const debtorBalance = await repo.adjustWalletBalance(
          debtorWallet.id,
          -Number(amountSrc),
          session
        );
        const groupBalance = await repo.adjustGroupBalance(
          group.id,
          Number(amountDest),
          session
        );

        return { newDebtorBalance: debtorBalance, newGroupBalance: groupBalance };
      }
    );

    await checkBalanceChallenges(debtorUser.id);

    // Convert everything to AUD
    const amountSrcToAudRate = await exchangeRate(currencySource, "AUD");
    const amountSrcInAud = amountSrc * amountSrcToAudRate.rate;

    await trackChallengeProgress("pay", debtorUser.id, amountSrcInAud);

    return {
      success: true,
      message: "Transfer successful",
      debtorWalletId: debtorWallet.id,
      creditorWalletId: group.id,
      amountTransferred: amountSrc.toString() + currencySource,
      newDebtorBalance,
      newCreditorBalance: newGroupBalance,
    };
  };

  /** Mirrors legacy `withdraw` (shared group wallet -> user wallet). */
  const withdraw = async (input: WithdrawInput): Promise<WithdrawResult> => {
    const {
      creditorInfo,
      groupId,
      amountSrc,
      amountDest,
      currencySource,
      currencyDest,
    } = input;

    const creditorUser = await repo.findUserByEmail(creditorInfo.email);
    const group = await repo.findGroupById(groupId);

    if (!creditorUser) {
      throw HTTPError(404, "topup: user not found");
    }
    if (!group) {
      throw HTTPError(404, "topup: Shared wallet not found");
    }

    // NOTE: matches legacy — the wallet may be auto-created here even if the
    // balance check below fails; this write is not part of the money-moving
    // transaction and is not rolled back on later failure.
    let creditorWallet = await repo.findWalletByIdsAndCurrency(
      creditorInfo.walletInfo,
      currencyDest
    );
    if (!creditorWallet) {
      creditorWallet = await repo.createWallet(creditorUser.id, currencyDest);
    }

    if (group.walletBalance - Number(amountSrc) < 0) {
      throw HTTPError(400, "Insufficient balance");
    }

    const { newCreditorBalance, newGroupBalance } = await withTransaction(
      async (session) => {
        const transactionId = await repo.recordTransaction(
          {
            amountSrc,
            currencySource,
            amountDest,
            currencyDest,
            fromAccount: group.id,
            toAccount: creditorUser.id,
            fromAccountEmail: group.groupName,
            toAccountEmail: creditorUser.email,
            fromAccountId: group.id,
            toAccountId: creditorUser.id,
            description: "Shared Wallet Payment",
          },
          session
        );

        await repo.appendUserTransactionHistory(
          creditorUser.id,
          transactionId,
          session
        );
        await repo.appendGroupTransactionHistory(
          group.id,
          transactionId,
          session
        );

        const creditorBalance = await repo.adjustWalletBalance(
          creditorWallet!.id,
          Number(amountDest),
          session
        );
        const groupBalance = await repo.adjustGroupBalance(
          group.id,
          -Number(amountSrc),
          session
        );

        return {
          newCreditorBalance: creditorBalance,
          newGroupBalance: groupBalance,
        };
      }
    );

    return {
      success: true,
      message: "Transfer successful",
      creditorWalletId: creditorWallet.id,
      debtorWalletId: group.id,
      amountTransferred: amountSrc.toString() + currencySource,
      newCreditorBalance,
      newDeptorBalance: newGroupBalance,
    };
  };

  /** Mirrors legacy `getGroupTransactionHistory`. Returns raw (non-flattened)
   *  TransactionHistory docs — the frontend reads `_id` directly. */
  const getGroupTransactionHistory = async (groupId: string) => {
    const group = await repo.findGroupById(groupId);
    if (!group) {
      throw HTTPError(400, "User not found or does not exist");
    }

    return repo.findTransactionHistoryByIds(group.transactionHistoryIds);
  };

  return { setDepositData, topup, withdraw, getGroupTransactionHistory };
};
