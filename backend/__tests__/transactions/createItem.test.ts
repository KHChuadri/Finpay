import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import axios from "axios";
import { UUID } from "mongodb";
import HttpError from "http-errors";
import { createItem } from "../../src/bankIntegration/createItem";
import TransactionItem from "../../model/TransactionItem";
import User from "../../model/User";
import WalletInfo from "../../model/WalletInfo";
import type { Types } from "mongoose";
import mongoose from "mongoose";

vi.mock("axios");
vi.mock("../../model/TransactionItem");
vi.mock("../../model/User");
vi.mock("../../model/WalletInfo");
vi.mock("mongodb", () => ({
  UUID: vi.fn(),
}));

interface MockUser {
  _id: Types.ObjectId;
  firstName: string;
  lastName: string;
  depositId: string;
  save: () => Promise<void>;
}

interface MockWallet {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  walletBalance: number;
  walletCurrency: string;
  save: () => Promise<void>;
}

interface MockTransactionItem {
  _id: Types.ObjectId;
  transactionType: string;
  userId: Types.ObjectId;
  transactionId: string;
  amount: number;
  depositId: string;
  date: Date;
  currency: string;
  name: string;
  save: () => Promise<void>;
}

const createMockUser = (overrides?: Partial<MockUser>): MockUser => {
  return {
    _id: new mongoose.Types.ObjectId(),
    firstName: "John",
    lastName: "Doe",
    depositId: "deposit-123",
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

const createMockWallet = (overrides?: Partial<MockWallet>): MockWallet => {
  return {
    _id: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    walletBalance: 1000,
    walletCurrency: "AUD",
    save: vi.fn().mockResolvedValue(undefined),
    ...overrides,
  };
};

const createMockTransactionItem = (
  data?: Partial<MockTransactionItem>
): MockTransactionItem => {
  return {
    _id: new mongoose.Types.ObjectId(),
    transactionType: "Deposit",
    userId: new mongoose.Types.ObjectId(),
    transactionId: "txn-uuid-123",
    amount: 100,
    depositId: "deposit-123",
    date: expect.anything(),
    currency: "AUD",
    name: "John Doe",
    save: vi.fn().mockResolvedValue(undefined),
    ...data,
  };
};

describe("createItem - Unit Tests", () => {
  const validUserId = "507f1f77bcf86cd799439011";
  const validTransactionToken = "valid-token-123";
  const mockUUID = "uuid-12345";

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, "error").mockImplementation(() => {});
    vi.mocked(UUID).mockReturnValue(mockUUID as never);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful Item Creation", () => {
    it("should create a withdrawal request successfully", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet({ walletBalance: 500 });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

      const mockTransactionItem = createMockTransactionItem();
      vi.mocked(TransactionItem).mockImplementation(
        () => mockTransactionItem as never
      );

      const result = await createItem(
        validUserId,
        "Withdraw-Request",
        100,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(result).toEqual({
        message: "Item Created",
      });

      expect(mockWallet.walletBalance).toBe(400);
      expect(mockWallet.save).toHaveBeenCalledTimes(1);
      expect(mockTransactionItem.save).toHaveBeenCalledTimes(1);
    });

    it("should create a deposit request successfully", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet({ walletBalance: 500 });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

      const mockTransactionItem = createMockTransactionItem();
      vi.mocked(TransactionItem).mockImplementation(
        () => mockTransactionItem as never
      );

      const result = await createItem(
        validUserId,
        "Deposit-Request",
        200,
        "buyer-456",
        "seller-456",
        validTransactionToken
      );

      expect(result).toEqual({
        message: "Item Created",
      });

      expect(mockWallet.walletBalance).toBe(500);
      expect(mockWallet.save).not.toHaveBeenCalled();
      expect(mockTransactionItem.save).toHaveBeenCalledTimes(1);
    });

    it("should generate unique transaction ID when collision occurs", async () => {
      const firstUUID = "uuid-1";
      const secondUUID = "uuid-2";

      vi.mocked(UUID)
        .mockReturnValueOnce(firstUUID as never)
        .mockReturnValueOnce(secondUUID as never);

      const mockUser = createMockUser();
      const mockWallet = createMockWallet();
      const existingTransaction = { transactionId: firstUUID };

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne)
        .mockResolvedValueOnce(existingTransaction as never)
        .mockResolvedValueOnce(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
      vi.mocked(TransactionItem).mockImplementation(
        () => createMockTransactionItem() as never
      );

      await createItem(
        validUserId,
        "Deposit-Request",
        100,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(UUID).toHaveBeenCalledTimes(2);
      expect(axios.post).toHaveBeenCalledWith(
        "https://test.api.promisepay.com/items",
        expect.objectContaining({
          amount: 10000,
          buyer_id: "buyer-123",
          description: "deposit-123",
          name: "Deposit-Request",
          payment_type: "2",
          seller_id: "seller-123",
          id: expect.anything(),
        }),
        expect.any(Object)
      );
    });
  });

  describe("Error Cases", () => {
    it("should throw 404 when user not found", async () => {
      vi.mocked(User.findById).mockResolvedValue(null);

      await expect(
        createItem(
          "nonExistentUser",
          "Withdraw-Request",
          100,
          "buyer-123",
          "seller-123",
          validTransactionToken
        )
      ).rejects.toThrow(HttpError(404, "User user not found"));

      expect(WalletInfo.findOne).not.toHaveBeenCalled();
      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should throw 404 when wallet not found", async () => {
      const mockUser = createMockUser();
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(null);

      await expect(
        createItem(
          validUserId,
          "Withdraw-Request",
          100,
          "buyer-123",
          "seller-123",
          validTransactionToken
        )
      ).rejects.toThrow(HttpError(404, "user main wallet not found"));

      expect(axios.post).not.toHaveBeenCalled();
    });

    it("should throw 400 for insufficient balance on withdrawal", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet({ walletBalance: 50 });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);

      await expect(
        createItem(
          validUserId,
          "Withdraw-Request",
          100,
          "buyer-123",
          "seller-123",
          validTransactionToken
        )
      ).rejects.toThrow(HttpError(400, "User Main Balance Is Insufficient"));

      expect(axios.post).not.toHaveBeenCalled();
      expect(TransactionItem).not.toHaveBeenCalled();
    });

    it("should not check balance for deposit requests", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet({ walletBalance: 0 });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
      vi.mocked(TransactionItem).mockImplementation(
        () => createMockTransactionItem() as never
      );

      const result = await createItem(
        validUserId,
        "Deposit-Request",
        1000,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(result.message).toBe("Item Created");
      expect(axios.post).toHaveBeenCalled();
    });

    it("should handle axios API errors", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet();

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockRejectedValue(
        new Error("API Error: Invalid token")
      );

      await expect(
        createItem(
          validUserId,
          "Withdraw-Request",
          100,
          "buyer-123",
          "seller-123",
          "invalid-token"
        )
      ).rejects.toThrow("API Error: Invalid token");

      expect(TransactionItem).not.toHaveBeenCalled();
      expect(mockWallet.save).not.toHaveBeenCalled();
    });

    it("should handle database save errors", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet();

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

      const mockTransactionItem = createMockTransactionItem({
        save: vi.fn().mockRejectedValue(new Error("Database error")),
      });
      vi.mocked(TransactionItem).mockImplementation(
        () => mockTransactionItem as never
      );

      await expect(
        createItem(
          validUserId,
          "Withdraw-Request",
          100,
          "buyer-123",
          "seller-123",
          validTransactionToken
        )
      ).rejects.toThrow("Database error");
    });
  });

  describe("Edge Cases", () => {
    it("should handle decimal amounts correctly", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet({ walletBalance: 1000.5 });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
      vi.mocked(TransactionItem).mockImplementation(
        () => createMockTransactionItem() as never
      );

      await createItem(
        validUserId,
        "Withdraw-Request",
        100.75,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount: 10075,
        }),
        expect.any(Object)
      );

      expect(mockWallet.walletBalance).toBeCloseTo(899.75); 
    });

    it("should handle zero amount", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet();

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
      vi.mocked(TransactionItem).mockImplementation(
        () => createMockTransactionItem() as never
      );

      await createItem(
        validUserId,
        "Deposit-Request",
        0,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount: 0,
        }),
        expect.any(Object)
      );
    });

    it("should handle users with special characters in names", async () => {
      const mockUser = createMockUser({
        firstName: "O'Neill",
        lastName: "Van-Der Berg",
      });
      const mockWallet = createMockWallet();

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

      let capturedTransactionData: unknown;
      vi.mocked(TransactionItem).mockImplementation((data) => {
        capturedTransactionData = data;
        return createMockTransactionItem() as never;
      });

      await createItem(
        validUserId,
        "Deposit-Request",
        100,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect((capturedTransactionData as MockTransactionItem).name).toBe(
        "O'Neill Van-Der Berg"
      );
    });

    it("should handle very large amounts", async () => {
      const largeAmount = 999999999;
      const mockUser = createMockUser();
      const mockWallet = createMockWallet({
        walletBalance: largeAmount + 1000,
      });

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });
      vi.mocked(TransactionItem).mockImplementation(
        () => createMockTransactionItem() as never
      );

      await createItem(
        validUserId,
        "Withdraw-Request",
        largeAmount,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(axios.post).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          amount: largeAmount * 100,
        }),
        expect.any(Object)
      );

      expect(mockWallet.walletBalance).toBe(1000);
    });

    it("should handle unknown request types", async () => {
      const mockUser = createMockUser();
      const mockWallet = createMockWallet();

      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.mocked(WalletInfo.findOne).mockResolvedValue(mockWallet);
      vi.mocked(TransactionItem.findOne).mockResolvedValue(null);
      vi.mocked(axios.post).mockResolvedValue({ data: { success: true } });

      const result = await createItem(
        validUserId,
        "Unknown-Request-Type",
        100,
        "buyer-123",
        "seller-123",
        validTransactionToken
      );

      expect(axios.post).toHaveBeenCalled();
      expect(result.message).toBe("Item Created");

      expect(TransactionItem).not.toHaveBeenCalled();
      expect(mockWallet.save).not.toHaveBeenCalled();
    });
  });
});
