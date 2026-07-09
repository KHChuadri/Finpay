import { getDb } from "../../../lib/db";
import { users, notifications } from "../../db/schema";
import { eq, and, gt, inArray } from "drizzle-orm";
import type {
  INotificationRepository,
  LeanNotification,
  UserNotificationInfo,
} from "./notification.types";

// Legacy `.lean()` doc shape: expose `_id` (uuid) and drop `__v`.
const withId = <T extends { id: string }>(r: T): Record<string, unknown> => {
  const { id, ...rest } = r;
  return { _id: id, ...rest };
};

export const notificationRepository: INotificationRepository = {
  async findUserNotificationInfo(userId): Promise<UserNotificationInfo | null> {
    const [u] = await getDb()
      .select({ id: users.id, lastNotificationSeen: users.lastNotificationSeen })
      .from(users)
      .where(eq(users.id, userId));
    if (!u) return null;
    // Normalized: notifications derive from notifications.receiver.
    const rows = await getDb()
      .select({ id: notifications.id })
      .from(notifications)
      .where(eq(notifications.receiver, userId));
    return {
      id: u.id,
      notificationIds: rows.map((r) => r.id),
      lastNotificationSeen: u.lastNotificationSeen ?? new Date(0),
    };
  },

  async hasNewNotification(notificationIds, since) {
    if (notificationIds.length === 0) return false;
    const [found] = await getDb()
      .select({ id: notifications.id })
      .from(notifications)
      .where(and(inArray(notifications.id, notificationIds), gt(notifications.createdAt, since)))
      .limit(1);
    return found != null;
  },

  async findNotificationsByIds(notificationIds): Promise<LeanNotification[]> {
    if (notificationIds.length === 0) return [];
    const rows = await getDb()
      .select()
      .from(notifications)
      .where(inArray(notifications.id, notificationIds));

    // Populate sender/receiver as sub-documents, matching legacy `.populate()`.
    const userIds = Array.from(
      new Set(rows.flatMap((r) => [r.sender, r.receiver]))
    );
    const userRows = userIds.length
      ? await getDb().select().from(users).where(inArray(users.id, userIds))
      : [];
    const byId = new Map(userRows.map((u) => [u.id, withId(u)]));

    return rows.map((r) => ({
      _id: r.id,
      type: r.type,
      description: r.description,
      sender: byId.get(r.sender) ?? null,
      receiver: byId.get(r.receiver) ?? null,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  },

  async markNotificationsSeen(userId) {
    await getDb()
      .update(users)
      .set({ lastNotificationSeen: new Date() })
      .where(eq(users.id, userId));
  },
};
