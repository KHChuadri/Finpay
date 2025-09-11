import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import HTTPError from "http-errors";
import { sendPasswordResetEmail } from '../../src/forgotPassword/sendPasswordResetEmail';
import { resetPasswordToken } from '../../src/forgotPassword/resetPasswordToken';
import { resetPassword } from '../../src/forgotPassword/resetPassword';
import User from '../../model/User';
import nodemailer from "nodemailer";
import { v4 as uuidv4 } from "uuid";
import bcrypt from 'bcrypt';

vi.mock('../../model/User', () => ({
  default: {
    findOne: vi.fn(),
    save: vi.fn()
  }
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(), 
    })),
  }
}));

vi.mock('bcrypt', () => ({
  default: {
    hash: vi.fn(),
    compare: vi.fn()
  }
}));

describe('Forgot Password Service', () => {
  const mockUserId1 = '507f1f77bcf86cd799439011'
  const mockToken = uuidv4();
  const newPassword = 'new-password123!'
  const mockUser1 = {
    _id: mockUserId1, 
    email: 'test@gmail.com',
    password: 'password123!',
    save: vi.fn().mockResolvedValue(true)
  }

  beforeEach(() => {
    vi.clearAllMocks();
  })

  afterEach(() => {
    vi.restoreAllMocks();
  })
  
  describe('Validation', () => {
    // If user does with the given email does not exists, return error
    it('Try resetting password with invalid email (STATUS 404)', async () => {
      await expect(sendPasswordResetEmail('higi@gmail.com'))
        .rejects
        .toThrow(HTTPError(404, 'User with this email not found'))
      expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    it('User with the given token does not exists (STATUS 404)', async () => {
      vi.mocked(User.findOne).mockResolvedValue(null);
      await expect(resetPasswordToken('fake-token'))
        .rejects
        .toThrow(HTTPError(404, `Couldn't find user`))
      expect(User.findOne).toHaveBeenCalledTimes(1);
    });

    // Token exists but token is not belong to the user
    it('Token does not belong to the user (STATUS 404)', async () => {
      const diffToken = 'diff-token';
      vi.mocked(User.findOne).mockResolvedValue({
        resetPasswordToken: diffToken
      });
  
      await expect(resetPasswordToken(mockToken))
        .rejects
        .toThrow(HTTPError(404, 'Link does not exists'));
      });
    });

    it('Token exists but token given is empty (STATUS 404)', async () => {
      vi.mocked(User.findOne).mockResolvedValue({
        resetPasswordToken: mockToken
      });

      await expect(resetPasswordToken(''))
        .rejects
        .toThrow(HTTPError(404, 'Link does not exists'));
    });

    it('Reset link cannot be used twice (STATUS 405)', async () => {
      vi.mocked(User.findOne).mockResolvedValue({
        resetPasswordToken: mockToken,
        resetPasswordTokenExpiryDate: undefined
      })

      await expect(resetPasswordToken(mockToken))
        .rejects
        .toThrow(HTTPError(405, 'Link has expired'));
    });

    it('Link has expired (STATUS 405)', async () => {
      vi.mocked(User.findOne).mockResolvedValue({
        resetPasswordToken: mockToken,
        resetPasswordTokenExpiryDate: ''
      })

      await expect(resetPasswordToken(mockToken))
        .rejects
        .toThrow(HTTPError(405, 'Link has expired'));
    });

    it('Reset token has expired (STATUS 410)', async () => {
      await expect(resetPassword(mockToken, newPassword))
        .rejects
        .toThrow(HTTPError(410, 'Reset password token has expired.'));
    });

    it('Reset password with curr password (STATUS 400)', async () => {
      vi.mocked(User.findOne).mockResolvedValue({
        resetPasswordToken: mockToken,
        resetPasswordTokenExpiryDate: Date.now() + 360000
      })
      vi.mocked(bcrypt.hash).mockResolvedValue(true as never)
      vi.mocked(bcrypt.compare).mockResolvedValue(true as never);

      await expect(resetPassword(mockToken, 'mock-password132'))
        .rejects
        .toThrow(HTTPError(400, "New password cannot be the same with current password"));
    });

    it('New password is the same with existing password (STATUS 409)', async () => {
      const newPassword = 'new-password123';
      const newHashedPassword = bcrypt.hash('new-password123', 10);
      const anotherHashedPassword = bcrypt.hash('another-one', 10);

      const mockUser2 = {
        ...mockUser1, 
        resetPasswordToken: mockToken,
        resetPasswordTokenExpiryDate: Date.now() + 3600000,
        existingPassword: [newHashedPassword, anotherHashedPassword]
      }
  
      vi.mocked(User.findOne).mockResolvedValue(mockUser2);
      vi.mocked(bcrypt.compare)
        .mockResolvedValueOnce(false as never) 
        .mockResolvedValueOnce(true as never); 

      await expect(resetPassword(mockToken, newPassword))
        .rejects
        .toThrow(HTTPError(409, 'This password has been used before. Please enter a new password'));
    });

  describe('Send reset password email', async () => {
    it('If user with the given email exists, send reset password link', async () => {
      vi.mocked(User.findOne).mockResolvedValue(mockUser1);

      const result = await sendPasswordResetEmail(mockUserId1);
      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);

      const mockTransporter = vi.mocked(nodemailer.createTransport).mock.results[0].value;
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        success: true,
        message: 'Reset password email has been sent.'
      });
    });
    });

  describe('Reset password', async () => {
    // Testing for token exists here
    it('Token exists and link has not expired', async () => {
      const now = Date.now();
      vi.mocked(User.findOne).mockResolvedValue({
        resetPasswordToken: mockToken,
        resetPasswordTokenExpiryDate: now + 3600000
      });

      const result = await resetPasswordToken(mockToken)
      expect(result).toEqual({
        success: true
      })
    });

    it('Successfully reset password', async () => {
      const newHashedPassword = bcrypt.hash('hihiha12', 10);
      const mockUser2 = {
        ...mockUser1, 
        resetPasswordToken: mockToken,
        resetPasswordTokenExpiryDate: Date.now() + 3600000,
        existingPassword: [newHashedPassword]
      }
      vi.mocked(User.findOne).mockResolvedValue(mockUser2);
      vi.mocked(bcrypt.compare).mockResolvedValue(false as never);

      const newPassword = 'new-password123';
      const result = await resetPassword(mockToken, newPassword);

      expect(result).toEqual({
        success: true,
        user: mockUser2
      })
    });

  });
})