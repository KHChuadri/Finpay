import User from "../model/User";
import Notification from "../model/Notification";
import HTTPError from "http-errors";

/**
 * <Check if user has new notification>
 * 
 * @param {string} userId 
 * @returns boolean if user has new notif
 */
export const checkNewNotification = async (userId: string) => {
  const findUser = await User.findById(userId);

  if (!findUser) {
    throw HTTPError(400, "User not found or does not exist");
  }

  if (!Array.isArray(findUser.notification)) {
    throw HTTPError(400, "User has no Notification");
  }

  const hasNew = await Notification.findOne({
    _id: { $in: findUser.notification },
    createdAt: { $gt: findUser.lastNotificationSeen },
  }).lean();

  if (hasNew) {
    return true;
  }

  return false;
};
