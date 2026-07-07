import { notificationService } from "./modules/notification/notification.container";

/**
 * <Get user's Notification>
 *
 * @param {string} userId
 * @returns Array of Notification Object
 */
export const getNotification = async (userId: string) => {
  return notificationService.getNotificationList(userId);
};
