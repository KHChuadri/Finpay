import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import HTTPError from "http-errors";
import { UUID } from "mongodb";
import { register } from "../../src/auth/register";
import User from "../../model/User";
import WalletInfo from "../../model/WalletInfo";
import { Types } from "mongoose";

type IdLike = string | Types.ObjectId;
type SaveFn = () => Promise<unknown>;

type UserInit = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  passwordLength: number;
  walletInfo: string[];
  tokens: string[];
  depositId: string;
};

type WalletInit = {
  walletCurrency: "AUD";
  walletBalance: number;
  userId: string;
};

interface MockUserDoc {
  _id: IdLike;
  email: string;
  walletInfo: string[];
  tokens: string[];
  save: SaveFn;
}

interface MockWalletDoc {
  _id: IdLike;
  save: SaveFn;
}

type UserCtor = new (...args: unknown[]) => MockUserDoc;
type WalletCtor = new (...args: unknown[]) => MockWalletDoc;
type UUIDCtor = new () => { toString(): string };

vi.mock("bcrypt");
vi.mock("jsonwebtoken");
vi.mock("../../model/User");
vi.mock("../../model/WalletInfo");
vi.mock("mongodb", () => ({
  UUID: vi.fn(),
}));

describe("Register Service", () => {
  const mockUserInput = {
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    password: "SecurePass123!",
  };

  const mockUserId = "507f1f77bcf86cd799439011";
  const mockWalletId = "507f1f77bcf86cd799439012";
  const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
  const mockHashedPassword = "$2b$10$hashedpassword...";
  const mockDepositId = "uuid-deposit-123";

  beforeEach(() => {
    vi.clearAllMocks();

    process.env.JWT_SECRET = "test-secret-key";

    vi.mocked(bcrypt.hash).mockResolvedValue(mockHashedPassword as never);
    vi.mocked(jwt.sign).mockReturnValue(mockToken as never);
    vi.mocked(UUID as unknown as UUIDCtor).mockImplementation(() => {
      return { toString: () => mockDepositId };
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Registration", () => {
    it("should successfully register a new user with all components", async () => {
      const mockSavedUser: MockUserDoc = {
        _id: new Types.ObjectId(mockUserId),
        email: mockUserInput.email,
        walletInfo: [],
        tokens: [],
        save: vi.fn().mockResolvedValue(true),
      };

      const mockSavedWallet: MockWalletDoc = {
        _id: new Types.ObjectId(mockWalletId),
        save: vi.fn().mockResolvedValue(true),
      };

      const walletPushSpy = vi.spyOn(mockSavedUser.walletInfo, "push");
      const tokenPushSpy = vi.spyOn(mockSavedUser.tokens, "push");

      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        () => mockSavedUser
      );

      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(
        () => mockSavedWallet
      );

      const result = await register(
        mockUserInput.firstName,
        mockUserInput.lastName,
        mockUserInput.email,
        mockUserInput.password
      );

      expect(result).toEqual({
        token: mockToken,
        userId: mockUserId.toString(),
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(mockUserInput.password, 10);

      expect(User).toHaveBeenCalledWith({
        firstName: mockUserInput.firstName,
        lastName: mockUserInput.lastName,
        email: mockUserInput.email,
        password: mockHashedPassword,
        passwordLength: mockUserInput.password.length,
        walletInfo: [],
        tokens: [],
        depositId: mockDepositId,
      });

      expect(WalletInfo).toHaveBeenCalledWith({
        walletCurrency: "AUD",
        walletBalance: 100,
        userId: new Types.ObjectId(mockUserId),
      });

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: new Types.ObjectId(mockUserId), email: mockUserInput.email },
        "test-secret-key"
      );

      expect(mockSavedUser.save).toHaveBeenCalledTimes(3);
      expect(mockSavedWallet.save).toHaveBeenCalledTimes(1);
      const pushedId = walletPushSpy.mock.calls[0][0];
      expect(pushedId).toBeInstanceOf(Types.ObjectId);
      expect(String(pushedId)).toBe(mockWalletId);
      expect(tokenPushSpy).toHaveBeenCalledWith(mockToken);
    });

    it("should generate unique deposit ID when collision occurs", async () => {
      const firstDepositId = "uuid-1";
      const secondDepositId = "uuid-2";

      vi.mocked(UUID as unknown as UUIDCtor)
        .mockImplementationOnce(() => {
          return { toString: () => firstDepositId };
        })
        .mockImplementationOnce(() => {
          return { toString: () => secondDepositId };
        });

      const existingUser = { depositId: firstDepositId };

      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(existingUser)
        .mockResolvedValueOnce(null);

      const mockSavedUser = {
        _id: mockUserId,
        email: mockUserInput.email,
        walletInfo: [],
        tokens: [],
        save: vi.fn().mockResolvedValue(true),
      };

      const mockSavedWallet = {
        _id: mockWalletId,
        save: vi.fn().mockResolvedValue(true),
      };

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        () => mockSavedUser
      );
      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(
        () => mockSavedWallet
      );

      await register(
        mockUserInput.firstName,
        mockUserInput.lastName,
        mockUserInput.email,
        mockUserInput.password
      );

      expect(UUID).toHaveBeenCalledTimes(2);
      expect(User).toHaveBeenCalledWith(
        expect.objectContaining({
          depositId: secondDepositId,
        })
      );
    });
  });

  describe("Error Handling", () => {
    it("should throw error when email already exists", async () => {
      const existingUser = {
        _id: "existing-user-id",
        email: mockUserInput.email,
      };

      vi.mocked(User.findOne).mockResolvedValueOnce(existingUser);

      await expect(
        register(
          mockUserInput.firstName,
          mockUserInput.lastName,
          mockUserInput.email,
          mockUserInput.password
        )
      ).rejects.toThrow(HTTPError(400, "Corresponding email has been used."));

      expect(User).not.toHaveBeenCalled();
      expect(WalletInfo).not.toHaveBeenCalled();
      expect(jwt.sign).not.toHaveBeenCalled();
    });

    it("should handle bcrypt hashing failure", async () => {
      vi.mocked(bcrypt.hash).mockRejectedValue(new Error("Hashing failed"));

      await expect(
        register(
          mockUserInput.firstName,
          mockUserInput.lastName,
          mockUserInput.email,
          mockUserInput.password
        )
      ).rejects.toThrow("Hashing failed");

      expect(User.findOne).not.toHaveBeenCalled();
    });

    it("should handle user save failure", async () => {
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const mockFailingUser = {
        _id: mockUserId,
        email: mockUserInput.email,
        walletInfo: [],
        tokens: [],
        save: vi.fn().mockRejectedValue(new Error("Database save failed")),
      };

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        () => mockFailingUser
      );

      await expect(
        register(
          mockUserInput.firstName,
          mockUserInput.lastName,
          mockUserInput.email,
          mockUserInput.password
        )
      ).rejects.toThrow("Database save failed");

      expect(WalletInfo).not.toHaveBeenCalled();
    });

    it("should handle wallet creation failure", async () => {
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      const mockSavedUser = {
        _id: mockUserId,
        email: mockUserInput.email,
        walletInfo: [],
        tokens: [],
        save: vi.fn().mockResolvedValue(true),
      };

      const mockFailingWallet = {
        _id: mockWalletId,
        save: vi.fn().mockRejectedValue(new Error("Wallet save failed")),
      };

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        () => mockSavedUser
      );
      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(
        () => mockFailingWallet
      );

      await expect(
        register(
          mockUserInput.firstName,
          mockUserInput.lastName,
          mockUserInput.email,
          mockUserInput.password
        )
      ).rejects.toThrow("Wallet save failed");

      expect(mockSavedUser.save).toHaveBeenCalledTimes(1);
      expect(jwt.sign).not.toHaveBeenCalled();
    });
  });

  describe("Data Integrity", () => {
    it.each([
      "Short1!",
      "MediumPass123!",
      "VeryLongPasswordWith$pecialChars123!",
    ])("should store correct password length for %s", async (password) => {
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let capturedUserData: UserInit | undefined;

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        (data?: unknown) => {
          capturedUserData = data as UserInit;
          return {
            _id: new Types.ObjectId(mockUserId),
            email: (data as UserInit).email,
            walletInfo: [],
            tokens: [],
            save: vi.fn().mockResolvedValue(true),
          };
        }
      );

      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(() => {
        return {
          _id: new Types.ObjectId(mockWalletId),
          save: vi.fn().mockResolvedValue(true),
        };
      });

      await register(
        "John",
        "Doe",
        `test${password.length}@example.com`,
        password
      );

      expect(capturedUserData?.passwordLength).toBe(password.length);
    });

    it("should initialize user with empty arrays for walletInfo and tokens", async () => {
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let capturedUserData: UserInit | undefined;

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        (data?: unknown) => {
          capturedUserData = data as UserInit;
          return {
            _id: new Types.ObjectId(mockUserId),
            email: (data as UserInit).email,
            walletInfo: [],
            tokens: [],
            save: vi.fn().mockResolvedValue(true),
          };
        }
      );

      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(() => {
        return {
          _id: new Types.ObjectId(mockWalletId),
          save: vi.fn().mockResolvedValue(true),
        };
      });

      await register(
        mockUserInput.firstName,
        mockUserInput.lastName,
        mockUserInput.email,
        mockUserInput.password
      );

      expect(capturedUserData?.walletInfo).toEqual([]);
      expect(capturedUserData?.tokens).toEqual([]);
    });

    it("should create AUD wallet with 100 balance", async () => {
      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        (data?: unknown) => {
          return {
            _id: new Types.ObjectId(mockUserId),
            email: (data as UserInit).email,
            walletInfo: [],
            tokens: [],
            save: vi.fn().mockResolvedValue(true),
          };
        }
      );

      let capturedWalletData: WalletInit | undefined;

      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(
        (data?: unknown) => {
          capturedWalletData = data as WalletInit;
          return {
            _id: new Types.ObjectId(mockWalletId),
            save: vi.fn().mockResolvedValue(true),
          };
        }
      );

      await register(
        mockUserInput.firstName,
        mockUserInput.lastName,
        mockUserInput.email,
        mockUserInput.password
      );

      expect(capturedWalletData).toMatchObject({
        walletCurrency: "AUD",
        walletBalance: 100,
      });
      expect(String(capturedWalletData!.userId)).toBe(mockUserId);
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in user data", async () => {
      const specialCharData = {
        firstName: "O'Neill",
        lastName: "Van-Der Berg",
        email: "test+special@sub.example.com",
        password: "P@$$w0rd!123",
      };

      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let capturedUserData: UserInit | undefined;

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        (data?: unknown) => {
          capturedUserData = data as UserInit;
          return {
            _id: new Types.ObjectId(mockUserId),
            email: (data as UserInit).email,
            walletInfo: [],
            tokens: [],
            save: vi.fn().mockResolvedValue(true),
          };
        }
      );

      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(() => {
        return {
          _id: new Types.ObjectId(mockWalletId),
          save: vi.fn().mockResolvedValue(true),
        };
      });

      await register(
        specialCharData.firstName,
        specialCharData.lastName,
        specialCharData.email,
        specialCharData.password
      );

      expect(capturedUserData?.firstName).toBe(specialCharData.firstName);
      expect(capturedUserData?.lastName).toBe(specialCharData.lastName);
      expect(capturedUserData?.email).toBe(specialCharData.email);
    });

    it("should handle very long passwords", async () => {
      const veryLongPassword = "a".repeat(1000) + "A1!";

      vi.mocked(User.findOne)
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      vi.mocked(User as unknown as UserCtor).mockImplementation(
        (data?: unknown) => {
          return {
            _id: new Types.ObjectId(mockUserId),
            email: (data as UserInit).email,
            walletInfo: [],
            tokens: [],
            save: vi.fn().mockResolvedValue(true),
          };
        }
      );

      vi.mocked(WalletInfo as unknown as WalletCtor).mockImplementation(() => {
        return {
          _id: new Types.ObjectId(mockWalletId),
          save: vi.fn().mockResolvedValue(true),
        };
      });

      await expect(
        register("John", "Doe", "longpass@example.com", veryLongPassword)
      ).resolves.toEqual({
        token: mockToken,
        userId: mockUserId.toString(),
      });

      expect(bcrypt.hash).toHaveBeenCalledWith(veryLongPassword, 10);
    });
  });
});
