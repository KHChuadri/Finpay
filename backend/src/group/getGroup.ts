import { groupService } from "../modules/group/group.container";

/**
 * <Get information for 1 group based on groupId>
 *
 * @param {string} groupId
 * @returns {
 * members: UserType[];
 * transactionHistory: TransactionHistoryType[];
 * admin: UserType;
 * groupName: string;
 * description: string | null;
 * walletCurrency: string;
 * walletBalance: number;
 * } Object Containing Group Information
 */
export const getGroup = async (groupId: string) => {
  return groupService.getGroup(groupId);
};
