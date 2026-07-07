// Composition root for the request slice: wires the real repository and the
// injected cross-slice transfer dependency (the transaction slice's service).
import { createRequestService } from "./request.service";
import { requestRepository } from "./request.repository";
import { transactionService } from "../transaction/transaction.container";

export const requestService = createRequestService({
  repo: requestRepository,
  transfer: transactionService.transfer,
});
