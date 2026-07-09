import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { notificationRouter } from "../../../src/modules/notification/notification.routes";
import { createTestUser } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { notifications } from "../../../src/db/schema";

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(notificationRouter);
  return app;
};

describe("Notification routes", () => {
  let user: TestUser;
  let sender: TestUser;
  const lastNotificationSeen = new Date("2024-01-01T00:00:00.000Z");

  beforeEach(async () => {
    sender = await createTestUser({ email: "sender@test.com" });
    user = await createTestUser({
      email: "notification-routes@test.com",
      lastNotificationSeen,
    });
  });

  describe("GET /notification/new/:userId", () => {
    it("returns false when there is no notification newer than lastNotificationSeen", async () => {
      await getDb().insert(notifications).values({
        type: "Mission",
        description: "old",
        sender: sender.id,
        receiver: user.id,
        createdAt: new Date("2023-12-01T00:00:00.000Z"),
      });

      const res = await request(makeApp()).get(`/notification/new/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toBe(false);
    });

    it("returns true when a notification is newer than lastNotificationSeen", async () => {
      await getDb().insert(notifications).values({
        type: "Mission",
        description: "fresh",
        sender: sender.id,
        receiver: user.id,
        createdAt: new Date("2024-06-01T00:00:00.000Z"),
      });

      const res = await request(makeApp()).get(`/notification/new/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toBe(true);
    });

    it("returns 400 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp()).get(`/notification/new/${missingId}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "User not found or does not exist",
      });
    });
  });

  describe("GET /notification/:userId", () => {
    it("returns the raw, populated notification docs owned by the user", async () => {
      const [notification] = await getDb()
        .insert(notifications)
        .values({
          type: "Transfer",
          description: "you got paid",
          sender: sender.id,
          receiver: user.id,
          createdAt: new Date("2024-01-02T00:00:00.000Z"),
        })
        .returning();

      const res = await request(makeApp()).get(`/notification/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toHaveLength(1);
      const [returned] = res.body;
      // Locks the raw-doc shape: `_id`, not a flattened `id`.
      expect(returned._id).toBe(notification.id);
      expect(returned.id).toBeUndefined();
      expect(returned.type).toBe("Transfer");
      expect(returned.description).toBe("you got paid");
      // populate() resolves sender/receiver into full sub-documents.
      expect(returned.sender._id).toBe(sender.id);
      expect(returned.receiver._id).toBe(user.id);
    });

    it("returns 400 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp()).get(`/notification/${missingId}`);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({
        errorMsg: "User not found or does not exist",
      });
    });
  });

  describe("route ordering", () => {
    it("does not let /notification/:userId shadow /notification/new/:userId", async () => {
      const res = await request(makeApp()).get(`/notification/new/${user.id}`);

      expect(res.status).toBe(200);
      expect(typeof res.body).toBe("boolean");
    });
  });
});
