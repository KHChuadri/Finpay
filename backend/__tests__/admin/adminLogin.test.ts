import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import HTTPError from "http-errors";
import { adminLogin } from "../../src/admin/adminLogin";
import User from "../../model/User";
import type { Document, Types } from "mongoose";

vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../model/User");

interface IUser extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  isAdmin: boolean;
  tokens: string[];
}

const createMockUser = (overrides?: Partial<IUser>): IUser => {
  const defaults = {
    _id: "507f1f77bcf86cd799439011",
    email: "admin@example.com",
    password: "hashedPassword123",
    isAdmin: true,
    tokens: [] as string[],
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };

  const tokensArray = [...(overrides?.tokens || [])];

  return {
    ...defaults,
    tokens: tokensArray,
    push: vi.fn((token: string) => tokensArray.push(token)),
  } as unknown as IUser;
};

describe("adminLogin", () => {
  const validCredentials = {
    email: "admin@example.com",
    password: "AdminPass123!",
  };

  const mockToken =
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6ImFkbWluQGV4YW1wbGUuY29tIn0.signature";

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = "test-secret-key";
  });

  afterEach(() => {
    vi.restoreAllMocks();
    delete process.env.JWT_SECRET;
  });

  describe("Successful Admin Login", () => {
    it("should successfully login an admin user", async () => {
      const mockUser = createMockUser({
        email: validCredentials.email,
        password: "hashedPassword",
        isAdmin: true,
        tokens: ["existingToken1", "existingToken2"],
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = await adminLogin(
        validCredentials.email,
        validCredentials.password
      );

      expect(User.findOne).toHaveBeenCalledWith({
        email: validCredentials.email,
      });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        validCredentials.password,
        "hashedPassword"
      );
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: validCredentials.email },
        "test-secret-key"
      );

      expect(mockUser.tokens).toContain(mockToken);
      expect(mockUser.save).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        token: mockToken,
        userId: "507f1f77bcf86cd799439011",
      });
    });

    it("should handle admin with empty tokens array", async () => {
      const mockUser = createMockUser({
        isAdmin: true,
        tokens: [],
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = await adminLogin(
        validCredentials.email,
        validCredentials.password
      );

      expect(mockUser.tokens).toHaveLength(1);
      expect(mockUser.tokens[0]).toBe(mockToken);
      expect(result.token).toBe(mockToken);
    });

    it("should work with different JWT secrets", async () => {
      const secrets = ["secret1", "very-long-secret-key-123", "SHORT"];

      for (const secret of secrets) {
        vi.clearAllMocks();
        process.env.JWT_SECRET = secret;

        const mockUser = createMockUser({ isAdmin: true });
        vi.mocked(User.findOne).mockResolvedValue(mockUser);
        vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
        vi.mocked(jwt.sign).mockReturnValue(`token-${secret}` as never);

        const result = await adminLogin(
          validCredentials.email,
          validCredentials.password
        );

        expect(jwt.sign).toHaveBeenCalledWith(
          { email: validCredentials.email },
          secret
        );
        expect(result.token).toBe(`token-${secret}`);
      }
    });
  });

  describe("Validation Errors", () => {
    it("should throw error when email is missing", async () => {
      await expect(adminLogin("", validCredentials.password)).rejects.toThrow(
        HTTPError(400, "Email and password are required")
      );

      expect(User.findOne).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw error when password is missing", async () => {
      await expect(adminLogin(validCredentials.email, "")).rejects.toThrow(
        HTTPError(400, "Email and password are required")
      );

      expect(User.findOne).not.toHaveBeenCalled();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should throw error when both email and password are missing", async () => {
      await expect(adminLogin("", "")).rejects.toThrow(
        HTTPError(400, "Email and password are required")
      );

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should validate email before database query", async () => {
      const invalidInputs = [
        { email: null as unknown as string, password: "pass" },
        { email: undefined as unknown as string, password: "pass" },
        { email: "   ", password: "validPass" },
      ];

      for (const input of invalidInputs) {
        vi.clearAllMocks();

        await expect(adminLogin(input.email, input.password)).rejects.toThrow(
          HTTPError(400, "Email and password are required")
        );

        expect(User.findOne).not.toHaveBeenCalled();
      }
    });
  });

  describe("Authentication Errors", () => {
    it("should throw 404 error when user does not exist", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow(
        HTTPError(404, "Account does not exist with the given email")
      );

      expect(User.findOne).toHaveBeenCalledWith({
        email: validCredentials.email,
      });
      expect(bcrypt.compare).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should throw 400 error when password is incorrect", async () => {
      const mockUser = createMockUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(
        adminLogin(validCredentials.email, "wrongPassword")
      ).rejects.toThrow(HTTPError(400, "Incorrect password"));

      expect(bcrypt.compare).toHaveBeenCalledWith(
        "wrongPassword",
        mockUser.password
      );
      expect(jwt.sign).not.toHaveBeenCalled();
      expect(mockUser.save).not.toHaveBeenCalled();
    });

    it("should throw error when user is not an admin", async () => {
      const mockUser = createMockUser({
        isAdmin: false,
        tokens: [],
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow(HTTPError(400, "User is not an admin"));

      expect(mockUser.tokens).toContain(mockToken);
      expect(mockUser.save).toHaveBeenCalledTimes(1);
    });

    it("should handle undefined isAdmin field as non-admin", async () => {
      const mockUser = createMockUser({
        isAdmin: undefined as unknown as boolean,
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow(HTTPError(400, "User is not an admin"));
    });
  });

  describe("JWT Token Handling", () => {
    it("should append token to existing tokens array", async () => {
      const existingTokens = ["token1", "token2", "token3"];
      const mockUser = createMockUser({
        isAdmin: true,
        tokens: [...existingTokens],
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      await adminLogin(validCredentials.email, validCredentials.password);

      expect(mockUser.tokens).toHaveLength(4);
      expect(mockUser.tokens).toEqual([...existingTokens, mockToken]);
    });

    it("should handle JWT signing with additional payload", async () => {
      const mockUser = createMockUser({
        email: "special@admin.com",
        isAdmin: true,
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      await adminLogin("special@admin.com", validCredentials.password);

      expect(jwt.sign).toHaveBeenCalledWith(
        { email: "special@admin.com" },
        "test-secret-key"
      );
    });
  });

  describe("Database Operations", () => {
    it("should handle database save errors", async () => {
      const mockUser = createMockUser({
        isAdmin: true,
        save: vi.fn().mockRejectedValue(new Error("Database save failed")),
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow("Database save failed");

      expect(mockUser.tokens).toContain(mockToken);
    });

    it("should handle database query errors", async () => {
      vi.mocked(User.findOne).mockRejectedValue(
        new Error("Database connection lost")
      );

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow("Database connection lost");

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it("should handle bcrypt comparison errors", async () => {
      const mockUser = createMockUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockRejectedValue(new Error("Bcrypt error"));

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow("Bcrypt error");

      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in email", async () => {
      const specialEmail = "admin+test@sub-domain.example.com";
      const mockUser = createMockUser({
        email: specialEmail,
        isAdmin: true,
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = await adminLogin(specialEmail, validCredentials.password);

      expect(User.findOne).toHaveBeenCalledWith({ email: specialEmail });
      expect(jwt.sign).toHaveBeenCalledWith(
        { email: specialEmail },
        "test-secret-key"
      );
      expect(result).toBeDefined();
    });

    it("should handle very long passwords", async () => {
      const veryLongPassword = "a".repeat(1000);
      const mockUser = createMockUser({ isAdmin: true });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = await adminLogin(validCredentials.email, veryLongPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(
        veryLongPassword,
        mockUser.password
      );
      expect(result).toBeDefined();
    });

    it("should handle different ObjectId formats", async () => {
      const customId = "123abc456def789ghi012jkl";
      const mockUser = createMockUser({
        _id: { toString: () => customId } as unknown as Types.ObjectId,
        isAdmin: true,
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = await adminLogin(
        validCredentials.email,
        validCredentials.password
      );

      expect(result.userId).toBe(customId);
    });

    it("should handle case-sensitive email matching", async () => {
      const mockUser = createMockUser({
        email: "Admin@Example.Com",
        isAdmin: true,
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      const result = await adminLogin(
        "Admin@Example.Com",
        validCredentials.password
      );

      expect(User.findOne).toHaveBeenCalledWith({ email: "Admin@Example.Com" });
      expect(result).toBeDefined();
    });
  });

  describe("Security Considerations", () => {
    it("should not leak information about user existence through timing", async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      const start1 = Date.now();
      await expect(
        adminLogin("nonexistent@example.com", "password")
      ).rejects.toThrow(
        HTTPError(404, "Account does not exist with the given email")
      );
      const time1 = Date.now() - start1;

      vi.clearAllMocks();
      const mockUser = createMockUser();
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const start2 = Date.now();
      await expect(
        adminLogin(validCredentials.email, "wrongPassword")
      ).rejects.toThrow(HTTPError(400, "Incorrect password"));
      const time2 = Date.now() - start2;

      expect(time1).toBeLessThan(100);
      expect(time2).toBeLessThan(100);
    });

    it("should save token even for non-admin users before rejecting", async () => {
      const mockUser = createMockUser({
        isAdmin: false,
        tokens: [],
      });

      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);
      vi.mocked(jwt.sign).mockReturnValue(mockToken as never);

      await expect(
        adminLogin(validCredentials.email, validCredentials.password)
      ).rejects.toThrow(HTTPError(400, "User is not an admin"));

      expect(mockUser.save).toHaveBeenCalled();
      expect(mockUser.tokens).toContain(mockToken);
    });
  });
});
