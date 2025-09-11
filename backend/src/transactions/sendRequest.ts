import HTTPError from "http-errors";
import Request from "../../model/Request";
import User from "../../model/User";

/**
 * <Create and Sends New Request To Target Email>
 * 
 * @param {string} email 
 * @param {string} senderId 
 * @param {number} amount 
 * @param {string} currency 
 * @param {string} notes 
 * @returns {requestId: string} object containing new request id
 */
export const sendRequest = async (
  email: string, // Requested user
  senderId: string, // Requester
  amount: number,
  currency: string,
  notes: string
) => {
  // Find recipient
  const sender = await User.findById(senderId);
  const recipient = await User.findOne({ email });

  if (!sender) {
    throw HTTPError(404, "User does not exists");
  }

  if (!recipient) {
    throw HTTPError(404, "Recipient not found.");
  }

  if (email == sender.email) {
    throw HTTPError(400, "Cannot send request to yourself");
  }

  if (amount <= 0) {
    throw HTTPError(400, "Amount must be greater than 0");
  }

  const newRequest = await Request.create({
    userId: recipient._id, // Requested user
    senderEmail: sender.email, // Requester
    currency: currency,
    amount: amount,
    notes: notes,
    date: new Date(),
  });

  recipient.request.push(newRequest._id);
  await recipient.save();

  return {
    requestId: newRequest._id,
  };
};
