// Legacy entry point retained during the strangler migration.
// Delegates to the layered request service so existing callers/tests are unaffected.
import { requestService } from "../modules/request/request.container";

export const acceptRequest = async (requestId: string) =>
  requestService.acceptRequest(requestId);
