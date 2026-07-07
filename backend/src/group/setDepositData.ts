import { groupService } from "../modules/group/group.container";
import type { DepositWebhookPayload } from "../modules/group/group.types";

/**
 * <Handles Finalisation of Withdraw and Deposit Requests>
 *
 * @param {Object Of Zai Item Response} depositData (Object response caught by webhook)
 * @returns {depositId: string} object containing transaction history id
 */
export const setDepositData = async (depositData: DepositWebhookPayload) => {
  return groupService.setDepositData(depositData);
};
