import HTTPError from "http-errors";
import { getDb } from "../../../lib/db";
import { users, requests, wallets, transactions } from "../../db/schema";
import { eq, and, inArray } from "drizzle-orm";
import type {
  CreateRequestInput,
  IRequestRepository,
  RequestListItem,
  RequestRecord,
  SavedRecipient,
  UserBasic,
} from "./request.types";

const toUserBasic = (r: { id: string; email: string }): UserBasic => ({
  id: r.id,
  email: r.email,
});

type RequestRow = typeof requests.$inferSelect;

const toRequestRecord = (r: RequestRow): RequestRecord => ({
  id: r.id,
  userId: r.userId,
  senderEmail: r.senderEmail,
  currency: r.currency,
  amount: Number(r.amount),
  notes: r.notes ?? "",
  date: r.date!,
});

const toRequestListItem = (r: RequestRow): RequestListItem => ({
  requestId: r.id,
  senderEmail: r.senderEmail,
  requestDate: r.date!,
  amount: Number(r.amount),
  currency: r.currency,
  notes: r.notes ?? "",
});

export const requestRepository: IRequestRepository = {
  async findUserById(id) {
    const [r] = await getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id));
    return r ? toUserBasic(r) : null;
  },

  async findUserByEmail(email) {
    const [r] = await getDb()
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.email, email));
    return r ? toUserBasic(r) : null;
  },

  async createRequestForRecipient(input: CreateRequestInput) {
    const [recipient] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, input.recipientEmail));
    if (!recipient) {
      throw HTTPError(404, "Recipient not found.");
    }
    // requests.user_id FK records ownership; no user-side array to append.
    const [r] = await getDb()
      .insert(requests)
      .values({
        userId: input.recipientUserId,
        senderEmail: input.senderEmail,
        currency: input.currency,
        amount: String(input.amount),
        notes: input.notes,
        date: new Date(),
      })
      .returning({ id: requests.id });
    return r.id;
  },

  async findUserWithRequestIds(userId) {
    const [u] = await getDb()
      .select({ id: users.id })
      .from(users)
      .where(eq(users.id, userId));
    if (!u) return null;
    const rows = await getDb()
      .select({ id: requests.id })
      .from(requests)
      .where(eq(requests.userId, userId));
    return { id: u.id, requestIds: rows.map((r) => r.id) };
  },

  async findRequestsByIds(ids) {
    if (ids.length === 0) return [];
    const rows = await getDb().select().from(requests).where(inArray(requests.id, ids));
    return rows.map(toRequestListItem);
  },

  async findRequestById(requestId) {
    const [r] = await getDb().select().from(requests).where(eq(requests.id, requestId));
    return r ? toRequestRecord(r) : null;
  },

  async findWalletByUserId(userId) {
    const [r] = await getDb()
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.userId, userId));
    return r ? { id: r.id } : null;
  },

  async findWalletsByUserAndCurrency(userId, currency) {
    const rows = await getDb()
      .select({ id: wallets.id })
      .from(wallets)
      .where(and(eq(wallets.userId, userId), eq(wallets.walletCurrency, currency)));
    return rows.map((r) => ({ id: r.id }));
  },

  async deleteRequestAndUnlink(requestId) {
    // requests.user_id FK is the sole link; deleting the row is enough.
    await getDb().delete(requests).where(eq(requests.id, requestId));
  },

  async findSavedRecipients(userId) {
    const rows = await getDb()
      .select({
        email: transactions.toAccountEmail,
        firstName: users.firstName,
        lastName: users.lastName,
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.toAccount, users.id))
      .where(eq(transactions.fromAccount, userId));

    // Dedupe by email, matching legacy behavior.
    const seen = new Set<string>();
    const unique: SavedRecipient[] = [];
    for (const r of rows) {
      if (seen.has(r.email)) continue;
      seen.add(r.email);
      unique.push({
        email: r.email,
        firstName: r.firstName ?? "",
        lastName: r.lastName ?? "",
      });
    }
    return unique;
  },

  async findRecipientInfo(email, userId) {
    const [doc] =
      email !== "SELF"
        ? await getDb().select({ id: users.id, email: users.email }).from(users).where(eq(users.email, email))
        : await getDb().select({ id: users.id, email: users.email }).from(users).where(eq(users.id, userId));

    if (!doc) return null;

    const walletRows = await getDb()
      .select({ id: wallets.id })
      .from(wallets)
      .where(eq(wallets.userId, doc.id));
    return { email: doc.email, walletInfo: walletRows.map((w) => w.id) };
  },
};
