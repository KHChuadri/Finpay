import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { createOtp } from '../../src/otpVerification/createOtp';
import { sendOtpEmail } from '../../src/otpVerification/sendOtpEmail';
import { verifyOtp } from '../../src/otpVerification/verifyOtp';
import HTTPError from "http-errors";
import Otp from '../../model/Otp';
import User from '../../model/User';
import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import crypto from 'crypto';

type OtpCreateReturn = Awaited<ReturnType<typeof Otp.create>>;

vi.mock("jsonwebtoken");

vi.mock('../../model/User', () => ({
  default: {
    findById: vi.fn(),
    findByIdAndUpdate: vi.fn()
  }
}));

vi.mock("nodemailer", () => ({
  default: {
    createTransport: vi.fn(() => ({
      sendMail: vi.fn(), 
    })),
  }
}));

const mockToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";

describe('OTP Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
     process.env.JWT_SECRET = "test-secret-key";
    vi.mocked(jwt.sign).mockReturnValue(mockToken as never);
  })

  afterEach(() => {
    vi.restoreAllMocks();
  })

  const mockUser = {
    _id: '507f1f77bcf86cd799439011',
    email: 'test@gmail.com',
    password: 'password123!'
  }

  const mockOTPId = '507f1f77bcf86cd799439022';
  const mockOtpStr = '123456';

  const mockOTP = {
    _id: mockOTPId,
    userId: '507f1f77bcf86cd799439011',
    otp: mockOtpStr,
    expiredAt: new Date(Date.now() + 60 * 1000)
  } as unknown as OtpCreateReturn

  const mockExpiredId = 'expired-otpId'
  const mockExpiredOTP = {
    _id: mockExpiredId,
    userId: mockUser._id,
    otp: 'expiredOTP',
    expiredAt: new Date(Date.now() - 70 * 1000)
  } as unknown as OtpCreateReturn

  // Testing error cases when user id does not exists, hence otp cannot be created
  describe('Validation', () => {
    it('User id does not exists (STATUS 404)', async () => {
      vi.spyOn(Otp, 'insertOne').mockResolvedValue(undefined as never);
      await expect((createOtp("fake-userId-abc1234")))
        .rejects
        .toThrow(HTTPError(404, 'User does not exists'))

      // Ensure that we have find the user beforehand
      expect(User.findById).toHaveBeenCalledTimes(1);
  
      // Ensure that the otp has not been created
      expect(Otp.insertOne).not.toHaveBeenCalled();
    });

    // Testing error case -> no user id given
    it('Try sending otp email to an empty userId string (STATUS 400)', async () => {
      await expect(sendOtpEmail(''))
        .rejects
        .toThrow(HTTPError(400, 'User Id does not exists'));
    })
  })

  // Check if otp successfully created
  describe('OTP Creation', () => {
    // Successfully create otp
    it('OTP successfully created when user id exists', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.spyOn(Otp, 'create').mockResolvedValue(mockOTP);

      const newOtp = await createOtp('507f1f77bcf86cd799439011');
      
      expect(newOtp.userEmail).toEqual(mockUser.email);
      expect(newOtp.otpId).toEqual(mockOTPId);
      expect(newOtp.otp).toMatch(/^\d{6}$/); // Ensure that created otp has length 6

      // Verify if otp created has been saved to the database
      expect(Otp.create).toHaveBeenCalledWith({
        userId: mockUser._id,
        otp: expect.stringMatching(/^[a-f0-9]{64}$/), // Since otp hashed is saved in the database
        expiredAt: expect.any(Date)
      })
      expect(Otp.create).toHaveBeenCalledTimes(1);
    });
  })

  // Testing sendOTPEmail functionality
  describe('Email OTP number to user', async () => {
    // When send OTP email is called
    it('Successfully send OTP email to user if user id exists', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.spyOn(Otp, 'create').mockResolvedValue(mockOTP);

      await sendOtpEmail(mockUser._id);

      expect(nodemailer.createTransport).toHaveBeenCalledTimes(1);

      const mockTransporter = vi.mocked(nodemailer.createTransport).mock.results[0].value;
      expect(mockTransporter.sendMail).toHaveBeenCalledTimes(1);
    });
  })

  describe('OTP Verification', () => {
    it('Otp id is empty (STATUS 400)', async () => {
      await expect(verifyOtp('', 123455, 'user124', 'hihi@gmail.com'))
        .rejects
        .toThrow(HTTPError(400, 'OTP does not exist'));
    });

    it('Otp id does not exists (STATUS 400)', async () => {
      await expect(verifyOtp(mockOTPId, 123456, 'user123', 'hihi@gmail.com'))
        .rejects
        .toThrow(HTTPError(400, 'No OTP has been send'));
    })

    it('Incorrect otp being send', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.spyOn(Otp, 'findById').mockResolvedValue(mockOTP);

      await expect(verifyOtp(mockOTPId, 100000, mockUser._id, mockUser.email))
        .rejects
        .toThrow(HTTPError(404, 'Incorrect OTP number'));
    });

    it('OTP has expired', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.spyOn(Otp, 'findById').mockResolvedValue(mockExpiredOTP);

      await expect(verifyOtp(mockExpiredId, 100000, mockUser._id, mockUser.email))
        .rejects
        .toThrow(HTTPError(404, 'OTP code has expired'));
    });

    it('Successfully verify OTP', async () => {
      vi.mocked(User.findById).mockResolvedValue(mockUser);
      vi.spyOn(Otp, 'create').mockResolvedValue(mockOTP);

      const mockUserId = mockUser._id;
      const hashedOtp = crypto.createHash("sha256").update(mockOtpStr).digest('hex');
      vi.spyOn(Otp, 'findById').mockResolvedValue({
        ...mockOTP,
        otp: hashedOtp
      })

      vi.mocked(User.findByIdAndUpdate({
        mockUserId,
        token: "test-secret-key"
      }))
    
      const result = await verifyOtp(mockOTPId, 123456, mockUser._id, mockUser.email);
      expect(Otp.findById).toHaveBeenCalledTimes(1);

      expect(jwt.sign).toHaveBeenCalledWith(
        { userId: mockUserId, email: mockUser.email },
        "test-secret-key"
      );
      
      expect(User.findByIdAndUpdate).toBeCalledTimes(2);

      expect(result).toEqual({
        success: true,
        token: mockToken,
        userId: mockUserId
      });
    });

  });

})