// Legacy entry point retained during the strangler migration.
// Delegates to the layered transaction service so existing callers/tests are unaffected.
import { transactionService } from "../modules/transaction/transaction.container";

export const p2pTransfer = async (
  debtorUserId: string,
  creditorEmail: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) =>
  transactionService.transfer({
    debtorUserId,
    creditorEmail,
    amountSrc,
    amountDest,
    currencySource,
    currencyDest,
  });
