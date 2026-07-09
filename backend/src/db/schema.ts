import {
  pgTable, uuid, text, numeric, integer, boolean, timestamp, pgEnum,
  primaryKey, check,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

// --- Enums (values verbatim from Mongoose schemas) ---
export const accountTypeEnum = pgEnum("account_type", ["personal", "business"]);
export const rankEnum = pgEnum("rank", ["bronze", "silver", "gold", "platinum"]);
export const bankAccountTypeEnum = pgEnum("bank_account_type", ["savings", "checking"]);
export const notificationTypeEnum = pgEnum("notification_type", ["Mission", "Transfer", "Request", "Invitation"]);
export const challengeCategoryEnum = pgEnum("challenge_category", ["pay", "receive", "save"]);
export const transactionItemTypeEnum = pgEnum("transaction_item_type", ["Deposit", "Withdraw"]);
export const scheduledStatusEnum = pgEnum("scheduled_status", ["pending", "processing", "completed", "failed", "cancelled"]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull().$onUpdate(() => new Date()),
};

// --- users ---
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull().unique(),
  existingPassword: text("existing_password").array().notNull().default(sql`'{}'`),
  password: text("password").notNull(),
  passwordLength: integer("password_length"),
  bankInfoId: uuid("bank_info_id"),
  bioDataId: uuid("bio_data_id"),
  accountType: accountTypeEnum("account_type").notNull().default("personal"),
  tokens: text("tokens").array().notNull().default(sql`'{}'`),
  selfUserId: uuid("self_user_id"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordTokenExpiryDate: numeric("reset_password_token_expiry_date"),
  isVerified: boolean("is_verified").notNull().default(false),
  isLocked: boolean("is_locked").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  kycImg: text("kyc_img"),
  profileImg: text("profile_img"),
  lastNotificationSeen: timestamp("last_notification_seen", { withTimezone: true }).defaultNow(),
  depositId: uuid("deposit_id").notNull().defaultRandom(),
  rank: rankEnum("rank").notNull().default("bronze"),
  exp: integer("exp").notNull().default(0),
  ...timestamps,
});

// --- wallets (was WalletInfo) ---
export const wallets = pgTable("wallets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  walletBalance: numeric("wallet_balance", { precision: 19, scale: 4 }).notNull().default("0"),
  walletCurrency: text("wallet_currency").notNull(),
  ...timestamps,
}, (t) => [check("wallet_balance_non_negative", sql`${t.walletBalance} >= 0`)]);

// --- groups ---
export const groups = pgTable("groups", {
  id: uuid("id").primaryKey().defaultRandom(),
  walletBalance: numeric("wallet_balance", { precision: 19, scale: 4 }).notNull().default("0"),
  walletCurrency: text("wallet_currency").notNull().default("AUD"),
  adminId: uuid("admin_id").notNull().references(() => users.id),
  groupName: text("group_name").notNull(),
  description: text("description"),
  ...timestamps,
});

// --- transactions (was TransactionHistory) ---
export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  transactionType: text("transaction_type"),
  amountSrc: numeric("amount_src", { precision: 19, scale: 4 }).notNull(),
  currencySource: text("currency_source").notNull(),
  amountDest: numeric("amount_dest", { precision: 19, scale: 4 }).notNull(),
  currencyDest: text("currency_dest").notNull(),
  // Polymorphic: holds a user id (p2p) or a group id (group topup/withdraw),
  // so intentionally not FK-constrained to a single table.
  fromAccount: uuid("from_account").notNull(),
  toAccount: uuid("to_account").notNull(),
  fromAccountEmail: text("from_account_email").notNull(),
  toAccountEmail: text("to_account_email").notNull(),
  fromAccountId: text("from_account_id").notNull(),
  toAccountId: text("to_account_id").notNull(),
  groupId: uuid("group_id").references(() => groups.id, { onDelete: "set null" }),
  transactionDate: timestamp("transaction_date", { withTimezone: true }).defaultNow(),
  description: text("description").notNull(),
  ...timestamps,
});

