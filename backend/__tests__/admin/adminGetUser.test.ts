import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { adminGetUser } from "../../src/admin/adminGetUser";
import User from "../../model/User";
import type { Document, Types } from "mongoose";

vi.mock("../../model/User");

interface IBioData {
  firstName: string;
  lastName: string;
}

interface IUser extends Document {
  _id: Types.ObjectId;
  firstName?: string;
  lastName?: string;
  email: string;
  isLocked: boolean;
  isVerified: boolean;
  updatedAt: Date;
  KYCimg?: string;
  bioData?: IBioData;
}

const createMockUser = (overrides?: Partial<IUser>): IUser => {
  const defaults = {
    _id: "507f1f77bcf86cd799439011",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@example.com",
    isLocked: false,
    isVerified: true,
    updatedAt: new Date("2024-01-15T10:30:00Z"),
    KYCimg: "https://example.com/kyc/image123.jpg",
    createdAt: new Date("2024-01-01T00:00:00Z"),
    ...overrides,
  };

    return {
      ...defaults,
      toJSON: vi.fn().mockReturnValue(defaults),
      toObject: vi.fn().mockReturnValue(defaults),
      save: vi.fn().mockResolvedValue(defaults),
    } as unknown as IUser;
};

describe("adminGetUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Successful User Retrieval", () => {
    it("should retrieve users with pagination and populate bioData", async () => {
      const mockUsers = [
        createMockUser({
          _id: { toString: () => "user1" } as unknown as Types.ObjectId,
          firstName: "Alice",
          lastName: "Smith",
          email: "alice@example.com",
          isLocked: false,
          isVerified: true,
          updatedAt: new Date("2024-01-15T10:00:00Z"),
          KYCimg: "https://example.com/kyc/alice.jpg",
        }),
        createMockUser({
          _id: { toString: () => "user2" } as unknown as Types.ObjectId,
          firstName: "Bob",
          lastName: "Johnson",
          email: "bob@example.com",
          isLocked: true,
          isVerified: false,
          updatedAt: new Date("2024-01-16T11:00:00Z"),
          KYCimg: "https://example.com/kyc/bob.jpg",
        }),
        createMockUser({
          _id: { toString: () => "user3" } as unknown as Types.ObjectId,
          firstName: "Charlie",
          lastName: "Brown",
          email: "charlie@example.com",
          isLocked: false,
          isVerified: true,
          updatedAt: new Date("2024-01-17T12:00:00Z"),
          KYCimg: undefined,
        }),
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(50);

      const result = await adminGetUser(1, 10);

      expect(User.find).toHaveBeenCalledWith();
      expect(mockQuery.populate).toHaveBeenCalledWith(
        "bioData",
        "firstName lastName"
      );
      expect(mockQuery.skip).toHaveBeenCalledWith(0);
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(User.countDocuments).toHaveBeenCalled();

      expect(result).toEqual({
        users: [
          {
            firstName: "Alice",
            lastName: "Smith",
            userId: "user1",
            isLocked: false,
            isVerified: true,
            email: "alice@example.com",
            updatedAt: "2024-01-15T10:00:00.000Z",
            KYCimg: "https://example.com/kyc/alice.jpg",
          },
          {
            firstName: "Bob",
            lastName: "Johnson",
            userId: "user2",
            isLocked: true,
            isVerified: false,
            email: "bob@example.com",
            updatedAt: "2024-01-16T11:00:00.000Z",
            KYCimg: "https://example.com/kyc/bob.jpg",
          },
          {
            firstName: "Charlie",
            lastName: "Brown",
            userId: "user3",
            isLocked: false,
            isVerified: true,
            email: "charlie@example.com",
            updatedAt: "2024-01-17T12:00:00.000Z",
            KYCimg: undefined,
          },
        ],
        currentPage: 1,
        totalUsers: 50,
        totalPages: 5,
      });
    });

    it("should handle pagination correctly for different pages", async () => {
      const testCases = [
        { page: 1, limit: 10, expectedSkip: 0 },
        { page: 2, limit: 10, expectedSkip: 10 },
        { page: 3, limit: 20, expectedSkip: 40 },
        { page: 5, limit: 5, expectedSkip: 20 },
        { page: 10, limit: 15, expectedSkip: 135 },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const mockQuery = {
          populate: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(User.find).mockReturnValue(mockQuery as never);
        vi.mocked(User.countDocuments).mockResolvedValue(100);

        await adminGetUser(testCase.page, testCase.limit);

        expect(mockQuery.skip).toHaveBeenCalledWith(testCase.expectedSkip);
        expect(mockQuery.limit).toHaveBeenCalledWith(testCase.limit);
      }
    });

    it("should calculate total pages correctly", async () => {
      const testCases = [
        { totalUsers: 100, limit: 10, expectedPages: 10 },
        { totalUsers: 95, limit: 10, expectedPages: 10 },
        { totalUsers: 91, limit: 10, expectedPages: 10 },
        { totalUsers: 0, limit: 10, expectedPages: 0 },
        { totalUsers: 1, limit: 10, expectedPages: 1 },
        { totalUsers: 33, limit: 5, expectedPages: 7 },
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();

        const mockQuery = {
          populate: vi.fn().mockReturnThis(),
          skip: vi.fn().mockReturnThis(),
          limit: vi.fn().mockResolvedValue([]),
        };

        vi.mocked(User.find).mockReturnValue(mockQuery as never);
        vi.mocked(User.countDocuments).mockResolvedValue(testCase.totalUsers);

        const result = await adminGetUser(1, testCase.limit);

        expect(result.totalPages).toBe(testCase.expectedPages);
        expect(result.totalUsers).toBe(testCase.totalUsers);
      }
    });
  });

  describe("Handling Missing Data", () => {
    it("should handle users with missing firstName and lastName", async () => {
      const mockUsers = [
        createMockUser({
          _id: { toString: () => "user1" } as unknown as Types.ObjectId,
          firstName: undefined,
          lastName: undefined,
          email: "noname@example.com",
        }),
        createMockUser({
          _id: { toString: () => "user2" } as unknown as Types.ObjectId,
          firstName: "OnlyFirst",
          lastName: undefined,
          email: "onlyfirst@example.com",
        }),
        createMockUser({
          _id: { toString: () => "user3" } as unknown as Types.ObjectId,
          firstName: undefined,
          lastName: "OnlyLast",
          email: "onlylast@example.com",
        }),
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(3);

      const result = await adminGetUser(1, 10);

      expect(result.users[0].firstName).toBe("");
      expect(result.users[0].lastName).toBe("");
      expect(result.users[1].firstName).toBe("OnlyFirst");
      expect(result.users[1].lastName).toBe("");
      expect(result.users[2].firstName).toBe("");
      expect(result.users[2].lastName).toBe("OnlyLast");
    });

    it("should handle users without KYCimg", async () => {
      const mockUsers = [
        createMockUser({
          _id: { toString: () => "user1" } as unknown as Types.ObjectId,
          KYCimg: undefined,
        }),
        createMockUser({
          _id: { toString: () => "user2" } as unknown as Types.ObjectId,
          KYCimg: null as unknown as undefined,
        }),
        createMockUser({
          _id: { toString: () => "user3" } as unknown as Types.ObjectId,
          KYCimg: "",
        }),
      ];

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(3);

      const result = await adminGetUser(1, 10);

      expect(result.users[0].KYCimg).toBeUndefined();
      expect(result.users[1].KYCimg).toBeNull();
      expect(result.users[2].KYCimg).toBe("");
    });
  });

  describe("Empty Results", () => {
    it("should handle empty user list", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(0);

      const result = await adminGetUser(1, 10);

      expect(result).toEqual({
        users: [],
        currentPage: 1,
        totalUsers: 0,
        totalPages: 0,
      });
    });

    it("should handle page beyond available data", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(10);

      const result = await adminGetUser(5, 10);

      expect(result.users).toEqual([]);
      expect(result.currentPage).toBe(5);
      expect(result.totalUsers).toBe(10);
      expect(result.totalPages).toBe(1);
      expect(mockQuery.skip).toHaveBeenCalledWith(40);
    });
  });

  describe("Date Formatting", () => {
    it("should format updatedAt dates correctly to ISO string", async () => {
      const testDates = [
        new Date("2024-01-01T00:00:00Z"),
        new Date("2024-12-31T23:59:59Z"),
        new Date("2024-06-15T12:30:45.123Z"),
        new Date("2023-02-28T15:45:30Z"),
      ];

      const mockUsers = testDates.map((date, index) =>
        createMockUser({
          _id: { toString: () => `user${index}` } as unknown as Types.ObjectId,
          updatedAt: date,
        })
      );

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(testDates.length);

      const result = await adminGetUser(1, 10);

      expect(result.users[0].updatedAt).toBe("2024-01-01T00:00:00.000Z");
      expect(result.users[1].updatedAt).toBe("2024-12-31T23:59:59.000Z");
      expect(result.users[2].updatedAt).toBe("2024-06-15T12:30:45.123Z");
      expect(result.users[3].updatedAt).toBe("2023-02-28T15:45:30.000Z");
    });

    it("should handle different timezone dates", async () => {
      const mockUser = createMockUser({
        _id: { toString: () => "user1" } as unknown as Types.ObjectId,
        updatedAt: new Date("2024-01-15T10:30:00+05:30"),
      });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(1);

      const result = await adminGetUser(1, 10);

      expect(result.users[0].updatedAt).toBe("2024-01-15T05:00:00.000Z");
    });
  });

  describe("Boolean Fields", () => {
    it("should correctly handle isLocked and isVerified boolean values", async () => {
      const booleanCombinations = [
        { isLocked: true, isVerified: true },
        { isLocked: true, isVerified: false },
        { isLocked: false, isVerified: true },
        { isLocked: false, isVerified: false },
      ];

      const mockUsers = booleanCombinations.map((combo, index) =>
        createMockUser({
          _id: { toString: () => `user${index}` } as unknown as Types.ObjectId,
          isLocked: combo.isLocked,
          isVerified: combo.isVerified,
        })
      );

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue(mockUsers),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(4);

      const result = await adminGetUser(1, 10);

      booleanCombinations.forEach((combo, index) => {
        expect(result.users[index].isLocked).toBe(combo.isLocked);
        expect(result.users[index].isVerified).toBe(combo.isVerified);
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle special characters in user data", async () => {
      const mockUser = createMockUser({
        _id: { toString: () => "special-user" } as unknown as Types.ObjectId,
        firstName: "O'Neill",
        lastName: "Van-Der Berg",
        email: "test+special.chars@sub-domain.example.com",
        KYCimg: "https://example.com/kyc/image%20with%20spaces.jpg",
      });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(1);

      const result = await adminGetUser(1, 10);

      expect(result.users[0].firstName).toBe("O'Neill");
      expect(result.users[0].lastName).toBe("Van-Der Berg");
      expect(result.users[0].email).toBe(
        "test+special.chars@sub-domain.example.com"
      );
      expect(result.users[0].KYCimg).toBe(
        "https://example.com/kyc/image%20with%20spaces.jpg"
      );
    });

    it("should handle very long strings", async () => {
      const longString = "a".repeat(1000);
      const mockUser = createMockUser({
        _id: { toString: () => "long-user" } as unknown as Types.ObjectId,
        firstName: longString,
        lastName: longString,
        email: `${longString}@example.com`,
        KYCimg: `https://example.com/${longString}.jpg`,
      });

      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(1);

      const result = await adminGetUser(1, 10);

      expect(result.users[0].firstName).toBe(longString);
      expect(result.users[0].lastName).toBe(longString);
      expect(result.users[0].email.length).toBeGreaterThan(1000);
    });

    it("should handle limit of 1", async () => {
      const mockUser = createMockUser();
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([mockUser]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(100);

      const result = await adminGetUser(1, 1);

      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(result.totalPages).toBe(100);
    });

    it("should handle very large page numbers", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockResolvedValue(100);

      const result = await adminGetUser(999999, 10);

      expect(mockQuery.skip).toHaveBeenCalledWith(9999980);
      expect(result.currentPage).toBe(999999);
      expect(result.users).toEqual([]);
    });
  });

  describe("Database Error Handling", () => {
    it("should propagate find query errors", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockRejectedValue(new Error("Database connection failed")),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);

      await expect(adminGetUser(1, 10)).rejects.toThrow(
        "Database connection failed"
      );
    });

    it("should propagate countDocuments errors", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue([]),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);
      vi.mocked(User.countDocuments).mockRejectedValue(
        new Error("Count failed")
      );

      await expect(adminGetUser(1, 10)).rejects.toThrow("Count failed");
    });

    it("should handle query timeout", async () => {
      const mockQuery = {
        populate: vi.fn().mockReturnThis(),
        skip: vi.fn().mockReturnThis(),
        limit: vi
          .fn()
          .mockRejectedValue(new Error("Query timeout after 30000ms")),
      };

      vi.mocked(User.find).mockReturnValue(mockQuery as never);

      await expect(adminGetUser(2, 20)).rejects.toThrow(
        "Query timeout after 30000ms"
      );
    });
  });
});
