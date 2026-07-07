import { groupService } from "../modules/group/group.container";

export const topup = async (
  debtorWalletId: string,
  groupId: string,
  amountSrc: number,
  amountDest: number,
  currencySource: string,
  currencyDest: string
) => {
  return groupService.topup({
    debtorWalletId,
    groupId,
    amountSrc,
    amountDest,
    currencySource,
    currencyDest,
  });
};
