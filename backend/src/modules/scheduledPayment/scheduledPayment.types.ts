import type { PaymentJobData } from "../../../types/payment.types";

export interface InitiateScheduledPaymentInput {
  debtorUserId: string;
  creditorUserEmail: string;
  scheduledDate: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
}

export interface InitiateScheduledPaymentResult {
  success: true;
  message: string;
  paymentId: string;
  date: string;
}

export interface CancelScheduledPaymentResult {
  success: true;
  message: string;
}

export interface ScheduledPaymentListItem {
  _id: string;
  debtorId: string;
  debtorEmail: string;
  creditorId: string;
  creditorEmail: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
  scheduledDate: Date;
}

export interface GetScheduledPaymentsResult {
  scheduledPayment: ScheduledPaymentListItem[];
  currentPage: number;
  totalPayments: number;
  totalPages: number;
}

export interface UserBasic {
  id: string;
  email: string;
}

export interface CreatedScheduledPayment {
  id: string;
  debtorId: string;
  creditorId: string;
}

export interface PendingScheduledPayment {
  id: string;
  debtorId: string;
  creditorId: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
  scheduledDate: Date;
}

export interface ScheduledPaymentForCancel {
  id: string;
  debtorId: string;
  status: string;
  jobId?: string;
  amountSrc: number;
  currencySrc: string;
}

export interface CreatePaymentInput {
  debtorId: string;
  creditorId: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
  scheduledDate: string;
}

export interface IScheduledPaymentRepository {
  findUserById(id: string): Promise<UserBasic | null>;
  findUserByEmail(email: string): Promise<UserBasic | null>;
  createPayment(input: CreatePaymentInput): Promise<CreatedScheduledPayment>;
  updateJobId(paymentId: string, jobId: string): Promise<void>;
  findWalletByUserAndCurrency(
    userId: string,
    currency: string
  ): Promise<{ id: string; walletBalance: number } | null>;
  debitWalletById(walletId: string, amount: number): Promise<void>;
  findPaymentById(paymentId: string): Promise<ScheduledPaymentForCancel | null>;
  deletePaymentById(paymentId: string): Promise<void>;
  /** No-op if no matching wallet, matching legacy findOneAndUpdate semantics. */
  creditWallet(userId: string, currency: string, amount: number): Promise<void>;
  /** Counts ALL of the debtor's payments regardless of status (matches legacy). */
  countPaymentsByDebtor(userId: string): Promise<number>;
  findPendingPaymentsByDebtor(
    userId: string,
    skip: number,
    limit: number
  ): Promise<PendingScheduledPayment[]>;
}

export interface ScheduledPaymentQueueDeps {
  add: (
    name: string,
    data: PaymentJobData,
    opts: { delay: number; jobId: string }
  ) => Promise<{ id?: string }>;
  getJob: (
    jobId: string
  ) => Promise<{ remove: () => Promise<void> } | null | undefined>;
}

export interface ScheduledPaymentServiceDeps {
  repo: IScheduledPaymentRepository;
  /** Injected BullMQ queue (or compatible fake) — the service never imports bullmq/express. */
  queue: ScheduledPaymentQueueDeps;
}
