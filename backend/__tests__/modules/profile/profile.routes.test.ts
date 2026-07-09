import { describe, it, expect, beforeEach, vi } from "vitest";
import request from "supertest";
import express from "express";
import { randomUUID } from "crypto";
import { Writable } from "stream";
import { profileRouter } from "../../../src/modules/profile/profile.routes";
import { createTestUser } from "../../helpers/testFactories";
import { getDb } from "../../../lib/db";
import { users, bioData, addresses } from "../../../src/db/schema";
import { eq } from "drizzle-orm";

const MOCK_SECURE_URL = "https://cloudinary.test/mock-kyc-image.jpg";

vi.mock("../../../lib/cloudinaryClient", () => ({
  default: {
    uploader: {
      upload_stream: (
        _options: unknown,
        callback: (error: unknown, result?: { secure_url: string }) => void
      ) => {
        const stream = new Writable({
          write(_chunk, _enc, cb) {
            cb();
          },
        });
        stream.on("finish", () => {
          callback(null, { secure_url: MOCK_SECURE_URL });
        });
        return stream;
      },
    },
  },
}));

type TestUser = Awaited<ReturnType<typeof createTestUser>>;

const makeApp = () => {
  const app = express();
  app.use(express.json());
  app.use(profileRouter);
  return app;
};

describe("Profile routes", () => {
  let user: TestUser;

  beforeEach(async () => {
    user = await createTestUser({ email: "profile-routes@test.com" });
  });

  describe("GET /user/profile/:userId", () => {
    it("returns the hand-flattened profile shape", async () => {
      const [address] = await getDb()
        .insert(addresses)
        .values({
          userId: user.id,
          addressLine1: "1 Main St",
          addressLine2: "Unit 2",
          country: "Australia",
        })
        .returning();
      const dob = new Date("1990-01-01");
      const [bio] = await getDb()
        .insert(bioData)
        .values({
          userId: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          dateOfBirth: dob,
          addressId: address.id,
        })
        .returning();
      await getDb().update(users).set({ bioDataId: bio.id }).where(eq(users.id, user.id));

      const res = await request(makeApp()).get(`/user/profile/${user.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        passwordLength: user.passwordLength,
        dob: dob.toISOString(),
        address: {
          addressLine1: "1 Main St",
          addressLine2: "Unit 2",
          country: "Australia",
        },
        isVerified: user.isVerified,
        isLocked: user.isLocked,
        KYCimg: null,
        profileImg: null,
        groups: [],
        rank: user.rank,
        exp: user.exp,
        depositId: user.depositId,
        accountType: user.accountType,
      });
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp()).get(`/user/profile/${missingId}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "User not found" });
    });
  });

  describe("PUT /user/profile/:userId", () => {
    it("updates a string field with no file", async () => {
      const res = await request(makeApp())
        .put(`/user/profile/${user.id}`)
        .send({ firstName: "Updated", lastName: "Name" });

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ message: "Profile updated" });

      const [updated] = await getDb().select().from(users).where(eq(users.id, user.id));
      expect(updated.firstName).toBe("Updated");
    });

    it("returns 404 when the user does not exist", async () => {
      const missingId = randomUUID();

      const res = await request(makeApp())
        .put(`/user/profile/${missingId}`)
        .send({ firstName: "Updated" });

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ errorMsg: "User not found" });
    });
  });

  describe("PUT /user/profile/upload-kyc", () => {
    it("uploads the KYC image and stores its URL", async () => {
      const res = await request(makeApp())
        .put("/user/profile/upload-kyc")
        .field("userId", user.id)
        .attach("kycImage", Buffer.from("fake-image-bytes"), "kyc.jpg");

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        success: true,
        imageUrl: MOCK_SECURE_URL,
      });

      const [updated] = await getDb().select().from(users).where(eq(users.id, user.id));
      expect(updated.kycImg).toBe(MOCK_SECURE_URL);
    });
  });
});
