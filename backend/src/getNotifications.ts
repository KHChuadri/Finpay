import User from "../model/User";
import Notification from "../model/Notification";
import HTTPError from "http-errors";

/**
 * <Get user's Notification>
 * 
 * @param {string} userId 
 * @returns Array of Notification Object
 */
export const getNotification = async (userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  if (!Array.isArray(findUser.notification)) {
    throw HTTPError(400, "User has no Notification");
  }

  const notificationList = await Notification.find({
    _id: { $in: findUser.notification },
  })
    .populate("sender")
    .populate("receiver");

  findUser.lastNotificationSeen = new Date();
  findUser.save();

  return notificationList;
};
