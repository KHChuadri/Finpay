import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import mongoose from "mongoose";
import HTTPError from "http-errors";
import { adminVerifyId } from "../../src/admin/adminVerifyId";
import User from "../../model/User";
import type { Document, Types } from "mongoose";

vi.mock("../../model/User");
vi.mock("mongoose", async () => {
  const actual = await vi.importActual<typeof mongoose>("mongoose");
  return {
    ...actual,
    Types: {
      ObjectId: vi.fn((id: string) => ({
        toString: () => id,
        equals: vi.fn(),
        _bsontype: "ObjectId",
      })),
    },
  };
});

interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  isVerified: boolean;
}

const createMockUser = (overrides?: Partial<IUser>): IUser => {
  const defaults = {
    _id: "507f1f77bcf86cd799439011",
    email: "user@example.com",
    isVerified: false,
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  return {
    ...defaults,
    toJSON: vi.fn().mockReturnValue(defaults),
    toObject: vi.fn().mockReturnValue(defaults),
    save: vi.fn().mockResolvedValue(defaults),
  } as unknown as IUser;
};

describe("adminVerifyId", () => {
  const validUserId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Verification", () => {
    it("should verify a user successfully (set to true)", async () => {
      const mockUser = createMockUser({
        isVerified: false,
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(validUserId, true);

      expect(User.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );
      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockUser);
    });

    it("should unverify a user successfully (set to false)", async () => {
      const mockUser = createMockUser({
        isVerified: true,
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(validUserId, false);

      expect(User.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );
      expect(mockUser.isVerified).toBe(false);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockUser);
    });

    it("should handle already verified user being verified again", async () => {
      const mockUser = createMockUser({
        isVerified: true,
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(validUserId, true);

      expect(mockUser.isVerified).toBe(true);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockUser);
    });

    it("should handle already unverified user being unverified again", async () => {
      const mockUser = createMockUser({
        isVerified: false,
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(validUserId, false);

      expect(mockUser.isVerified).toBe(false);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
      expect(result).toBe(mockUser);
    });

    it("should work with different valid MongoDB ObjectId formats", async () => {
      const differentIds = [
        "507f1f77bcf86cd799439011",
        "5f8d0d55b54764421b7156c9",
        "60b6c7f5f9d3e82a8c8b4567",
      ];

      for (const userId of differentIds) {
        vi.clearAllMocks();
        const mockUser = createMockUser();
        vi.mocked(User.findById).mockResolvedValue(mockUser);

        const result = await adminVerifyId(userId, true);

        expect(result).toBe(mockUser);
        expect(mockUser.save).toHaveBeenCalled();
      }
    });
  });

  describe("Error Cases", () => {
    it("should throw 404 error when user is not found", async () => {
      vi.mocked(User.findById).mockResolvedValue(null);

      await expect(adminVerifyId(validUserId, true)).rejects.toThrow(
        HTTPError(404, "User not found")
      );

      expect(User.findById).toHaveBeenCalledWith(
        expect.objectContaining({
          toString: expect.any(Function),
        })
      );
    });

    it("should handle database query errors", async () => {
      vi.mocked(User.findById).mockRejectedValue(
        new Error("Database connection failed")
      );

      await expect(adminVerifyId(validUserId, true)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should handle undefined/null as userId", async () => {
      vi.mocked(User.findById).mockRejectedValue(new Error("Invalid ObjectId"));

      await expect(
        adminVerifyId(null as unknown as string, true)
      ).rejects.toThrow();

      await expect(
        adminVerifyId(undefined as unknown as string, true)
      ).rejects.toThrow();
    });
  });

  describe("Return Value", () => {
    it("should return the updated user object", async () => {
      const mockUser = createMockUser({
        _id: { toString: () => validUserId } as unknown as Types.ObjectId,
        email: "test@example.com",
        isVerified: false,
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(validUserId, true);

      expect(result).toEqual(mockUser);
      expect(result.isVerified).toBe(true);
      expect(result.email).toBe("test@example.com");
    });

    it("should return user with all properties intact after update", async () => {
      const additionalProps = {
        firstName: "John",
        lastName: "Doe",
        createdAt: new Date("2024-01-01"),
        tokens: ["token1", "token2"],
      };

      const mockUser = createMockUser({
        isVerified: false,
        ...additionalProps,
      } as unknown as Partial<IUser>);

      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(validUserId, true);

      expect(result).toBe(mockUser);
      expect(result.isVerified).toBe(true);

      expect((result as unknown as typeof additionalProps).firstName).toBe(
        "John"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long userId strings", async () => {
      const longId = "5".repeat(24);
      const mockUser = createMockUser();
      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const result = await adminVerifyId(longId, true);

      expect(result).toBe(mockUser);
      expect(mockUser.save).toHaveBeenCalled();
    });

    it("should handle rapid successive calls", async () => {
      const mockUser = createMockUser({ isVerified: false });
      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const promises = [
        adminVerifyId(validUserId, true),
        adminVerifyId(validUserId, false),
        adminVerifyId(validUserId, true),
      ];

      const results = await Promise.all(promises);

      expect(results).toHaveLength(3);
      expect(User.findById).toHaveBeenCalledTimes(3);
      expect(mockUser.save).toHaveBeenCalledTimes(3);
    });

    it("should handle boolean-like values correctly", async () => {
      const mockUser = createMockUser({ isVerified: false });
      vi.mocked(User.findById).mockResolvedValue(mockUser);

      const testCases = [
        { value: true, expected: true },
        { value: false, expected: false },
        { value: Boolean(1), expected: true },
        { value: Boolean(0), expected: false },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        mockUser.isVerified = false;
        vi.mocked(User.findById).mockResolvedValue(mockUser);

        await adminVerifyId(validUserId, testCase.value);

        expect(mockUser.isVerified).toBe(testCase.expected);
      }
    });
  });
});
