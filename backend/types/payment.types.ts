export interface PaymentJobData {
  paymentId: string;
  debtorId: string;
  creditorId: string;
  amountSrc: number;
  amountDest: number;
  currencySrc: string;
  currencyDest: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
  processedAt?: Date;
}