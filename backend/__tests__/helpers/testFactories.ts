import mongoose from 'mongoose';
import User, { UserType } from '../../model/User';
import WalletInfo from '../../model/WalletInfo';

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
