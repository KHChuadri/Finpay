import Groups from "../../model/Groups";
import mongoose from "mongoose";
import HTTPError from "http-errors";
import TransactionHistory, {
  TransactionHistoryType,
} from "../../model/TransactionHistory";
import User, { UserType } from "../../model/User";

interface GroupResponse {
  members: UserType[];
  transactionHistory: TransactionHistoryType[];
  admin: UserType;
  groupName: string;
  description: string | null;
  walletCurrency: string;
  walletBalance: number;
}

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
export const getGroup = async (groupId: string): Promise<GroupResponse> => {
  const group = await Groups.findById(new mongoose.Types.ObjectId(groupId));

  if (!group) {
    throw HTTPError(404, "group not found");
  }

  const members: UserType[] = await User.find({ _id: { $in: group.members } });
  const transactionHistory: TransactionHistoryType[] =
    await TransactionHistory.find({ _id: { $in: group.transactionHistory } });
  const admin = await User.findById(group.admin);

  if (!admin) {
    throw HTTPError(404, "Admin user not found");
  }

  return {
    members,
    transactionHistory,
    admin,
    groupName: group.groupName,
    description: group.description || null,
    walletCurrency: group.walletCurrency,
    walletBalance: group.walletBalance,
  };
};
