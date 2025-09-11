import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import bcrypt from 'bcrypt';
import HTTPError from 'http-errors';
import { login } from '../../src/auth/login';
import User from '../../model/User';

vi.mock('../../model/User', () => ({
  default: {
    findOne: vi.fn()
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    compare: vi.fn()
  }
}));

describe('Login Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Validation', () => {
    it('should throw 400 error when email is missing', async () => {
      await expect(login('', 'password123'))
        .rejects
        .toThrow(HTTPError(400, 'Email and password are required'));
      
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should throw 400 error when password is missing', async () => {
      await expect(login('test@example.com', ''))
        .rejects
        .toThrow(HTTPError(400, 'Email and password are required'));
      
      expect(User.findOne).not.toHaveBeenCalled();
    });

    it('should throw 400 error when both email and password are missing', async () => {
      await expect(login('', ''))
        .rejects
        .toThrow(HTTPError(400, 'Email and password are required'));
      
      expect(User.findOne).not.toHaveBeenCalled();
    });
  });

  describe('User Authentication', () => {
    const mockUser = {
      _id: { toString: () => '507f1f77bcf86cd799439011' },
      email: 'test@example.com',
      password: 'hashedPassword123'
    };

    it('should throw 404 error when user does not exist', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(login('nonexistent@example.com', 'password123'))
        .rejects
        .toThrow(HTTPError(404, 'Account does not exist with the given email'));

      expect(User.findOne).toHaveBeenCalledWith({ email: 'nonexistent@example.com' });
      expect(User.findOne).toHaveBeenCalledTimes(1);
      
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should throw 400 error when password is incorrect', async () => {
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      await expect(login('test@example.com', 'wrongPassword'))
        .rejects
        .toThrow(HTTPError(400, 'Incorrect password'));

      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(bcrypt.compare).toHaveBeenCalledWith('wrongPassword', 'hashedPassword123');
    });

    it('should return userId when login is successful', async () => {
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login('test@example.com', 'correctPassword');

      expect(result).toEqual({ userId: '507f1f77bcf86cd799439011' });
      
      expect(User.findOne).toHaveBeenCalledWith({ email: 'test@example.com' });
      expect(User.findOne).toHaveBeenCalledTimes(1);
      expect(bcrypt.compare).toHaveBeenCalledWith('correctPassword', 'hashedPassword123');
      expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should handle different user ID formats', async () => {
      const userWithDifferentId = {
        ...mockUser,
        _id: { toString: () => 'user-123-abc' }
      };
      vi.mocked(User.findOne).mockResolvedValue(userWithDifferentId);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login('test@example.com', 'password');

      expect(result).toEqual({ userId: 'user-123-abc' });
    });
  });

  describe('Edge Cases', () => {
    it('should handle database errors gracefully', async () => {
      const dbError = new Error('Database connection failed');
      vi.mocked(User.findOne).mockRejectedValue(dbError);

      await expect(login('test@example.com', 'password123'))
        .rejects
        .toThrow('Database connection failed');
    });

    it('should handle bcrypt comparison errors', async () => {
      const mockUser = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'test@example.com',
        password: 'hashedPassword'
      };
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockRejectedValue(new Error('Bcrypt error'));

      await expect(login('test@example.com', 'password'))
        .rejects
        .toThrow('Bcrypt error');
    });

    it('should handle special characters in email', async () => {
      const email = "test+special@example.com";
      vi.mocked(User.findOne).mockResolvedValue(null);

      await expect(login(email, 'password'))
        .rejects
        .toThrow(HTTPError(404, 'Account does not exist with the given email'));

      expect(User.findOne).toHaveBeenCalledWith({ email });
    });

    it('should handle very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const mockUser = {
        _id: { toString: () => '507f1f77bcf86cd799439011' },
        email: 'test@example.com',
        password: 'hashedLongPassword'
      };
      vi.mocked(User.findOne).mockResolvedValue(mockUser);
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      const result = await login('test@example.com', longPassword);

      expect(result).toEqual({ userId: '507f1f77bcf86cd799439011' });
      expect(bcrypt.compare).toHaveBeenCalledWith(longPassword, 'hashedLongPassword');
    });
  });

  describe('Performance Considerations', () => {
    it('should not make unnecessary database calls on validation failure', async () => {
      const testCases = [
        { email: '', password: '' },
        { email: '', password: 'pass' },
        { email: 'test@example.com', password: '' }
      ];

      for (const testCase of testCases) {
        vi.clearAllMocks();
        
        await expect(login(testCase.email, testCase.password))
          .rejects
          .toThrow();
        
        expect(User.findOne).not.toHaveBeenCalled();
        expect(bcrypt.compare).not.toHaveBeenCalled();
      }
    });
  });
});