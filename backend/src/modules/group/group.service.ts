import HTTPError from "http-errors";
import type {
  CreateGroupInput,
  CreateGroupResult,
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

  // --- Group management / invitations ---

  /** Mirrors legacy `setGroup` (create group). */
  const createGroup = async (
    input: CreateGroupInput
  ): Promise<CreateGroupResult> => {
    const user = await repo.findUserById(input.creatorId);
    if (!user) {
      throw HTTPError(404, "User user not found");
    }

    const { id: groupId } = await repo.createGroup(input);
    await repo.appendUserGroup(input.creatorId, groupId);

    return { groupId };
  };

  /** Mirrors legacy `leaveGroup`. */
  const leaveGroup = async (
    groupId: string,
    actorId: string
  ): Promise<{ message: string }> => {
    const group = await repo.findGroupDetailById(groupId);
    if (!group) {
      throw HTTPError(404, "group not found");
    }

    const user = await repo.findUserById(actorId);
    if (!user) {
      throw HTTPError(404, "User not found");
    }

    if (group.members.length === 1 && group.walletBalance !== 0) {
      throw HTTPError(
        404,
        "You Are The Only Member Left And Wallet Balance Is Not Empty"
      );
    }

    await repo.removeUserGroup(actorId, groupId);

    const remainingMembers = group.members.filter((m) => m !== actorId);
    if (remainingMembers.length === 0) {
      await repo.deleteGroupById(groupId);
    } else if (group.admin === actorId) {
      await repo.setGroupMembersAndAdmin(
        groupId,
        remainingMembers,
        remainingMembers[0]
      );
    } else {
      await repo.setGroupMembersAndAdmin(groupId, remainingMembers);
    }

    return { message: "Successfully Left Group" };
  };

  /** Mirrors legacy `editGroupMember` (invite/remove a member). */
  const editGroupMember = async (
    groupId: string,
    targetId: string,
    mode: string,
    actorId: string
  ): Promise<{ message: string }> => {
    const group = await repo.findGroupDetailById(groupId);
    if (!group) {
      throw HTTPError(404, "group not found");
    }

    const member = await repo.findUserNameById(targetId);
    if (!member) {
      throw HTTPError(404, "User not found");
    }

    if (actorId !== group.admin) {
      throw HTTPError(400, "User is not the admin");
    }

    const actorUser = await repo.findUserNameById(actorId);
    if (!actorUser) {
      throw HTTPError(404, "User not found");
    }

    if (mode === "add") {
      if (group.members.includes(targetId)) {
        throw HTTPError(400, "This Person is Already Part Of The Group");
      }

      const pendingInvitations = await repo.findInvitationsByIds(
        group.pendingInvite
      );
      if (
        pendingInvitations.some(
          (invite) => String(invite.receiver) === targetId
        )
      ) {
        throw HTTPError(400, "This Person already has a pending invite");
      }

      const { id: invitationId } = await repo.createInvitation({
        groupName: group.groupName,
        groupId,
        senderId: actorId,
        receiverId: targetId,
        senderName: `${actorUser.firstName} ${actorUser.lastName}`,
        receiverName: `${member.firstName} ${member.lastName}`,
      });

      const { id: notificationId } = await repo.createNotification({
        type: "Invitation",
        senderId: actorId,
        receiverId: targetId,
        description: `${actorUser.firstName} ${actorUser.lastName} Invites You To join ${group.groupName}`,
      });

      await repo.addUserInvitation(targetId, invitationId);
      await repo.addGroupPendingInvite(groupId, invitationId);
      await repo.addUserNotification(targetId, notificationId);
    } else if (mode === "remove") {
      if (group.admin === targetId) {
        throw HTTPError(400, "You Cannot Remove Yourself");
      }

      await repo.removeGroupMember(groupId, targetId);
      await repo.removeUserGroup(targetId, groupId);
    }

    return { message: "Group updated" };
  };

  /** Mirrors legacy `processInvitation` (accept/reject). */
  const processInvitation = async (
    invitationId: string,
    mode: string
  ): Promise<{ message: string }> => {
    const invitation = await repo.findInvitationById(invitationId);
    if (!invitation) {
      throw HTTPError(404, "invitation not found");
    }

    const group = await repo.findGroupById(invitation.groupId);
    if (!group) {
      throw HTTPError(404, "Group not found");
    }

    const member = await repo.findUserById(invitation.receiver);
    if (!member) {
      throw HTTPError(404, "User not found");
    }

    if (mode === "accept") {
      await repo.addGroupMember(group.id, member.id);
      await repo.appendUserGroup(member.id, invitation.groupId);
      await repo.removeUserInvitation(member.id, invitationId);
      await repo.removeGroupPendingInvite(group.id, invitationId);
      await repo.deleteInvitationById(invitationId);
    } else if (mode === "reject") {
      await repo.removeUserInvitation(member.id, invitationId);
      await repo.removeGroupPendingInvite(group.id, invitationId);
      await repo.deleteInvitationById(invitationId);
    }

    return { message: "Invitation Processed" };
  };

  /** Mirrors legacy `getGroupList`. Returns raw (non-flattened) Group docs. */
  const getGroupList = async (userId: string) => {
    const user = await repo.findUserDetailById(userId);
    if (!user) {
      throw HTTPError(400, "User not found or does not exist");
    }
    if (!Array.isArray(user.groups)) {
      throw HTTPError(400, "User has no group list");
    }

    return repo.findGroupsByIds(user.groups);
  };

  /** Mirrors legacy `getInvitationList`. Returns raw (non-flattened) Invitation docs. */
  const getInvitationList = async (userId: string) => {
    const user = await repo.findUserDetailById(userId);
    if (!user) {
      throw HTTPError(400, "User not found or does not exist");
    }
    if (!Array.isArray(user.invitation)) {
      throw HTTPError(400, "User has no invitation list");
    }

    return repo.findInvitationsByIds(user.invitation);
  };

  /** Mirrors legacy `getPendingInvitation`. Returns raw (non-flattened) Invitation docs. */
  const getPendingInvitation = async (groupId: string) => {
    const group = await repo.findGroupDetailById(groupId);
    if (!group) {
      throw HTTPError(400, "User not found or does not exist");
    }
    if (!Array.isArray(group.pendingInvite)) {
      throw HTTPError(400, "User has no invitation list");
    }

    return repo.findInvitationsByIds(group.pendingInvite);
  };

  /** Mirrors legacy `getMemberList` (already flattens to {id,name,email,role} upstream). */
  const getMemberList = async (groupId: string) => {
    const group = await repo.findGroupDetailById(groupId);
    if (!group) {
      throw HTTPError(400, "Groups not found or does not exist");
    }
    if (!Array.isArray(group.members)) {
      throw HTTPError(400, "Groups has no member list");
    }

    const members = await repo.findMembersByIds(group.members);
    return members.map((member) => ({
      id: member.id,
      name: `${member.firstName} ${member.lastName}`,
      email: member.email,
      role: group.admin === member.id ? "Admin" : "Member",
    }));
  };

  /** Mirrors legacy `getGroup`. members/transactionHistory/admin are raw docs. */
  const getGroup = async (groupId: string) => {
    const group = await repo.findGroupDetailById(groupId);
    if (!group) {
      throw HTTPError(404, "group not found");
    }

    const members = await repo.findUsersByIds(group.members);
    const transactionHistory = await repo.findTransactionHistoryByIds(
      group.transactionHistoryIds
    );
    const admin = await repo.findUserRawById(group.admin);
    if (!admin) {
      throw HTTPError(404, "Admin user not found");
    }

    return {
      members,
      transactionHistory,
      admin,
      groupName: group.groupName,
      description: group.description || null,
      walletCurrency: group.walletCurrency,
      walletBalance: group.walletBalance,
    };
  };

  /** Mirrors legacy `findInvitee`. */
  const findInvitee = async (
    email: string,
    userId: string,
    groupId: string
  ): Promise<string> => {
    const self = await repo.findUserById(userId);
    const recipient = await repo.findUserByEmail(email);
    const group = await repo.findGroupDetailById(groupId);

    if (!recipient) {
      throw HTTPError(404, "Recipient not found.");
    }

    if (group?.admin !== userId) {
      throw HTTPError(400, "You Need To Be An Admin To Invite");
    }

    // Non-null assertion mirrors legacy `self!.email` — a missing `self` here
    // is not expected to happen via the route (userId is the caller's own id).
    if (self!.email === recipient.email) {
      throw HTTPError(400, "Cannot Invite Oneself");
    }

    if (group.members.includes(recipient.id)) {
      throw HTTPError(400, "This Person is Already Part Of The Group");
    }

    const pendingInvitations = await repo.findInvitationsByIds(
      group.pendingInvite
    );
    if (
      pendingInvitations.some(
        (invite) => String(invite.receiver) === recipient.id
      )
    ) {
      throw HTTPError(400, "This Person already has a pending invite");
    }

    return recipient.id;
  };

  return {
    setDepositData,
    topup,
    withdraw,
    getGroupTransactionHistory,
    createGroup,
    leaveGroup,
    editGroupMember,
    processInvitation,
    getGroupList,
    getInvitationList,
    getPendingInvitation,
    getMemberList,
    getGroup,
    findInvitee,
  };
};
