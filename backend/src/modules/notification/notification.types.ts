export interface UserNotificationInfo {
  id: string;
  /** `null` mirrors the legacy `!Array.isArray(findUser.notification)` guard. */
  notificationIds: string[] | null;
  lastNotificationSeen: Date;
}

/** Populated notification doc keyed by `_id`, sender/receiver as sub-docs. */
export interface LeanNotification {
  _id: string;
  type: string;
  description: string | null;
  sender: Record<string, unknown> | null;
  receiver: Record<string, unknown> | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface INotificationRepository {
  findUserNotificationInfo(
    userId: string
  ): Promise<UserNotificationInfo | null>;
  hasNewNotification(
    notificationIds: string[],
    since: Date
  ): Promise<boolean>;
  /** Returns notification docs keyed by `_id`, sender/receiver populated. */
  findNotificationsByIds(
    notificationIds: string[]
  ): Promise<LeanNotification[]>;
  markNotificationsSeen(userId: string): Promise<void>;
}

export interface NotificationServiceDeps {
  repo: INotificationRepository;
}
