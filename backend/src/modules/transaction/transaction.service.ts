import HTTPError from "http-errors";
import { Ranks } from "../../ranks";
import type {
  TransactionServiceDeps,
  TransferInput,
  TransferResult,
} from "./transaction.types";

export const createTransactionService = (deps: TransactionServiceDeps) => {
  const { repo, exchangeRate, checkBalanceChallenges, trackChallengeProgress } =
    deps;

  const transfer = async (input: TransferInput): Promise<TransferResult> => {
    const {
      debtorUserId,
      creditorEmail,
      amountSrc,
      amountDest,
      currencySource,
      currencyDest,
    } = input;

    if (amountSrc <= 0) {
      throw HTTPError(400, "Invalid transfer amount");
    }

    const debtor = await repo.findUserById(debtorUserId);
    if (!debtor) {
      throw HTTPError(404, `p2ptransfer: UserId: ${debtorUserId} not found`);
    }

    const debtorWallet = await repo.findWallet(debtorUserId, currencySource);
    if (!debtorWallet) {
      throw HTTPError(404, "p2ptransfer: Debtor wallet not found");
    }

    // Self-transfer: the debtor is also the creditor.
    let creditor;
    if (creditorEmail === debtor.email) {
      creditor = debtor;
    } else {
      creditor = await repo.findUserByEmail(creditorEmail);
      if (!creditor) {
        throw HTTPError(404, "User not found");
      }
    }

    const creditorWallet =
      (await repo.findWallet(creditor.id, currencyDest)) ??
      (await repo.createWallet(creditor.id, currencyDest));

    if (debtorWallet.balance - Number(amountSrc) < 0) {
      throw HTTPError(400, "Insufficient balance");
    }

    const serviceFee =
      Ranks.find((rank) => rank.name === debtor.rank)?.serviceFee ?? 0;

    await repo.recordTransaction({
      fromUser: debtor,
      toUser: creditor,
      amountSrc,
      amountDest,
      currencySource,
      currencyDest,
      description: "P2P Transfer",
    });

    const newDebtorBalance = await repo.adjustWalletBalance(
      debtorWallet.id,
      -Number(amountSrc)
    );
    const newCreditorBalance = await repo.adjustWalletBalance(
      creditorWallet.id,
      Number(amountDest - serviceFee)
    );

    await checkBalanceChallenges(debtorUserId);
    await checkBalanceChallenges(creditor.id);

    // Normalize to AUD for challenge progress, matching legacy behavior.
    const srcToAud = await exchangeRate(currencySource, "AUD");
    const destToAud = await exchangeRate(currencyDest, "AUD");
    await trackChallengeProgress("pay", debtor.id, amountSrc * srcToAud.rate);
    await trackChallengeProgress(
      "receive",
      creditor.id,
      amountDest * destToAud.rate
    );

    return {
      success: true,
      message: "Transfer successful",
      debtorWalletId: debtorWallet.id,
      creditorWalletId: creditorWallet.id,
      amountTransferred: `${amountSrc}${currencySource}`,
      newDebtorBalance,
      newCreditorBalance,
    };
  };

  return { transfer };
};
