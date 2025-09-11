import useAuthStore from '@/stores/authStore';
import { http, HttpResponse } from 'msw'; // API mocking utilities from Mock Service Worker
import { setupServer } from 'msw/node';
import type { UserProfile, P2PTransferRequest } from './interfaceMock.ts';
import { defaultUser, defaultWallets, userDb, resetUserDb } from './interfaceMock';

// const APP_ID = process.env.EXCHANGERATE_KEY;
// Mock API handlers
export const handlers = [
  // Register user
  http.post('http://localhost:3000/register', async ({ request }) => {
    const { email } = await request.json() as { email: string };

    if (email === 'used@example.com') {
      return HttpResponse.json(
        { errorMsg: 'Corresponding email has been used.' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { token: 'mock-token', userId: '123' },
      { status: 201 }
    );
  }),

  // Login user
  http.post('http://localhost:3000/login', async ({ request }) => {
    const { email, password } = await request.json() as { email: string, password: string };

    if (email === 'invalid@example.com') {
      return HttpResponse.json(
        { errorMsg: 'Account does not exist with the given email' },
        { status: 400 }
      );
    }

    if (password === 'incorrectpassword') {
      return HttpResponse.json(
        { errorMsg: 'Incorrect password' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { token: 'mock-token', userId: '123' },
      { status: 200 }
    );
  }),

  // Send reset password to email
  http.get('http://localhost:3000/send-password-reset-email', ({ request }) => {
    const url = new URL(request.url);
    const email = url.searchParams.get('email') ?? '';

    if (!email.trim()) {
      return HttpResponse.json({ errorMsg: 'Email is required' }, { status: 400 });
    }
    if (email === 'notfound@example.com') {
      return HttpResponse.json({ errorMsg: 'User with this email not found' }, { status: 404 });
    }

    return HttpResponse.json({ success: true, message: 'Reset password email has been sent.' }, { status: 200 });
  }),

  // Validate token
  http.get('http://localhost:3000/reset-password-token/:token', ({ params }) => {
    const token = String(params.token);

    if (token === 'invalid-token') {
      return HttpResponse.json({ errorMsg: "Couldn't find user" }, { status: 404 });
    }
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Reset password
  http.put('http://localhost:3000/reset-password', async ({ request }) => {
    const body = (await request.json()) as { token?: string; password?: string };

    if (body.token === 'expired-token') {
      return HttpResponse.json(
        { errorMsg: 'Reset password token has expired.' },
        { status: 410 }
      );
    }
    return HttpResponse.json({ success: true }, { status: 200 });
  }),

  // Create OTP when Login
  http.post('http://localhost:3000/authentication/create/otp', async ({ request }) => {
    const { userId } = await request.json() as { userId: string };

    if (!userId) {
      return HttpResponse.json(
        { errorMsg: 'User ID is required' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { otpId: 'mock-otp-id', otp: 123456 }, // Test OTP always 123456
      { status: 200 }
    );
  }),

  // Verify OTP when Login
  http.post('http://localhost:3000/authentication/verify/otp', async ({ request }) => {
    const { otpId, otp } = await request.json() as { otpId: string, otp: number };

    if (otpId && otp !== 123456) {
      return HttpResponse.json(
        { errorMsg: 'Incorrect otp number' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { success: true },
      { status: 200 }
    );
  }),

  http.post('http://localhost:3000/logout', async ({ request }) => {
    const { token, userId } = await request.json() as { token: string, userId: string };
    if (token === 'mock-token' && userId === '123') {
      return HttpResponse.json(
        { message: 'Logged out successfully' },
        { status: 200 }
      );
    }
    return HttpResponse.json(
      { errorMsg: 'Invalid token or userId' }, { status: 400 }
    );
  }),

  http.get('http://localhost:3000/user/transaction/history', async () => {
    const userId = useAuthStore.getState().userId;

    if (userId !== '123' || !userId) {
      return HttpResponse.json(
        { errorMsg: 'Invalid user or userId' },
        { status: 400 }
      );
    }

    return HttpResponse.json([
      {
        _id: '3',
        amountDest: 200,
        currencyDest: 'EUR',
        fromAccount: 'Account 3',
        toAccount: 'Account 3',
        fromAccountEmail: 'user@example.com',
        toAccountEmail: 'user@example.com',
        fromAccountId: '123', // current user
        toAccountId: '123', // current user
        description: 'Currency exchange',
        transactionDate: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
      },
      {
        _id: '1',
        amountDest: 100,
        currencyDest: 'AUD',
        fromAccount: 'Account 1',
        toAccount: 'Account 2',
        fromAccountEmail: 'sender@example.com',
        toAccountEmail: 'receiver@example.com',
        fromAccountId: 'sender123',
        toAccountId: '123', // current user is receiver
        description: 'Test incoming transaction',
        transactionDate: new Date(Date.now() - 86400000).toISOString(), // yesterday
      },
      {
        _id: '2',
        amountDest: 50,
        currencyDest: 'USD',
        fromAccount: 'Account 2',
        toAccount: 'Account 3',
        fromAccountEmail: 'sender2@example.com',
        toAccountEmail: 'receiver2@example.com',
        fromAccountId: '123', // current user is sender
        toAccountId: 'receiver123',
        description: 'Test outgoing transaction',
        transactionDate: new Date().toISOString(), // today
      }
    ], { status: 200 });
  }),

  http.get('http://localhost:3000/find/recipients/:email/:userId', async ({ params }) => {
    const email = String(params.email);
    const userId = String(params.userId);

    if (userId !== '123' || !userId) {
      return HttpResponse.json(
        { errorMsg: 'Invalid userId' },
        { status: 404 }
      );
    }

    if (email.toLowerCase() === 'missing@example.com') {
      return HttpResponse.json({ errorMsg: 'Recipient not found.' }, { status: 404 });
    }

    if (email.toLowerCase() === 'no-wallet@example.com') {
      return HttpResponse.json({ errorMsg: 'Recipient has no wallet.' }, { status: 404 });
    }

    if (email === 'SELF') {
      return HttpResponse.json(
        {
          email: 'self@example.com',
          walletInfo: [
            { id: 'w-self-1', currency: 'AUD', balance: 100 },
            { id: 'w-self-2', currency: 'USD', balance: 50 },
          ],
        },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      {
        email,
        walletInfo: [{ id: 'w-xyz', currency: 'AUD', balance: 1000 }],
      },
      { status: 200 }
    );
  }),

  http.get('http://localhost:3000/transaction/save-recipient/:userId', ({ params }) => {
    const userId = String(params.userId);

    if (userId !== '123') {
      return HttpResponse.json(
        { errorMsg: 'Invalid userId' },
        { status: 400 }
      );
    }

    // Return mock saved recipients data
    return HttpResponse.json({
      recipients: [
        {
          email: 'angel@example.com',
          firstName: 'angel',
          lastName: 'francis'
        },
        {
          email: 'hehe@example.com',
          firstName: 'kur',
          lastName: 'chuadri'
        }
      ]
    }, { status: 200 });
  }),

  http.get('http://localhost:3000/exchangerate/:currencySource/:currencyDest', ({ params }) => {
    const currencySource = String(params.currencySource);
    const currencyDest = String(params.currencyDest);

    // Mock rates for common currency pairs
    const rates: Record<string, Record<string, number>> = {
      AUD: { IDR: 10000, USD: 0.7, SGD: 0.9 },
      USD: { AUD: 1.4, IDR: 14000, SGD: 1.35 },
      IDR: { AUD: 0.0001, USD: 0.00007, SGD: 0.00009 },
      SGD: { AUD: 1.1, USD: 0.74, IDR: 11000 }
    };

    if (!rates[currencySource] || !rates[currencySource][currencyDest]) {
      return HttpResponse.json(
        { errorMsg: `Currency exchange from ${currencySource} to ${currencyDest} is not yet supported` },
        { status: 404 }
      );
    }

    return HttpResponse.json(
      { rate: rates[currencySource][currencyDest] },
      { status: 200 }
    );
  }),

  http.get('http://localhost:3000/:userId/rank', ({ params }) => {
    const userId = String(params.userId);

    if (userId !== '123') {
      return HttpResponse.json(
        { errorMsg: `User with id ${userId} not found!` },
        { status: 404 }
      );
    }

    // Default to always bronze rank
    const rank = "bronze";
    return HttpResponse.json(
      { rank },
      { status: 200 }
    );
  }),

  http.post('http://localhost:3000/transaction/send-request', async ({ request }) => {
    const { email, senderId, amount, currency, notes } = await request.json() as { email: string, senderId: string, amount: number, currency: string, notes: string };

    if (!senderId) {
      return HttpResponse.json(
        { errorMsg: 'Invalid senderId or user' },
        { status: 400 }
      );
    }

    if (!email) {
      return HttpResponse.json(
        { errorMsg: 'Recipient not found' },
        { status: 400 }
      );
    }

    if (amount < 0) {
      return HttpResponse.json(
        { errorMsg: 'Invalid request amount' },
        { status: 400 }
      );
    }

    if (!currency) {
      return HttpResponse.json(
        { errorMsg: 'Invalid currency' },
        { status: 400 }
      );
    }

    if (notes.length < 0) {
      return HttpResponse.json(
        { errorMsg: 'Notes cannot be shorter than 0' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { requestId: '456' },
      { status: 200 }
    );
  }),

  http.get('http://localhost:3000/exchangerate/:currencySource/:currencyDest', async ({ params }) => {
    // const currencySource = params.currencySource;
    // const currencyDest = params.currencyDest;
    const { currencySource, currencyDest } = params;

    if (!currencyDest || !currencySource) {
      return HttpResponse.json(
        { errorMsg: 'Currency exchange is not yet supported' }, 
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { rate: 10381.03 },
      { status: 200}
    )
  }),

  http.get('http://localhost:3000/transaction/request/:userId', async ({ params }) => {
    const userId = params.userId;

    if (!userId) {
      return HttpResponse.json(
        { errorMsg: 'User does not exist' }, 
        { status: 400 }
      );
    }

    return HttpResponse.json({ 
      request: [
        {
          requestId: 'request1',
          senderEmail: 'john@example.com',
          requestDate: Date.now(),
          amount: 0.5,
          currency: 'AUD',
          notes: 'test'
        }
      ] 
    });
  }),

  http.post('http://localhost:3000/transaction/request/accept', async ({ request }) => {
    const { requestId } = await request.json() as { requestId: string };

    if (!requestId) {
      return HttpResponse.json(
        { errorMsg: 'Request not found' },
        { status: 400 }
      );
    }

    return HttpResponse.json(
      { success: true },
      { status: 200 }
    );
  }),

  // Mock API calls from the dashboard (Change later)
  http.get('http://localhost:3000/notification/new/:userId', () => {
    return HttpResponse.json({ notifications: [] });
  }),

  http.get('http://localhost:3000/wallet/:userId', async ({ request, params }) => {
    const { userId } = params;
    const url = new URL(request.url);
    const currency = url.searchParams.get('currency');

    // Validate userId
    if (!userId || userId !== '123') {
      return HttpResponse.json(
        { errorMsg: 'Invalid userId' },
        { status: 400 }
      );
    }

    // Handle currency-specific request
    if (currency) {
      const wallet = defaultWallets.find(w => w.walletCurrency === currency);
      if (!wallet) {
        return HttpResponse.json(
          { errorMsg: 'User has no wallet with corresponding currency.' },
          { status: 404 }
        );
      }
      return HttpResponse.json(
        { correspondingWallet: wallet },
        { status: 200 }
      );
    }

    return HttpResponse.json(
      { wallets: defaultWallets },
      { status: 200 }
    );
  }),

  http.post('http://localhost:3000/p2ptransfer', async ({ request }) => {
    const {
      debtorUserId,
      creditor,
      amountSrc,
      amountDest,
      srcCurrency,
      destCurrency
    } = await request.json() as P2PTransferRequest;

    // Validate required fields
    if (!debtorUserId || !creditor || !amountSrc || !amountDest || !destCurrency) {
      return HttpResponse.json(
        { errorMsg: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Mock successful response
    return HttpResponse.json({
      success: true,
      message: "Transfer successful",
      debtorWalletId: defaultWallets[0]._id,
      creditorWalletId: "mock-creditor-wallet-id",
      amountTransferred: `${amountSrc} ${srcCurrency}`,
      newDebtorBalance: defaultWallets[0].walletBalance - amountSrc,
      newCreditorBalance: amountDest + amountDest
    }, { status: 200 });
  }),

  // GET profile
  http.get('http://localhost:3000/user/profile/:userId', ({ params }) => {
    const userId = String(params.userId);
    const user = userDb[userId] ?? { ...defaultUser };

    return HttpResponse.json(user, { status: 200 });
  }),

  // PUT profile
  http.put('http://localhost:3000/user/profile/:userId', async ({ params, request }) => {
    const userId = String(params.userId);
    const incoming = (await request.json()) as Partial<{
      firstName: string | null;
      lastName: string | null;
      dob: string | null;
      addressLine1: string | null;
      addressLine2: string | null;
      country: string | null;
      accountType: 'personal' | 'business';
      profileImg: string;
    }>;

    const current = userDb[userId] ?? { ...defaultUser };

    const updated: UserProfile = {
      ...current,
      firstName: incoming.firstName ?? current.firstName,
      lastName: incoming.lastName ?? current.lastName,
      dob: incoming.dob ?? current.dob,
      address: {
        addressLine1: incoming.addressLine1 ?? current.address.addressLine1,
        addressLine2: incoming.addressLine2 ?? current.address.addressLine2,
        country: incoming.country ?? current.address.country,
      },
      accountType: (incoming.accountType ?? current.accountType),
      profileImg: incoming.profileImg ?? current.profileImg,
    };

    userDb[userId] = updated;
    return HttpResponse.json(updated, { status: 200 });
  }),

  // Block User (Disable Account)
  http.put('http://localhost:3000/admin/block/:userId', ({ params }) => {
    const userId = String(params.userId);
    const current = userDb[userId] ?? { ...defaultUser };
    userDb[userId] = { ...current, isLocked: true };
    return HttpResponse.json({ ok: true }, { status: 200 });
  }),
];

// Create the server
export const server = setupServer(...handlers);

// Setup/teardown functions
export function setupTestServer() {
  beforeAll(() => {
    server.listen({ onUnhandledRequest: 'error' });
  });

  afterEach(() => {
    server.resetHandlers();
    resetUserDb();
  });

  afterAll(() => {
    server.close();
  });
}