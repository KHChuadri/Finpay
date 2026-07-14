import { getDb, type DbOrTx } from "../../../lib/db";
import {
  users,
  groups,
  groupMembers,
  wallets,
  transactions,
  transactionItems,
  invitations,
  notifications,
} from "../../db/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import HTTPError from "http-errors";
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

const run = (session?: DbOrTx) => session ?? getDb();

const toUserRecord = (r: { id: string; email: string }): UserRecord => ({
  id: r.id,
  email: r.email,
});

const toWalletRecord = (r: {
  id: string;
  userId: string;
  walletBalance: string;
  walletCurrency: string;
}): WalletRecord => ({
  id: r.id,
  userId: r.userId,
  balance: Number(r.walletBalance),
  currency: r.walletCurrency,
});

// Legacy `.lean()` doc shape: expose `_id` (uuid) and drop `__v`.
const withId = <T extends { id: string }>(r: T): Record<string, unknown> => {
  const { id, ...rest } = r;
  return { _id: id, ...rest };
};

const groupTransactionIds = async (groupId: string, session?: DbOrTx) => {
  const rows = await run(session)
    .select({ id: transactions.id })
    .from(transactions)
    .where(eq(transactions.groupId, groupId));
  return rows.map((r) => r.id);
};

export const groupRepository: IGroupRepository = {
  async findUserById(id, session) {
    const [r] = await run(session)
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id));
    return r ? toUserRecord(r) : null;
  },

  async findUserByEmail(email, session) {
    const [r] = await run(session)
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email));
    return r ? toUserRecord(r) : null;
  },

  async findUserByDepositId(depositId, session) {
    const [r] = await run(session)
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.depositId, depositId));
    return r ? toUserRecord(r) : null;
  },

  // No-op: user transaction history derives from transactions.from/to_account.
  async appendUserTransactionHistory() {},

  async findGroupById(id, session) {
    const [g] = await run(session).select().from(groups).where(eq(groups.id, id));
    if (!g) return null;
    const record: GroupRecord = {
      id: g.id,
      groupName: g.groupName,
      walletBalance: Number(g.walletBalance),
      walletCurrency: g.walletCurrency,
      transactionHistoryIds: await groupTransactionIds(id, session),
    };
    return record;
  },

  async adjustGroupBalance(groupId, delta, session) {
    const [g] = await run(session)
      .update(groups)
      .set({ walletBalance: sql`${groups.walletBalance} + ${String(delta)}` })
      .where(eq(groups.id, groupId))
      .returning();
    if (!g) throw HTTPError(404, "Group not found");
    return Number(g.walletBalance);
  },

  async appendGroupTransactionHistory(groupId, transactionId, session) {
    await run(session)
      .update(transactions)
      .set({ groupId })
      .where(eq(transactions.id, transactionId));
  },

  async findTransactionHistoryByIds(ids) {
    if (ids.length === 0) return [];
    const rows = await getDb()
      .select()
      .from(transactions)
      .where(inArray(transactions.id, ids));
    return rows.map(withId);
  },

  async findWalletById(id, session) {
    const [r] = await run(session).select().from(wallets).where(eq(wallets.id, id));
    return r ? toWalletRecord(r) : null;
  },

  async findWalletByUserAndCurrency(userId, currency, session) {
    const [r] = await run(session)
      .select()
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return r ? toWalletRecord(r) : null;
  },

  async findWalletByIdsAndCurrency(ids, currency, session) {
    if (ids.length === 0) return null;
    const [r] = await run(session)
      .select()
      .from(wallets)
      .where(and(inArray(wallets.id, ids), eq(wallets.walletCurrency, currency)));
    return r ? toWalletRecord(r) : null;
  },

  async createWallet(userId, currency, session) {
    const [r] = await run(session)
      .insert(wallets)
      .values({ userId, walletBalance: "0", walletCurrency: currency })
      .returning();
    return toWalletRecord(r);
  },

  async adjustWalletBalance(walletId, delta, session) {
    const [r] = await run(session)
      .update(wallets)
      .set({ walletBalance: sql`${wallets.walletBalance} + ${String(delta)}` })
      .where(eq(wallets.id, walletId))
      .returning();
    if (!r) throw HTTPError(404, "Wallet not found");
    return Number(r.walletBalance);
  },

  async deleteTransactionItemByTransactionId(transactionId, session) {
    const deleted = await run(session)
      .delete(transactionItems)
      .where(eq(transactionItems.transactionId, transactionId))
      .returning({ id: transactionItems.id });
    return deleted.length > 0;
  },

  async recordTransaction(input: RecordGroupTransactionInput, session) {
    const [tx] = await run(session)
      .insert(transactions)
      .values({
        transactionType: input.transactionType,
        amountSrc: String(input.amountSrc),
        currencySource: input.currencySource,
        amountDest: String(input.amountDest),
        currencyDest: input.currencyDest,
        fromAccount: input.fromAccount,
        toAccount: input.toAccount,
        fromAccountEmail: input.fromAccountEmail,
        toAccountEmail: input.toAccountEmail,
        fromAccountId: input.fromAccountId,
        toAccountId: input.toAccountId,
        description: input.description,
      })
      .returning({ id: transactions.id });
    return tx.id;
  },

  // --- Group management / invitations ---

  async findUserNameById(id): Promise<UserNameRecord | null> {
    const [r] = await getDb()
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, id));
    return r ? { id: r.id, firstName: r.firstName, lastName: r.lastName } : null;
  },

  async findUserDetailById(id): Promise<UserDetailRecord | null> {
    const [u] = await getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id));
    if (!u) return null;
    const groupRows = await getDb()
      .select({ groupId: groupMembers.groupId })
      .from(groupMembers)
      .where(eq(groupMembers.userId, id));
    const inviteRows = await getDb()
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.receiver, id));
    return {
      id: u.id,
      email: u.email,
      groups: groupRows.map((r) => r.groupId),
      invitation: inviteRows.map((r) => r.id),
    };
  },

  async findUserRawById(id) {
    const [r] = await getDb().select().from(users).where(eq(users.id, id));
    return r ? withId(r) : null;
  },

  async findUsersByIds(ids) {
    if (ids.length === 0) return [];
    const rows = await getDb().select().from(users).where(inArray(users.id, ids));
    return rows.map(withId);
  },

  async findMembersByIds(ids): Promise<MemberRecord[]> {
    if (ids.length === 0) return [];
    const rows = await getDb()
      .select({
        id: users.id,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
      })
      .from(users)
      .where(inArray(users.id, ids));
    return rows;
  },

  // Membership lives in one join table; both "user side" and "group side"
  // appends map to the same idempotent insert.
  async appendUserGroup(userId, groupId) {
    await getDb()
      .insert(groupMembers)
      .values({ groupId, userId })
      .onConflictDoNothing();
  },

  async removeUserGroup(userId, groupId) {
    await getDb()
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  },

  // No-op: pending invites derive from invitations.receiver.
  async addUserInvitation() {},
  // No-op: removal is driven by deleteInvitationById.
  async removeUserInvitation() {},
  // No-op: notifications derive from notifications.receiver.
  async addUserNotification() {},

  async findGroupDetailById(id): Promise<GroupDetailRecord | null> {
    const [g] = await getDb().select().from(groups).where(eq(groups.id, id));
    if (!g) return null;
    const memberRows = await getDb()
      .select({ userId: groupMembers.userId })
      .from(groupMembers)
      .where(eq(groupMembers.groupId, id));
    const pendingRows = await getDb()
      .select({ id: invitations.id })
      .from(invitations)
      .where(eq(invitations.groupId, id));
    return {
      id: g.id,
      groupName: g.groupName,
      description: g.description ?? null,
      admin: g.adminId,
      members: memberRows.map((r) => r.userId),
      pendingInvite: pendingRows.map((r) => r.id),
      walletBalance: Number(g.walletBalance),
      walletCurrency: g.walletCurrency,
      transactionHistoryIds: await groupTransactionIds(id),
    };
  },

  async findGroupsByIds(ids) {
    if (ids.length === 0) return [];
    const rows = await getDb().select().from(groups).where(inArray(groups.id, ids));
    return rows.map(withId);
  },

  async createGroup(input: CreateGroupInput) {
    const [g] = await getDb()
      .insert(groups)
      .values({
        groupName: input.groupName,
        description: input.description,
        adminId: input.creatorId,
        walletCurrency: input.currency,
      })
      .returning({ id: groups.id });
    await getDb()
      .insert(groupMembers)
      .values({ groupId: g.id, userId: input.creatorId })
      .onConflictDoNothing();
    return { id: g.id };
  },

  async deleteGroupById(groupId) {
    await getDb().delete(groups).where(eq(groups.id, groupId));
  },

  async setGroupMembersAndAdmin(groupId, members, admin) {
    await getDb().delete(groupMembers).where(eq(groupMembers.groupId, groupId));
    if (members.length > 0) {
      await getDb()
        .insert(groupMembers)
        .values(members.map((userId) => ({ groupId, userId })))
        .onConflictDoNothing();
    }
    if (admin) {
      await getDb().update(groups).set({ adminId: admin }).where(eq(groups.id, groupId));
    }
  },

  async addGroupMember(groupId, userId) {
    await getDb()
      .insert(groupMembers)
      .values({ groupId, userId })
      .onConflictDoNothing();
  },

  async removeGroupMember(groupId, userId) {
    await getDb()
      .delete(groupMembers)
      .where(and(eq(groupMembers.groupId, groupId), eq(groupMembers.userId, userId)));
  },

  // No-op: pending invites derive from invitations.groupId.
  async addGroupPendingInvite() {},
  async removeGroupPendingInvite() {},

  async findInvitationById(id) {
    const [r] = await getDb()
      .select({
        id: invitations.id,
        groupId: invitations.groupId,
        receiver: invitations.receiver,
      })
      .from(invitations)
      .where(eq(invitations.id, id));
    return r ? { id: r.id, groupId: r.groupId, receiver: r.receiver } : null;
  },

  async findInvitationsByIds(ids) {
    if (ids.length === 0) return [];
    const rows = await getDb()
      .select()
      .from(invitations)
      .where(inArray(invitations.id, ids));
    return rows.map(withId);
  },

  async createInvitation(input: CreateInvitationInput) {
    const [r] = await getDb()
      .insert(invitations)
      .values({
        groupName: input.groupName,
        groupId: input.groupId,
        sender: input.senderId,
        receiver: input.receiverId,
        senderName: input.senderName,
        receiverName: input.receiverName,
      })
      .returning({ id: invitations.id });
    return { id: r.id };
  },

  async createNotification(input: CreateNotificationInput) {
    const [r] = await getDb()
      .insert(notifications)
      .values({
        type: input.type as (typeof notifications.type.enumValues)[number],
        sender: input.senderId,
        receiver: input.receiverId,
        description: input.description,
      })
      .returning({ id: notifications.id });
    return { id: r.id };
  },

  async deleteInvitationById(invitationId) {
    await getDb().delete(invitations).where(eq(invitations.id, invitationId));
  },
};
