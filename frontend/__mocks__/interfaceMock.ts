export interface P2PTransferRequest {
  debtorUserId: string;
  creditor: string;
  amountSrc: number;
  amountDest: number;
  srcCurrency: string;
  destCurrency: string;
}

export interface UserProfile {
  firstName: string;
  lastName: string;
  email: string;
  passwordLength: number;
  dob: string | null;
  address: {
    addressLine1: string | null;
    addressLine2: string | null;
    country: string | null;
  };
  KYCimg: string | null;
  profileImg?: string;
  accountType: 'personal' | 'business';
  depositId?: string;
  isVerified: boolean;
  isLocked: boolean;
  exp: number;
};

export interface UserWalletInfo {
  _id: string;
  userId: string;
  walletBalance: number;
  walletCurrency: string; // e.g., "AUD" for Australia
  countryCode: string; // e.g., "au" for Australia
}

export const defaultUser: UserProfile = {
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  passwordLength: 11, // password: "ValidPass1!" -> 11 chars
  dob: null,
  address: { addressLine1: null, addressLine2: null, country: null },
  KYCimg: null,
  profileImg: '/profile icon.png',
  accountType: 'personal',
  depositId: '2806fed7-1dcc-4ff2-b149-2d399397b286',
  isVerified: false,
  isLocked: false,
  exp: 0,
};

// Mock Wallet Data
export const defaultWallets: UserWalletInfo[] = [
  {
    _id: 'mock-debtor-wallet-id1',
    userId: '123',
    walletBalance: 500,
    walletCurrency: 'AUD',
    countryCode: 'AU',
  },
  {
    _id: 'mock-debtor-wallet-id2',
    userId: '123',
    walletBalance: 100000,
    walletCurrency: 'IDR',
    countryCode: 'ID',
  }
];

const DEFAULT_USER_ID = '123';

// Mock user database
export const userDb: Record<string, UserProfile> = {
  [DEFAULT_USER_ID]: { ...defaultUser },
};

// Mock reset user database
export function resetUserDb() {
  userDb[DEFAULT_USER_ID] = { ...defaultUser };
};