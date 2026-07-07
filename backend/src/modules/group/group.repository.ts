import mongoose from "mongoose";
import HTTPError from "http-errors";
import User from "../../../model/User";
import WalletInfo from "../../../model/WalletInfo";
import Groups from "../../../model/Groups";
import TransactionHistory from "../../../model/TransactionHistory";
import TransactionItem from "../../../model/TransactionItem";
import Invitation from "../../../model/Invitation";
import Notification from "../../../model/Notification";
import type {
  CreateGroupInput,
  CreateInvitationInput,
  CreateNotificationInput,
  GroupDetailRecord,
  GroupRecord,
  IGroupRepository,
  MemberRecord,
  RecordGroupTransactionInput,
  UserDetailRecord,
  UserNameRecord,
  UserRecord,
  WalletRecord,
} from "./group.types";

const toUserRecord = (doc: { _id: unknown; email: string }): UserRecord => ({
  id: String(doc._id),
  email: doc.email,
});

const toWalletRecord = (doc: {
  _id: unknown;
  userId: unknown;
  walletBalance: number;
  walletCurrency: string;
}): WalletRecord => ({
  id: String(doc._id),
  userId: String(doc.userId),
  balance: doc.walletBalance,
  currency: doc.walletCurrency,
});

const toGroupRecord = (doc: {
  _id: unknown;
  groupName: string;
  walletBalance: number;
  walletCurrency: string;
  transactionHistory: unknown[];
}): GroupRecord => ({
  id: String(doc._id),
  groupName: doc.groupName,
  walletBalance: doc.walletBalance,
  walletCurrency: doc.walletCurrency,
  transactionHistoryIds: (doc.transactionHistory ?? []).map((id) =>
    String(id)
  ),
});

const toGroupDetailRecord = (doc: {
  _id: unknown;
  groupName: string;
  description?: string | null;
  admin: unknown;
  members: unknown[];
  pendingInvite: unknown[];
  walletBalance: number;
  walletCurrency: string;
  transactionHistory: unknown[];
}): GroupDetailRecord => ({
  id: String(doc._id),
  groupName: doc.groupName,
  description: doc.description ?? null,
  admin: String(doc.admin),
  members: (doc.members ?? []).map((id) => String(id)),
  pendingInvite: (doc.pendingInvite ?? []).map((id) => String(id)),
  walletBalance: doc.walletBalance,
  walletCurrency: doc.walletCurrency,
  transactionHistoryIds: (doc.transactionHistory ?? []).map((id) =>
    String(id)
  ),
});

