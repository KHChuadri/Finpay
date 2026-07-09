import { getDb } from "../../lib/db";
import { users, wallets, scheduledPayments } from "../../src/db/schema";

type UserRow = typeof users.$inferSelect;
type WalletRow = typeof wallets.$inferSelect;
type ScheduledRow = typeof scheduledPayments.$inferSelect;

// Rows are returned with an `_id` alias (= uuid string) so tests written against
// the legacy Mongoose `_id`/`.toString()` shape keep working.
const withId = <T extends { id: string }>(row: T): T & { _id: string } => ({
  ...row,
  _id: row.id,
});

export const createTestUser = async (
  overrides: Partial<UserRow> = {}
): Promise<UserRow & { _id: string }> => {
  const [row] = await getDb()
    .insert(users)
    .values({
      firstName: "Test",
      lastName: "User",
      email: `test${Date.now()}${Math.random().toString(36).slice(2)}@example.com`,
      password: "hashedPassword123",
      passwordLength: 12,
      accountType: "personal",
      isVerified: true,
      isLocked: false,
      isAdmin: false,
      rank: "bronze",
      exp: 0,
      ...overrides,
    })
    .returning();
  return withId(row);
};

export const createTestWallet = async (
  userId: string,
  currency: string = "AUD",
  balance: number = 1000
): Promise<WalletRow & { _id: string }> => {
  const [row] = await getDb()
    .insert(wallets)
    .values({
      userId,
      walletCurrency: currency,
      walletBalance: String(balance),
    })
    .returning();
  return withId(row);
};

export const createTestScheduledPayment = async (
  overrides: Partial<{
    debtorId: string;
    creditorId: string;
    amountSrc: number;
    amountDest: number;
    currencySrc: string;
    currencyDest: string;
    scheduledDate: Date;
    status: ScheduledRow["status"];
    jobId: string;
  }> = {}
): Promise<ScheduledRow & { _id: string }> => {
  const {
    amountSrc = 100,
    amountDest = 100,
    scheduledDate = new Date(Date.now() + 60_000),
    ...rest
  } = overrides;
  const [row] = await getDb()
    .insert(scheduledPayments)
    .values({
      debtorId: rest.debtorId!,
      creditorId: rest.creditorId!,
      amountSrc: String(amountSrc),
      amountDest: String(amountDest),
      currencySrc: rest.currencySrc ?? "AUD",
      currencyDest: rest.currencyDest ?? "AUD",
      scheduledDate,
      status: rest.status,
      jobId: rest.jobId,
    })
    .returning();
  return withId(row);
};
