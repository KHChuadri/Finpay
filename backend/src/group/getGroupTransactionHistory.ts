import { groupService } from "../modules/group/group.container";

/**
 * <Get Group Transaction History from its group Id>
 *
 * @param {string} groupId
 * @returns List of History Object owned by the group
 */
export const getGroupTransactionHistory = async (groupId: string) => {
  return groupService.getGroupTransactionHistory(groupId);
};
