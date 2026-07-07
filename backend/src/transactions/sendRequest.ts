// Legacy entry point retained during the strangler migration.
// Delegates to the layered request service so existing callers/tests are unaffected.
import { requestService } from "../modules/request/request.container";

export const sendRequest = async (
  email: string, // Requested user
  senderId: string, // Requester
  amount: number,
  currency: string,
  notes: string
) => requestService.sendRequest(email, senderId, amount, currency, notes);
