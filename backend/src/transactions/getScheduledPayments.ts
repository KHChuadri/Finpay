import mongoose from "mongoose";
import ScheduledPayment, {
  ScheduledPaymentType,
} from "../../model/ScheduledPayment";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Get Scheduled Payment object depends on the current page and limit per page>
 * 
 * @param {string} userId 
 * @param {return} page 
 * @param {return} limit 
 * @returns {scheduledPayment: List of scheduledPayment Object, currentPage: number, totalRequest: number,
 *  totalPages: number} Object containing list of scheduledPayment that will fit in a certain page
 */
export const getScheduledPayment = async (
  userId: string,
  page: number,
  limit: number
) => {
  const user = await User.findById(userId);

  if (!user) {
    throw HTTPError(404, "getScheduledPayment: User not found");
  }

  const skip = (page - 1) * limit;

  const totalDocuments = await ScheduledPayment.countDocuments({
    debtorId: new mongoose.Types.ObjectId(userId),
  });

  const payments = await ScheduledPayment.find({
    debtorId: new mongoose.Types.ObjectId(userId),
    status: "pending"
  })
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const scheduledPaymentList = await Promise.all(
    payments.map(async (payment: ScheduledPaymentType) => {
      const debtor = await User.findById(payment.debtorId).lean();
      const creditor = await User.findById(payment.creditorId).lean();

      return {
        _id: payment._id,
        debtorId: payment.debtorId,
        debtorEmail: debtor ? debtor.email : "Locked or deleted user",
        creditorId: payment.creditorId,
        creditorEmail: creditor ? creditor.email : "Locked or deleted user",
        amountSrc: payment.amountSrc,
        amountDest: payment.amountDest,
        currencySrc: payment.currencySrc,
        currencyDest: payment.currencyDest,
        scheduledDate: payment.scheduledDate,
      };
    })
  );

  const totalPages = Math.ceil(totalDocuments / limit);
  return {
    scheduledPayment: scheduledPaymentList,
    currentPage: page,
    totalPayments: totalDocuments,
    totalPages: totalPages,
  };
};
