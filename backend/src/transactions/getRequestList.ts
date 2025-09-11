import User from "../../model/User";
import Request from "../../model/Request";
import HTTPError from "http-errors";

/**
 * <get User's Request List>
 * 
 * @param {string} userId 
 * @returns { request: requestObjList } object containing array of request Object
 */
export const getRequestList = async (userId: string) => {
  const currUser = await User.findById(userId);

  if (!currUser) {
    throw HTTPError(404, "User does not exists");
  }

  const requestList = await Request.find({
    _id: { $in: currUser.request },
  });

  // Firstly find the user that send the request
  const requestListInfo = requestList.map((requestObj) => {
    return {
      requestId: requestObj._id,
      senderEmail: requestObj.senderEmail,
      requestDate: requestObj.date,
      amount: requestObj.amount,
      currency: requestObj.currency,
      notes: requestObj.notes,
    };
  });

  return { request: requestListInfo };
};
