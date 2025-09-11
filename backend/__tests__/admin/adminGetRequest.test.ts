
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { adminGetRequest } from '../../src/admin/adminGetRequest';
import TransactionItem from '../../model/TransactionItem';
import type { Document, Types } from 'mongoose';

vi.mock('../../model/TransactionItem');

interface ITransactionItem extends Document {
  _id: Types.ObjectId;
  name: string;
  transactionId: string;
  currency: string;
  amount: number;
  userId: Types.ObjectId;
  transactionType: 'Withdraw' | 'Deposit' | 'Transfer';
  createdAt?: Date;
  updatedAt?: Date;
}

const createMockTransactionItem = (overrides?: Partial<ITransactionItem>): ITransactionItem => {
  const defaults = {
    _id: '507f1f77bcf86cd799439011',
    name: 'Test Transaction',
    transactionId: 'TXN-123456',
    currency: 'USD',
    amount: 100,
    userId: '507f1f77bcf86cd799439012',
    transactionType: 'Withdraw',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    ...overrides
  };

    return {
      ...defaults,
      toJSON: vi.fn().mockReturnValue(defaults),
      toObject: vi.fn().mockReturnValue(defaults),
      save: vi.fn().mockResolvedValue(defaults),
    } as unknown as ITransactionItem;
};

