import HTTPError from "http-errors";
import type { RequestServiceDeps } from "./request.types";

export const createRequestService = (deps: RequestServiceDeps) => {
  const { repo, transfer } = deps;

  /** Mirrors legacy sendRequest. */
  const sendRequest = async (
    email: string, // Requested user
    senderId: string, // Requester
    amount: number,
    currency: string,
    notes: string
  ) => {
    const sender = await repo.findUserById(senderId);
    if (!sender) {
      throw HTTPError(404, "User does not exists");
    }

    const recipient = await repo.findUserByEmail(email);
    if (!recipient) {
      throw HTTPError(404, "Recipient not found.");
    }

    if (email === sender.email) {
      throw HTTPError(400, "Cannot send request to yourself");
    }

    if (amount <= 0) {
      throw HTTPError(400, "Amount must be greater than 0");
    }

    const requestId = await repo.createRequestForRecipient({
      recipientUserId: recipient.id,
      recipientEmail: recipient.email,
      senderEmail: sender.email,
      amount,
      currency,
      notes,
    });

    return { requestId };
  };

  /** Mirrors legacy getRequestList. */
  const getRequestList = async (userId: string) => {
    const user = await repo.findUserWithRequestIds(userId);
    if (!user) {
      throw HTTPError(404, "User does not exists");
    }

    const request = await repo.findRequestsByIds(user.requestIds);
    return { request };
  };

  /** Mirrors legacy acceptRequest: validates then delegates the money movement
   *  to the injected `transfer` dependency (the transaction slice's service). */
  const acceptRequest = async (requestId: string) => {
    const request = await repo.findRequestById(requestId);
    if (!request) {
      throw HTTPError(404, "Request not found");
    }

    const { userId, senderEmail, amount, currency } = request;

    const creditor = await repo.findUserByEmail(senderEmail);
    if (!creditor) {
      throw HTTPError(404, "Sender user not found");
    }

    const debtorWallet = await repo.findWalletByUserId(userId);
    const creditorWallets = await repo.findWalletsByUserAndCurrency(
      creditor.id,
      currency
    );

    if (!debtorWallet || !creditorWallets || creditorWallets.length === 0) {
      throw HTTPError(404, "User need to create a Wallets not found");
    }

    await transfer({
      debtorUserId: userId,
      creditorEmail: senderEmail,
      amountSrc: amount,
      amountDest: amount,
      currencySource: currency,
      currencyDest: currency,
    });

    // Remove the request from both user and request collection
    await repo.deleteRequestAndUnlink(requestId, userId);

    return { success: true, message: "Request accepted successfully" };
  };

  /** Mirrors legacy deleteRequest. */
  const deleteRequest = async (requestId: string) => {
    const request = await repo.findRequestById(requestId);
    if (!request) {
      throw HTTPError(404, "Request not found");
    }

    await repo.deleteRequestAndUnlink(requestId, request.userId);

    return { success: true, message: "Request deleted successfully" };
  };

  /** Mirrors legacy getSavedRecipient. */
  const getSavedRecipient = async (userId: string) => {
    const recipients = await repo.findSavedRecipients(userId);
    return { recipients };
  };

  /** Mirrors legacy findRecipient. */
  const findRecipient = async (email: string, userId: string) => {
    const recipient = await repo.findRecipientInfo(email, userId);
    if (!recipient) {
      throw HTTPError(404, "Recipient not found.");
    }

    if (!recipient.walletInfo) {
      throw HTTPError(404, "Recipient has no wallet.");
    }

    return recipient;
  };

  return {
    sendRequest,
    getRequestList,
    acceptRequest,
    deleteRequest,
    getSavedRecipient,
    findRecipient,
  };
};
