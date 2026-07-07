import User from "../../../model/User";
import Notification from "../../../model/Notification";
import type {
  INotificationRepository,
  UserNotificationInfo,
} from "./notification.types";

export const notificationRepository: INotificationRepository = {
  async findUserNotificationInfo(
    userId
  ): Promise<UserNotificationInfo | null> {
    const doc = await User.findById(userId).lean();
    if (!doc) {
      return null;
    }

    return {
      id: String(doc._id),
      notificationIds: Array.isArray(doc.notification)
        ? doc.notification.map((id) => String(id))
        : null,
      lastNotificationSeen: doc.lastNotificationSeen,
    };
  },

  async hasNewNotification(notificationIds, since) {
    const found = await Notification.findOne({
      _id: { $in: notificationIds },
      createdAt: { $gt: since },
    }).lean();

    return found != null;
  },

  async findNotificationsByIds(notificationIds) {
    return Notification.find({ _id: { $in: notificationIds } })
      .populate("sender")
      .populate("receiver")
      .lean();
  },

  async markNotificationsSeen(userId) {
    await User.updateOne(
      { _id: userId },
      { lastNotificationSeen: new Date() }
    );
  },
};
