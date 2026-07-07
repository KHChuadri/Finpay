import mongoose from 'mongoose';
import User, { UserType } from '../../model/User';
import WalletInfo from '../../model/WalletInfo';
import ScheduledPayment from '../../model/ScheduledPayment';

export const createTestUser = async (overrides: Partial<UserType> = {}) => {
  const defaultUser = {
    firstName: 'Test',
    lastName: 'User',
    email: `test${Date.now()}@example.com`,
    password: 'hashedPassword123',
    passwordLength: 12,
    username: `user${Date.now()}`,
    accountType: 'personal',
    isVerified: true,
    isLocked: false,
    isAdmin: false,
    rank: 'bronze',
    exp: 0,
    walletInfo: [],
    transactionHistory: [],
    request: [],
    tokens: [],
    groups: [],
    notification: [],
    invitation: [],
    bioData: new mongoose.Types.ObjectId(),
    bankInfo: new mongoose.Types.ObjectId(),
    userId: new mongoose.Types.ObjectId(),
    lastNotificationSeen: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  return await User.create({
    ...defaultUser,
    ...overrides,
  });
};

// Factory to create a test wallet
export const createTestWallet = async (
  userId: string,
  currency: string = 'AUD',
  balance: number = 1000
) => {
  const wallet = await WalletInfo.create({
    userId,
    walletCurrency: currency,
    walletBalance: balance,
  });

  // Update user's walletInfo array
  await User.findByIdAndUpdate(userId, {
    $push: { walletInfo: wallet._id }
  });

  return wallet;
};

// Factory to create a test scheduled payment
export const createTestScheduledPayment = async (
  overrides: Partial<{
    debtorId: string;
    creditorId: string;
    amountSrc: number;
    amountDest: number;
    currencySrc: string;
    currencyDest: string;
    scheduledDate: Date;
    status: string;
    jobId: string;
  }> = {}
) => {
  const defaults = {
    debtorId: new mongoose.Types.ObjectId().toString(),
    creditorId: new mongoose.Types.ObjectId().toString(),
    amountSrc: 100,
    amountDest: 100,
    currencySrc: 'AUD',
    currencyDest: 'AUD',
    scheduledDate: new Date(Date.now() + 60_000),
  };

  return ScheduledPayment.create({
    ...defaults,
    ...overrides,
  });
};