// --- transaction_items (was TransactionItem) ---
export const transactionItems = pgTable("transaction_items", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  transactionType: transactionItemTypeEnum("transaction_type").notNull(),
  transactionId: text("transaction_id").notNull(),
  currency: text("currency").notNull().default("AUD"),
  amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
  depositId: text("deposit_id").default(""),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  name: text("name").notNull(),
  ...timestamps,
});

// --- bank_info ---
export const bankInfo = pgTable("bank_info", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  bankName: text("bank_name").notNull(),
  accountNumber: text("account_number").notNull(),
  routingNumber: text("routing_number").notNull(),
  accountType: bankAccountTypeEnum("account_type").notNull(),
  ...timestamps,
});

// --- addresses ---
export const addresses = pgTable("addresses", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  addressLine1: text("address_line1"),
  addressLine2: text("address_line2"),
  country: text("country"),
  ...timestamps,
});

// --- bio_data ---
export const bioData = pgTable("bio_data", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  dateOfBirth: timestamp("date_of_birth", { withTimezone: true }),
  addressId: uuid("address_id").references(() => addresses.id, { onDelete: "set null" }),
  ...timestamps,
});

// --- group_members (join, was Groups.members[] + User.groups[]) ---
export const groupMembers = pgTable("group_members", {
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
}, (t) => [primaryKey({ columns: [t.groupId, t.userId] })]);

// --- invitations ---
export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  groupName: text("group_name").notNull(),
  groupId: uuid("group_id").notNull().references(() => groups.id, { onDelete: "cascade" }),
  senderName: text("sender_name").notNull(),
  sender: uuid("sender").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiver: uuid("receiver").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiverName: text("receiver_name").notNull(),
  ...timestamps,
});

// --- notifications ---
export const notifications = pgTable("notifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  type: notificationTypeEnum("type").notNull(),
  description: text("description"),
  sender: uuid("sender").notNull().references(() => users.id, { onDelete: "cascade" }),
  receiver: uuid("receiver").notNull().references(() => users.id, { onDelete: "cascade" }),
  ...timestamps,
});

// --- requests ---
export const requests = pgTable("requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  senderEmail: text("sender_email").notNull(),
  currency: text("currency").notNull(),
  amount: numeric("amount", { precision: 19, scale: 4 }).notNull(),
  notes: text("notes").default(""),
  date: timestamp("date", { withTimezone: true }).defaultNow(),
  ...timestamps,
});

// --- scheduled_payments ---
export const scheduledPayments = pgTable("scheduled_payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  debtorId: uuid("debtor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  creditorId: uuid("creditor_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  amountSrc: numeric("amount_src", { precision: 19, scale: 4 }).notNull(),
  amountDest: numeric("amount_dest", { precision: 19, scale: 4 }).notNull(),
  currencySrc: text("currency_src").notNull(),
  currencyDest: text("currency_dest").notNull(),
  scheduledDate: timestamp("scheduled_date", { withTimezone: true }).notNull(),
  status: scheduledStatusEnum("status").notNull().default("pending"),
  processedAt: timestamp("processed_at", { withTimezone: true }),
  transactionId: text("transaction_id"),
  failureReason: text("failure_reason"),
  lastAttempt: timestamp("last_attempt", { withTimezone: true }),
  jobId: text("job_id"),
  ...timestamps,
});

// --- challenges ---
export const challenges = pgTable("challenges", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  exp: integer("exp").notNull(),
  startDate: timestamp("start_date", { withTimezone: true }).notNull(),
  endDate: timestamp("end_date", { withTimezone: true }).notNull(),
  category: challengeCategoryEnum("category").notNull(),
  amountToGoal: numeric("amount_to_goal", { precision: 19, scale: 4 }).notNull(),
  ...timestamps,
});

// --- user_challenge_progress ---
export const userChallengeProgress = pgTable("user_challenge_progress", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  challengeId: uuid("challenge_id").references(() => challenges.id, { onDelete: "cascade" }),
  progress: numeric("progress", { precision: 19, scale: 4 }).notNull().default("0"),
  completed: boolean("completed").notNull().default(false),
  lastCheckedDate: timestamp("last_checked_date", { withTimezone: true }),
  ...timestamps,
});

// --- otps ---
export const otps = pgTable("otps", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
  otp: text("otp").notNull(),
  expiredAt: timestamp("expired_at", { withTimezone: true }).notNull(),
});
