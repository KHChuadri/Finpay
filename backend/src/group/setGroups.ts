import { groupService } from "../modules/group/group.container";

/**
 * <Create New Group>
 *
 * @param {string} groupName
 * @param {string} description
 * @param {string} creator
 * @param {string} currency
 * @returns {groupId: string} object containing new group id
 */
export const setGroup = async (
  groupName: string,
  description: string,
  creator: string,
  currency: string,
) => {
  return groupService.createGroup({
    groupName,
    description,
    creatorId: creator,
    currency,
  });
};