describe('adminGetRequest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Successful Request Retrieval', () => {
    it('should retrieve withdraw requests with pagination', async () => {
      
      const mockTransactions = [
        createMockTransactionItem({
          _id: { toString: () => 'id1' } as unknown as Types.ObjectId,
          name: 'Withdrawal 1',
          transactionId: 'TXN-001',
          currency: 'USD',
          amount: 500,
          userId: { toString: () => 'user1' } as unknown as Types.ObjectId,
        }),
        createMockTransactionItem({
          _id: { toString: () => 'id2' } as unknown as Types.ObjectId,
          name: 'Withdrawal 2',
          transactionId: 'TXN-002',
          currency: 'EUR',
          amount: 300,
          userId: { toString: () => 'user2' } as unknown as Types.ObjectId,
        }),
        createMockTransactionItem({
          _id: { toString: () => 'id3' } as unknown as Types.ObjectId,
          name: 'Withdrawal 3',
          transactionId: 'TXN-003',
          currency: 'GBP',
          amount: 250,
          userId: { toString: () => 'user3' } as unknown as Types.ObjectId,
        })
      ];

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(TransactionItem.find).toHaveBeenCalledWith({ transactionType: 'Withdraw' });
      expect(mockQuery.limit).toHaveBeenCalledWith(10);
      expect(mockQuery.skip).toHaveBeenCalledWith(0); 

      expect(result).toEqual({
        requests: [
          {
            itemid: 'id1',
            name: 'Withdrawal 1',
            transactionId: 'TXN-001',
            currency: 'USD',
            amount: 500,
            userId: 'user1'
          },
          {
            itemid: 'id2',
            name: 'Withdrawal 2',
            transactionId: 'TXN-002',
            currency: 'EUR',
            amount: 300,
            userId: 'user2'
          },
          {
            itemid: 'id3',
            name: 'Withdrawal 3',
            transactionId: 'TXN-003',
            currency: 'GBP',
            amount: 250,
            userId: 'user3'
          }
        ],
        currentPage: 1,
        totalRequest: 3,
        totalPages: 1 
      });
    });

    it('should handle different page numbers correctly', async () => {
      
      const mockTransactions = [
        createMockTransactionItem({ 
          _id: { toString: () => 'id1' } as unknown as Types.ObjectId 
        })
      ];

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const testCases = [
        { page: 2, limit: 10, expectedSkip: 10 },
        { page: 3, limit: 10, expectedSkip: 20 },
        { page: 5, limit: 20, expectedSkip: 80 },
        { page: 1, limit: 5, expectedSkip: 0 }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

        
        await adminGetRequest(testCase.page, testCase.limit);

        
        expect(mockQuery.skip).toHaveBeenCalledWith(testCase.expectedSkip);
        expect(mockQuery.limit).toHaveBeenCalledWith(testCase.limit);
      }
    });

    it('should handle single transaction correctly', async () => {
      
      const singleTransaction = createMockTransactionItem({
        _id: { toString: () => 'single-id' } as unknown as Types.ObjectId,
        name: 'Single Withdrawal',
        transactionId: 'TXN-SINGLE',
        currency: 'AUD',
        amount: 1000,
        userId: { toString: () => 'single-user' } as unknown as Types.ObjectId,
      });

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([singleTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result).toEqual({
        requests: [{
          itemid: 'single-id',
          name: 'Single Withdrawal',
          transactionId: 'TXN-SINGLE',
          currency: 'AUD',
          amount: 1000,
          userId: 'single-user'
        }],
        currentPage: 1,
        totalRequest: 1,
        totalPages: 1
      });
    });

    it('should calculate total pages correctly for various scenarios', async () => {
      
      const testCases = [
        { resultCount: 10, limit: 5, expectedPages: 2 },
        { resultCount: 11, limit: 5, expectedPages: 3 },
        { resultCount: 5, limit: 5, expectedPages: 1 },
        { resultCount: 1, limit: 10, expectedPages: 1 },
        { resultCount: 7, limit: 3, expectedPages: 3 }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        
        
        const mockTransactions = Array.from({ length: testCase.resultCount }, (_, i) => 
          createMockTransactionItem({
            _id: { toString: () => `id${i}` } as unknown as Types.ObjectId
          })
        );

        const mockQuery = {
          limit: vi.fn().mockReturnThis(),
          skip: vi.fn().mockResolvedValue(mockTransactions)
        };

        vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

        
        const result = await adminGetRequest(1, testCase.limit);

        
        expect(result.totalPages).toBe(testCase.expectedPages);
      }
    });
  });

  describe('Empty Results Handling', () => {
    it('should handle empty results with totalRequest = 1', async () => {
      
      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result).toEqual({
        requests: [],
        currentPage: 1,
        totalRequest: 1, 
        totalPages: 1    
      });
    });

    it('should handle empty results on different pages', async () => {
      
      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(5, 20);

      
      expect(result).toEqual({
        requests: [],
        currentPage: 5,
        totalRequest: 1,
        totalPages: 1
      });
      
      expect(mockQuery.skip).toHaveBeenCalledWith(80); 
    });
  });

  describe('Data Transformation', () => {
    it('should correctly transform transaction items to response format', async () => {
      
      const mockTransaction = createMockTransactionItem({
        _id: { toString: () => 'transformed-id' } as unknown as Types.ObjectId,
        name: 'Transform Test',
        transactionId: 'TXN-TRANSFORM',
        currency: 'JPY',
        amount: 10000,
        userId: { toString: () => 'transformed-user' } as unknown as Types.ObjectId,
        transactionType: 'Withdraw',
        
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      });

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([mockTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result.requests[0]).toEqual({
        itemid: 'transformed-id',
        name: 'Transform Test',
        transactionId: 'TXN-TRANSFORM',
        currency: 'JPY',
        amount: 10000,
        userId: 'transformed-user'
      });

      
      expect(result.requests[0]).not.toHaveProperty('transactionType');
      expect(result.requests[0]).not.toHaveProperty('createdAt');
      expect(result.requests[0]).not.toHaveProperty('updatedAt');
    });

    it('should handle various currency types', async () => {
      
      const currencies = ['USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD'];
      const mockTransactions = currencies.map((currency, index) =>
        createMockTransactionItem({
          _id: { toString: () => `id-${currency}` } as unknown as Types.ObjectId,
          currency: currency,
          amount: (index + 1) * 100
        })
      );

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue(mockTransactions)
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      currencies.forEach((currency, index) => {
        expect(result.requests[index].currency).toBe(currency);
        expect(result.requests[index].amount).toBe((index + 1) * 100);
      });
    });

    it('should handle decimal amounts correctly', async () => {
      
      const mockTransaction = createMockTransactionItem({
        _id: { toString: () => 'decimal-id' } as unknown as Types.ObjectId,
        amount: 99.99
      });

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([mockTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result.requests[0].amount).toBe(99.99);
    });
  });

  describe('Database Error Handling', () => {
    it('should propagate database errors', async () => {
      
      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockRejectedValue(new Error('Database connection failed'))
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      await expect(adminGetRequest(1, 10)).rejects.toThrow('Database connection failed');
    });

    it('should handle query timeout errors', async () => {
      
      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockRejectedValue(new Error('Query timeout'))
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      await expect(adminGetRequest(2, 20)).rejects.toThrow('Query timeout');
    });
  });

  describe('Edge Cases', () => {
    it('should handle very large page numbers', async () => {
      
      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1000000, 10);

      
      expect(mockQuery.skip).toHaveBeenCalledWith(9999990);
      expect(result.currentPage).toBe(1000000);
    });

    it('should handle limit of 1', async () => {
      
      const mockTransaction = createMockTransactionItem();
      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([mockTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 1);

      
      expect(mockQuery.limit).toHaveBeenCalledWith(1);
      expect(result.totalPages).toBe(1);
    });

    it('should handle special characters in transaction names', async () => {
      
      const mockTransaction = createMockTransactionItem({
        _id: { toString: () => 'special-id' } as unknown as Types.ObjectId,
        name: 'Withdrawal #123 & Test @ 50% - $100',
        transactionId: 'TXN-!@#$%'
      });

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([mockTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result.requests[0].name).toBe('Withdrawal #123 & Test @ 50% - $100');
      expect(result.requests[0].transactionId).toBe('TXN-!@#$%');
    });

    it('should handle negative amounts', async () => {
      
      const mockTransaction = createMockTransactionItem({
        _id: { toString: () => 'negative-id' } as unknown as Types.ObjectId,
        amount: -500
      });

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([mockTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result.requests[0].amount).toBe(-500);
    });

    it('should handle zero amount', async () => {
      
      const mockTransaction = createMockTransactionItem({
        _id: { toString: () => 'zero-id' } as unknown as Types.ObjectId,
        amount: 0
      });

      const mockQuery = {
        limit: vi.fn().mockReturnThis(),
        skip: vi.fn().mockResolvedValue([mockTransaction])
      };

      vi.mocked(TransactionItem.find).mockReturnValue(mockQuery as never);

      
      const result = await adminGetRequest(1, 10);

      
      expect(result.requests[0].amount).toBe(0);
    });
  });
});