export const groupRepository: IGroupRepository = {
  async findUserById(id, session) {
    const doc = await User.findById(id, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByEmail(email, session) {
    const doc = await User.findOne({ email }, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async findUserByDepositId(depositId, session) {
    const doc = await User.findOne({ depositId }, null, { session });
    return doc ? toUserRecord(doc) : null;
  },

  async appendUserTransactionHistory(userId, transactionId, session) {
    await User.updateOne(
      { _id: userId },
      { $push: { transactionHistory: transactionId } },
      { session }
    );
  },

  async findGroupById(id, session) {
    const doc = await Groups.findById(id, null, { session });
    return doc ? toGroupRecord(doc) : null;
  },

  async adjustGroupBalance(groupId, delta, session) {
    const doc = await Groups.findById(groupId, null, { session });
    if (!doc) {
      throw HTTPError(404, "Group not found");
    }
    doc.walletBalance += delta;
    await doc.save({ session });
    return doc.walletBalance;
  },

  async appendGroupTransactionHistory(groupId, transactionId, session) {
    await Groups.updateOne(
      { _id: groupId },
      { $push: { transactionHistory: transactionId } },
      { session }
    );
  },

  async findTransactionHistoryByIds(ids) {
    return TransactionHistory.find({ _id: { $in: ids } }).lean();
  },

  async findWalletById(id, session) {
    const doc = await WalletInfo.findById(id, null, { session });
    return doc ? toWalletRecord(doc) : null;
  },

  async findWalletByUserAndCurrency(userId, currency, session) {
    const doc = await WalletInfo.findOne(
      { userId, walletCurrency: currency },
      null,
      { session }
    );
    return doc ? toWalletRecord(doc) : null;
  },

  async findWalletByIdsAndCurrency(ids, currency, session) {
    const doc = await WalletInfo.findOne(
      {
        _id: { $in: ids.map((id) => new mongoose.Types.ObjectId(id)) },
        walletCurrency: currency,
      },
      null,
      { session }
    );
    return doc ? toWalletRecord(doc) : null;
  },

  async createWallet(userId, currency, session) {
    const [doc] = await WalletInfo.create(
      [
        {
          userId,
          walletBalance: 0,
          walletCurrency: currency,
        },
      ],
      { session }
    );
    await User.updateOne(
      { _id: userId },
      { $push: { walletInfo: doc._id } },
      { session }
    );
    return toWalletRecord(doc);
  },

  async adjustWalletBalance(walletId, delta, session) {
    const doc = await WalletInfo.findById(walletId, null, { session });
    if (!doc) {
      throw HTTPError(404, "Wallet not found");
    }
    doc.walletBalance += delta;
    await doc.save({ session });
    return doc.walletBalance;
  },

  async deleteTransactionItemByTransactionId(transactionId, session) {
    const deleted = await TransactionItem.findOneAndDelete(
      { transactionId },
      { session }
    );
    return deleted !== null;
  },

  async recordTransaction(input: RecordGroupTransactionInput, session) {
    const [tx] = await TransactionHistory.create(
      [
        {
          transactionType: input.transactionType,
          amountSrc: input.amountSrc,
          currencySource: input.currencySource,
          amountDest: input.amountDest,
          currencyDest: input.currencyDest,
          fromAccount: input.fromAccount,
          toAccount: input.toAccount,
          fromAccountEmail: input.fromAccountEmail,
          toAccountEmail: input.toAccountEmail,
          fromAccountId: input.fromAccountId,
          toAccountId: input.toAccountId,
          description: input.description,
        },
      ],
      { session }
    );
    return tx._id.toString();
  },

  // --- Group management / invitations ---

  async findUserNameById(id): Promise<UserNameRecord | null> {
    const doc = await User.findById(id);
    return doc
      ? { id: String(doc._id), firstName: doc.firstName, lastName: doc.lastName }
      : null;
  },

  async findUserDetailById(id): Promise<UserDetailRecord | null> {
    const doc = await User.findById(id);
    return doc
      ? {
          id: String(doc._id),
          email: doc.email,
          groups: (doc.groups ?? []).map((g) => String(g)),
          invitation: (doc.invitation ?? []).map((i) => String(i)),
        }
      : null;
  },

  async findUserRawById(id) {
    return User.findById(id).lean();
  },

  async findUsersByIds(ids) {
    return User.find({ _id: { $in: ids } }).lean();
  },

  async findMembersByIds(ids): Promise<MemberRecord[]> {
    const docs = await User.find({ _id: { $in: ids } }).select(
      "firstName lastName email"
    );
    return docs.map((doc) => ({
      id: String(doc._id),
      firstName: doc.firstName,
      lastName: doc.lastName,
      email: doc.email,
    }));
  },

  async appendUserGroup(userId, groupId) {
    await User.updateOne({ _id: userId }, { $push: { groups: groupId } });
  },

  async removeUserGroup(userId, groupId) {
    await User.updateOne({ _id: userId }, { $pull: { groups: groupId } });
  },

  async addUserInvitation(userId, invitationId) {
    await User.updateOne(
      { _id: userId },
      { $push: { invitation: invitationId } }
    );
  },

  async removeUserInvitation(userId, invitationId) {
    await User.updateOne(
      { _id: userId },
      { $pull: { invitation: invitationId } }
    );
  },

  async addUserNotification(userId, notificationId) {
    await User.updateOne(
      { _id: userId },
      { $push: { notification: notificationId } }
    );
  },

  async findGroupDetailById(id) {
    const doc = await Groups.findById(id);
    return doc ? toGroupDetailRecord(doc) : null;
  },

  async findGroupsByIds(ids) {
    return Groups.find({ _id: { $in: ids } }).lean();
  },

  async createGroup(input: CreateGroupInput) {
    const doc = new Groups({
      groupName: input.groupName,
      description: input.description,
      admin: new mongoose.Types.ObjectId(input.creatorId),
      transactionHistory: [],
      members: [new mongoose.Types.ObjectId(input.creatorId)],
      pendingInvite: [],
      walletCurrency: input.currency,
    });
    await doc.save();
    return { id: doc._id.toString() };
  },

  async deleteGroupById(groupId) {
    await Groups.findByIdAndDelete(groupId);
  },

  async setGroupMembersAndAdmin(groupId, members, admin) {
    await Groups.updateOne(
      { _id: groupId },
      { $set: { members, ...(admin ? { admin } : {}) } }
    );
  },

  async addGroupMember(groupId, userId) {
    await Groups.updateOne({ _id: groupId }, { $push: { members: userId } });
  },

  async removeGroupMember(groupId, userId) {
    await Groups.updateOne({ _id: groupId }, { $pull: { members: userId } });
  },

  async addGroupPendingInvite(groupId, invitationId) {
    await Groups.updateOne(
      { _id: groupId },
      { $push: { pendingInvite: invitationId } }
    );
  },

  async removeGroupPendingInvite(groupId, invitationId) {
    await Groups.updateOne(
      { _id: groupId },
      { $pull: { pendingInvite: invitationId } }
    );
  },

  async findInvitationById(id) {
    const doc = await Invitation.findById(id);
    return doc
      ? {
          id: String(doc._id),
          groupId: String(doc.groupId),
          receiver: String(doc.receiver),
        }
      : null;
  },

  async findInvitationsByIds(ids) {
    return Invitation.find({ _id: { $in: ids } }).lean();
  },

  async createInvitation(input: CreateInvitationInput) {
    const doc = new Invitation({
      groupName: input.groupName,
      groupId: new mongoose.Types.ObjectId(input.groupId),
      sender: new mongoose.Types.ObjectId(input.senderId),
      receiver: new mongoose.Types.ObjectId(input.receiverId),
      senderName: input.senderName,
      receiverName: input.receiverName,
    });
    await doc.save();
    return { id: doc._id.toString() };
  },

  async createNotification(input: CreateNotificationInput) {
    const doc = new Notification({
      type: input.type,
      sender: new mongoose.Types.ObjectId(input.senderId),
      receiver: new mongoose.Types.ObjectId(input.receiverId),
      description: input.description,
      createdAt: new Date(),
    });
    await doc.save();
    return { id: doc._id.toString() };
  },

  async deleteInvitationById(invitationId) {
    await Invitation.findOneAndDelete({ _id: invitationId });
  },
};
