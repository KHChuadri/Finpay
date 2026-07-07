import { groupService } from "../modules/group/group.container";

interface RecipientType {
  email: string;
  walletInfo: string[];
}

/**
 * <Withdraw/Pay From Group Wallet To User Wallet>
 *
 * @param {string} debtorWalletId
 * @param {string} groupId
 * @param {number} amountSrc
 * @param {number} amountDest
 * @param {string} currencySource
 * @param {string} currencyDest
 * @returns {
 *   success: boolean,
 *   message: string,
 *   debtorWalletId: string,
 *   creditorWalletId: string,
 *   amountTransferred: string,
 *   newDebtorBalance: string,
 *   newCreditorBalance: string,
 * } object containing transaction informations
 */
export const withdraw = async (
  creditorInfo: RecipientType,
  groupId: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) => {
  return groupService.withdraw({
    creditorInfo,
    groupId,
    amountSrc,
    amountDest,
    currencySource,
    currencyDest,
  });
};
