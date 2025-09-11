import Request from "../../model/Request";
import User from "../../model/User";
import HTTPError from "http-errors";

/**
 * <Delete Request by User>
 * 
 * @param {string} requestId 
 * @returns { success: boolean, message: string } object containing process status and "Request deleted successfully" message
 */
export const deleteRequest = async (requestId: string) => {
  const request = await Request.findById(requestId);
  if (!request) throw HTTPError(404, "Request not found");

  await Request.findByIdAndDelete(requestId);
  await User.findByIdAndUpdate(request.userId, {
    $pull: { request: requestId },
  });

  return { success: true, message: "Request deleted successfully" };
};
