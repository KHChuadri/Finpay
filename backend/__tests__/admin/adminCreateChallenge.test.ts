import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import HTTPError from 'http-errors';
import { adminCreateChallenge } from '../../src/admin/adminCreateChallenge';
import Challenge from '../../model/Challenge';
import type { Document } from 'mongoose';

vi.mock('../../model/Challenge');

interface IChallenge extends Document {
  category: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  exp: number;
  amountToGoal: number;
  createdAt?: Date;
  updatedAt?: Date;
}

const createMockChallenge = (overrides?: Partial<IChallenge>): IChallenge => {
  const defaults = {
    _id: '507f1f77bcf86cd799439011',
    category: 'pay',
    title: 'Test Challenge',
    description: 'Test Description',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    exp: 100,
    amountToGoal: 1000,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides
  };

  return {
    ...defaults,
    toJSON: vi.fn().mockReturnValue(defaults),
    toObject: vi.fn().mockReturnValue(defaults),
    save: vi.fn().mockResolvedValue(defaults),
  } as unknown as IChallenge;
};

describe('adminCreateChallenge', () => {
  const validChallengeData = {
    category: 'pay' as const,
    title: 'Monthly Savings Challenge',
    description: 'Save $100 every month',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    exp: 500,
    amountToGoal: 1200
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Challenge Creation', () => {
    it('should create a challenge with valid data', async () => {
      const mockCreatedChallenge = createMockChallenge(validChallengeData);
      vi.mocked(Challenge.create).mockResolvedValue(mockCreatedChallenge as never);

      const result = await adminCreateChallenge(
        validChallengeData.category,
        validChallengeData.title,
        validChallengeData.description,
        validChallengeData.startDate,
        validChallengeData.endDate,
        validChallengeData.exp,
        validChallengeData.amountToGoal
      );

      expect(result).toEqual({
        success: true,
        newChallenge: mockCreatedChallenge
      });

      expect(Challenge.create).toHaveBeenCalledWith({
        category: validChallengeData.category,
        title: validChallengeData.title,
        description: validChallengeData.description,
        startDate: validChallengeData.startDate,
        endDate: validChallengeData.endDate,
        exp: validChallengeData.exp,
        amountToGoal: validChallengeData.amountToGoal
      });

      expect(Challenge.create).toHaveBeenCalledTimes(1);
    });

    it('should create challenges for all valid categories', async () => {
      const validCategories = ['pay', 'recieve', 'save'] as const;

      for (const category of validCategories) {
        vi.clearAllMocks();
        const challengeData = { ...validChallengeData, category };
        const mockChallenge = createMockChallenge(challengeData);
        vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

        const result = await adminCreateChallenge(
          category,
          challengeData.title,
          challengeData.description,
          challengeData.startDate,
          challengeData.endDate,
          challengeData.exp,
          challengeData.amountToGoal
        );

        expect(result.success).toBe(true);
        expect(Challenge.create).toHaveBeenCalledWith(
          expect.objectContaining({ category })
        );
      }
    });

    it('should handle edge case dates correctly', async () => {
      const edgeCaseData = {
        ...validChallengeData,
        startDate: '2024-01-01',
        endDate: '2024-01-02'
      };

      const mockChallenge = createMockChallenge(edgeCaseData);
      vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

      const result = await adminCreateChallenge(
        edgeCaseData.category,
        edgeCaseData.title,
        edgeCaseData.description,
        edgeCaseData.startDate,
        edgeCaseData.endDate,
        edgeCaseData.exp,
        edgeCaseData.amountToGoal
      );

      expect(result.success).toBe(true);
      expect(Challenge.create).toHaveBeenCalled();
    });

    it('should handle zero values for exp and amountToGoal', async () => {
      const zeroValueData = {
        ...validChallengeData,
        exp: 0,
        amountToGoal: 0
      };

      const mockChallenge = createMockChallenge(zeroValueData);
      vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

      const result = await adminCreateChallenge(
        zeroValueData.category,
        zeroValueData.title,
        zeroValueData.description,
        zeroValueData.startDate,
        zeroValueData.endDate,
        zeroValueData.exp,
        zeroValueData.amountToGoal
      );

      expect(result.success).toBe(true);
      expect(Challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          exp: 0,
          amountToGoal: 0
        })
      );
    });
  });

  describe('Validation Errors - Missing Fields', () => {
    it('should throw error when category is missing', async () => {
      await expect(
        adminCreateChallenge(
          '',
          validChallengeData.title,
          validChallengeData.description,
          validChallengeData.startDate,
          validChallengeData.endDate,
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: required field(s) [category] are missing')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });

    it('should throw error when title is missing', async () => {
      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          "",
          validChallengeData.description,
          validChallengeData.startDate,
          validChallengeData.endDate,
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: required field(s) [title] are missing')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });

    it('should throw error when multiple fields are missing', async () => {
      await expect(
        adminCreateChallenge(
          '',
          '',
          '',
          validChallengeData.startDate,
          validChallengeData.endDate,
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: required field(s) [category, title, description] are missing')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });

    it('should throw error when numeric fields are null or undefined', async () => {
      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          validChallengeData.title,
          validChallengeData.description,
          validChallengeData.startDate,
          validChallengeData.endDate,
          null as unknown as number,
          undefined as unknown as number
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: required field(s) [exp, amountToGoal] are missing')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });
  });

  describe('Validation Errors - Invalid Category', () => {
    it('should throw error for invalid category', async () => {
      const invalidCategories = ['invalid', 'test', 'Pay', 'SAVE', 'receive'];

      for (const invalidCategory of invalidCategories) {
        await expect(
          adminCreateChallenge(
            invalidCategory,
            validChallengeData.title,
            validChallengeData.description,
            validChallengeData.startDate,
            validChallengeData.endDate,
            validChallengeData.exp,
            validChallengeData.amountToGoal
          )
        ).rejects.toThrow(
          HTTPError(400, `adminCreateChallenge: Invalid category: ${invalidCategory}`)
        );

        expect(Challenge.create).not.toHaveBeenCalled();
      }
    });

    it('should be case-sensitive for category validation', async () => {
      await expect(
        adminCreateChallenge(
          'PAY',
          validChallengeData.title,
          validChallengeData.description,
          validChallengeData.startDate,
          validChallengeData.endDate,
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: Invalid category: PAY')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });
  });

  describe('Validation Errors - Date Validation', () => {
    it('should throw error when end date equals start date', async () => {
      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          validChallengeData.title,
          validChallengeData.description,
          '2024-01-01',
          '2024-01-01',
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: end date must be later than start date. (2024-01-01 <= 2024-01-01)')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });

    it('should throw error when end date is before start date', async () => {
      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          validChallengeData.title,
          validChallengeData.description,
          '2024-12-31',
          '2024-01-01',
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: end date must be later than start date. (2024-01-01 <= 2024-12-31)')
      );

      expect(Challenge.create).not.toHaveBeenCalled();
    });

    it('should handle different date formats correctly', async () => {
      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          validChallengeData.title,
          validChallengeData.description,
          '2024-10-10',
          '2024-10-09',
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow(
        HTTPError(400, 'adminCreateChallenge: end date must be later than start date. (2024-10-09 <= 2024-10-10)')
      );
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate database creation errors', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(Challenge.create).mockRejectedValue(dbError);

      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          validChallengeData.title,
          validChallengeData.description,
          validChallengeData.startDate,
          validChallengeData.endDate,
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow('Database connection failed');

      expect(Challenge.create).toHaveBeenCalledTimes(1);
    });

    it('should handle mongoose validation errors', async () => {
      const mongooseError = new Error('Challenge validation failed');
      vi.mocked(Challenge.create).mockRejectedValue(mongooseError);

      await expect(
        adminCreateChallenge(
          validChallengeData.category,
          validChallengeData.title,
          validChallengeData.description,
          validChallengeData.startDate,
          validChallengeData.endDate,
          validChallengeData.exp,
          validChallengeData.amountToGoal
        )
      ).rejects.toThrow('Challenge validation failed');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long strings', async () => {
      const longStringData = {
        ...validChallengeData,
        title: 'A'.repeat(1000),
        description: 'B'.repeat(5000)
      };

      const mockChallenge = createMockChallenge(longStringData);
      vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

      const result = await adminCreateChallenge(
        longStringData.category,
        longStringData.title,
        longStringData.description,
        longStringData.startDate,
        longStringData.endDate,
        longStringData.exp,
        longStringData.amountToGoal
      );

      expect(result.success).toBe(true);
      expect(Challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: longStringData.title,
          description: longStringData.description
        })
      );
    });

    it('should handle negative numbers', async () => {
      const negativeData = {
        ...validChallengeData,
        exp: -100,
        amountToGoal: -1000
      };

      const mockChallenge = createMockChallenge(negativeData);
      vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

      const result = await adminCreateChallenge(
        negativeData.category,
        negativeData.title,
        negativeData.description,
        negativeData.startDate,
        negativeData.endDate,
        negativeData.exp,
        negativeData.amountToGoal
      );

      expect(result.success).toBe(true);
      expect(Challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          exp: -100,
          amountToGoal: -1000
        })
      );
    });

    it('should handle decimal numbers', async () => {
      const decimalData = {
        ...validChallengeData,
        exp: 99.99,
        amountToGoal: 1234.56
      };

      const mockChallenge = createMockChallenge(decimalData);
      vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

      const result = await adminCreateChallenge(
        decimalData.category,
        decimalData.title,
        decimalData.description,
        decimalData.startDate,
        decimalData.endDate,
        decimalData.exp,
        decimalData.amountToGoal
      );

      expect(result.success).toBe(true);
      expect(Challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          exp: 99.99,
          amountToGoal: 1234.56
        })
      );
    });

    it('should handle special characters in strings', async () => {
      const specialCharData = {
        ...validChallengeData,
        title: "Challenge #1: Save $1000 & earn 50% bonus!",
        description: "Complete tasks & earn rewards\n- Task 1\n- Task 2"
      };

      const mockChallenge = createMockChallenge(specialCharData);
      vi.mocked(Challenge.create).mockResolvedValue(mockChallenge as never);

      const result = await adminCreateChallenge(
        specialCharData.category,
        specialCharData.title,
        specialCharData.description,
        specialCharData.startDate,
        specialCharData.endDate,
        specialCharData.exp,
        specialCharData.amountToGoal
      );

      expect(result.success).toBe(true);
      expect(Challenge.create).toHaveBeenCalledWith(
        expect.objectContaining({
          title: specialCharData.title,
          description: specialCharData.description
        })
      );
    });
  });
});