import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDisplay } from '../../utils/LocationDisplay';
import { server, setupTestServer } from '../../../__mocks__/server';
import Dashboard from '../Dashboard';
import Recipient from '@/components/transaction/Recipient';
import TransferAmount from '@/components/transaction/TransferAmount';
import Pay from '@/components/transaction/Pay';
import SavedRecipient from '@/components/transaction/SavedRecipient';
import useAuthStore from '@/stores/authStore';
import { useTransactionStore, defaultCurrency } from '@/stores/transactionStore';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import useOtpStore from '@/stores/otpStore';

setupTestServer();

const renderWithQuery = (ui: React.ReactElement) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(<QueryClientProvider client={qc}>{ui}</QueryClientProvider>);
};

const renderTransferFlow = async () => {
  await act(async () => {
    // Set initial state
    useAuthStore.setState({
      userId: '123',
      token: 'mock-token',
      isVerified: true,
      isLocked: false,
      isAuthenticated: true,
    });

    useTransactionStore.setState({
      transactionType: 'transfer',
      currentPage: 1,
      currencyFrom: defaultCurrency,
      recipient: { email: '', walletInfo: [] },
      recipientEmail: '',
      currencyTo: { code: 'IDR', countryCode: 'ID', label: 'Indonesian Rupiah', flag: '🇮🇩', localeString: 'id-ID' },
      rawSourceCurrencyAmount: 0,
      sourceCurrencyAmount: 0,
      rawDestCurrencyAmount: 0,
      destCurrencyAmount: 0,
      serviceFee: 0
    });

    renderWithQuery(
      <MemoryRouter initialEntries={['/transfer/recipient']}>
        <Routes>
          <Route path="/dashboard" element={
            <>
              <Dashboard />
              <LocationDisplay />
            </>
          } />
          <Route path="/transfer/recipient" element={
            <>
              <Recipient />
              <LocationDisplay />
            </>
          } />
          <Route path="/transfer/amount" element={
            <>
              <TransferAmount />
              <LocationDisplay />
            </>
          } />
          <Route path="/transfer/pay" element={
            <>
              <Pay />
              <LocationDisplay />
            </>
          } />
          <Route path="/transfer/recipient/search" element={
            <>
              <SavedRecipient />
              <LocationDisplay />
            </>
          } />
        </Routes>
      </MemoryRouter>
    );
  });
};

const navigateToAmountPage = async (user: ReturnType<typeof userEvent.setup>, email: string) => {
  // Fill and submit recipient form
  const emailInput = screen.getByPlaceholderText(/email/i);
  await user.type(emailInput, email);
  await user.click(screen.getByTestId('first-continue-btn'));

  await waitFor(() => {
    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/amount');
  });
};

const navigateToPayPage = async (user: ReturnType<typeof userEvent.setup>, email: string, amount: number) => {
  await navigateToAmountPage(user, email);
  const sourceInput = screen.getByTestId('source-currency-input');

  // Enter amount (bronze user with 0.05% fee)
  await act(async () => {
    await user.type(sourceInput, String(amount));
  });

  await user.click(screen.getByRole('button', { name: /continue/i }));
  await waitFor(() => {
    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/pay');
  });
};

describe("Transfer page testing", () => {
  beforeEach(async () => {
    await renderTransferFlow();
  });
  
  afterEach(async () => {
    await act(async () => {
      sessionStorage.clear();
      useAuthStore.getState().resetAuth();
      useTransactionStore.getState().resetTransfer();
    });
  });

  it('able to click X icon in transfer/recipient', async () => {
    const user = userEvent.setup();

    // Wait for the recipient page to load
    await screen.findByText(/who are you sending money to/i);

    await act(async () => {
      await user.click(screen.getByTestId('header-close-x-button'));
    });

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard');
    });
  });

  it('locked notification and continue button disabled', async () => {
    const user = userEvent.setup();

    await act(async () => {
      useAuthStore.setState({ isLocked: true });
    });

    expect(await screen.findByText(/Your account is locked. You won't be able to access this feature./i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const continueBtn = screen.getByTestId('first-continue-btn');

    await act(async () => {
      await user.type(emailInput, 'friend@example.com');
    });
    expect(continueBtn).toBeDisabled();
  });

  it('unverified notification and continue button disabled', async () => {
    const user = userEvent.setup();

    await act(async () => {
      useAuthStore.setState({ isVerified: false });
    });

    expect(await screen.findByText(/your account is not verified yet/i)).toBeInTheDocument();

    const emailInput = screen.getByPlaceholderText(/email/i);
    const continueBtn = screen.getByTestId('first-continue-btn');

    await act(async () => {
      await user.type(emailInput, 'friend@example.com');
    });
    expect(continueBtn).toBeDisabled();

    // Test verified state
    await act(async () => {
      useAuthStore.setState({ isVerified: true });
    });

    await waitFor(() => {
      expect(screen.queryByText(/your account is not verified yet/i)).not.toBeInTheDocument();
    });
  });

  it('validates email and continue disabled until valid', async () => {
    const user = userEvent.setup();

    await screen.findByText(/who are you sending money to/i);

    const emailInput = screen.getByPlaceholderText(/email/i);
    const continueBtn = screen.getByTestId('first-continue-btn');

    // Invalid email
    await act(async () => {
      await user.type(emailInput, 'not-an-email');
    });
    expect(continueBtn).toBeDisabled();

    // Valid email
    await act(async () => {
      await user.clear(emailInput);
      await user.type(emailInput, 'friend@example.com');
    });
    await waitFor(() => expect(continueBtn).toBeEnabled());
  });

  it('shows API error for missing recipient and stays on the page', async () => {
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'missing@example.com');
    await user.click(screen.getByTestId('first-continue-btn'));

    // Error shown
    expect(await screen.findByText(/recipient not found/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/recipient');
  });

  it('shows API error when recipient has no wallet', async () => {
    const user = userEvent.setup();

    await user.type(screen.getByPlaceholderText(/email/i), 'no-wallet@example.com');
    await user.click(screen.getByTestId('first-continue-btn'));

    // Error shown
    expect(await screen.findByText(/recipient has no wallet/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/recipient');
  });

  it('Search saved recipients navigation and functionality', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /search saved recipients/i }));
    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/recipient/search');
    await waitFor(() => {
      expect(screen.getByText(/angel francis/i)).toBeInTheDocument();
      expect(screen.getByText(/kur chuadri/i)).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/Search users by email/i);
    await act(async () => {
      await user.type(searchInput, 'nobody');
    });

    await waitFor(() => {
      expect(screen.queryByText(/angel francis/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/kur chuadri/i)).not.toBeInTheDocument();
    });

    await act(async () => {
      await user.clear(searchInput);
      await user.type(searchInput, 'angel');
    });

    await waitFor(() => {
      expect(screen.getByText(/angel francis/i)).toBeInTheDocument();
      expect(screen.queryByText(/kur chuadri/i)).not.toBeInTheDocument();
    });

    // Test clicking a recipient
    await act(async () => {
      await user.click(screen.getByText(/angel francis/i));
    });

    // Verify navigation back to recipient page
    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/recipient');
  });

  it('“Send to yourself” calls API with SELF and navigates', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /send to yourself/i }));

    await waitFor(() =>
      expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/amount')
    );

    const { recipient } = useTransactionStore.getState();
    expect(recipient.email).toBe('self@example.com');
  });

  it('successful input navigates to /transfer/amount, verifies recipient and exchange rate', async () => {
    expect(screen.queryByText(/your account is not verified yet/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await navigateToAmountPage(user, "friend@example.com");

    // verify transaction store was updated
    const { recipient } = useTransactionStore.getState();
    expect(recipient.email).toBe('friend@example.com');
    expect(Array.isArray(recipient.walletInfo)).toBe(true);
    expect(recipient.walletInfo.length).toBeGreaterThan(0);

    expect(await screen.findByText(/You send exactly/i)).toBeInTheDocument();
    // getAllByText: the new sidebar shell (Task 2) also lists wallet currency codes,
    // so exact-text matches for "AUD"/"IDR" are no longer unique on the page.
    expect(screen.getAllByText('AUD').length).toBeGreaterThan(0);
    expect(screen.getAllByText('IDR').length).toBeGreaterThan(0);

    // Verify exchange rate is displayed (mock rate is IDR 10.000)
    expect(screen.getByText(/1 AUD = 10.000,00000000 IDR/i)).toBeInTheDocument();
  });

  it("Calculates amount correctly when entering source amount, navigates to /transfer/pay on success", async () => {
    expect(screen.queryByText(/your account is not verified yet/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await navigateToAmountPage(user, 'friend@example.com');

    const sourceInput = screen.getByTestId('source-currency-input');

    // Enter amount (bronze user with 0.05% fee)
    await act(async () => {
      await user.type(sourceInput, '100');
    });

    // Verify input value
    await waitFor(() => {
      expect(sourceInput).toHaveValue(100);
    });

    // Check store values
    const {
      rawSourceCurrencyAmount,
      sourceCurrencyAmount,
      rawDestCurrencyAmount
    } = useTransactionStore.getState();

    // Verify calculations
    expect(rawSourceCurrencyAmount).toBe(100); // 100 * (1 - 0.05)
    expect(sourceCurrencyAmount).toBe(95); // 100 * (1 - 0.05)
    expect(rawDestCurrencyAmount).toBe(1000000); // 100 * 10000

    await waitFor(() => {
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
    });

    // Verify rawDest calculated amounts (100 AUD × 10,000 = 1.000.000 IDR)
    await waitFor(() => {
      expect(screen.getByText(/recipient gets/i)).toBeInTheDocument();
      expect(screen.getByText(/1.000.000/)).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /continue/i }));
    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/pay');
    });
  });

  it('shows error when exchange rate fetch fails', async () => {
    // Override the mock server handler for this test
    server.use(
      http.get('http://localhost:3000/exchangerate/AUD/IDR', () => {
        return HttpResponse.json(
          { errorMsg: 'Failed to fetch exchange rate' },
          { status: 500 }
        );
      })
    );
    expect(screen.queryByText(/your account is not verified yet/i)).not.toBeInTheDocument();

    const user = userEvent.setup();
    await navigateToAmountPage(user, 'friend@example.com');

    // Verify error is shown
    expect(await screen.findByText(/Failed to fetch exchange rate/i)).toBeInTheDocument();
  });

  it('prevents navigation with invalid amount', async () => {
    const user = userEvent.setup();
    await navigateToAmountPage(user, 'friend@example.com');

    const continueBtn = screen.getByRole('button', { name: /continue/i });

    // Button should be disabled initially
    expect(continueBtn).toBeDisabled();

    // Enter invalid amount (0)
    const sourceInput = screen.getByTestId('source-currency-input');
    await act(async () => {
      await user.type(sourceInput, '0');
    });

    // Button should still be disabled
    expect(continueBtn).toBeDisabled();
  });

  it('successful rendering of /transfer/pay with all the payment details', async () => {
    const user = userEvent.setup();
    await navigateToPayPage(user, 'friend@example.com', 100); // send 100 AUD

    expect(screen.getByText(/pay with your finpay card/i)).toBeInTheDocument();

    expect(screen.getByText(/your current balance/i)).toBeInTheDocument();
    expect(screen.getByText(/500.00 AUD/i)).toBeInTheDocument(); // default balance in wallet1 is 500 AUD

    expect(screen.getByText(/you send exactly/i)).toBeInTheDocument();
    expect(screen.getByText(/100.00 AUD/i)).toBeInTheDocument();

    expect(screen.getByText(/service fee: \(included in total amount\)/i)).toBeInTheDocument();
    expect(screen.getByText(/5 AUD/i)).toBeInTheDocument(); // service fee: 100 x 0.05 (bronze fee)

    expect(screen.getByText(/Recipient receives exactly/i)).toBeInTheDocument();
    expect(screen.getByText(/950000.00 IDR/i)).toBeInTheDocument();

    expect(screen.getByText(/balance after transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/400.00 AUD/i)).toBeInTheDocument();
  });

  it('payment successful for p2p transfer and check SuccessfulTransferModal', async () => {
    const user = userEvent.setup();
    await navigateToPayPage(user, 'friend@example.com', 10); // send 10 AUD
    expect(screen.getByText(/pay with your finpay card/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('button-pay'));

    // Verify success modal appears
    expect(await screen.findByText(/transfer successful/i)).toBeInTheDocument();
    expect(screen.getByText(/transfer details/i)).toBeInTheDocument();

    expect(screen.getAllByText(/you send exactly/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/10.00 AUD/i).length).toBeGreaterThan(0);

    expect(screen.getByText(/total fees \(included\)/i)).toBeInTheDocument();
    expect(screen.getByText(/0.05 AUD/i)).toBeInTheDocument();

    expect(screen.getByText(/total amount we'll convert/i)).toBeInTheDocument();
    expect(screen.getByText(/9.95 AUD/i)).toBeInTheDocument();

    expect(screen.getByText(/guaranteed rate/i)).toBeInTheDocument();
    expect(screen.getByText(/1 AUD = 9.547,74 IDR/i)).toBeInTheDocument();

    expect(screen.getByText(/recipient gets/i)).toBeInTheDocument();
    expect(screen.getByText(/95.000 IDR/i)).toBeInTheDocument();

    expect(screen.getByText(/recipient details/i)).toBeInTheDocument();
    expect(screen.getByText(/friend@example.com/i)).toBeInTheDocument();

    expect(screen.getByText(/make another transaction/i)).toBeInTheDocument();
    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
  });

  it('shows authentication modal for large amounts (above > 50)', async () => {
    const user = userEvent.setup();
    await navigateToPayPage(user, 'friend@example.com', 100); // payment over 50 AUD shows authenticationModal
    expect(screen.getByText(/pay with your finpay card/i)).toBeInTheDocument();

    await user.click(screen.getByTestId('button-pay'));

    // Verify OTP modal appears
    await waitFor(() => {
      expect(screen.getByText(/Two-Factor Authentication/i)).toBeInTheDocument();
      expect(screen.getByText(/Enter the 6-digit code we sent to your email/i)).toBeInTheDocument();
    });

    // Enter the test OTP (123456)
    await user.type(screen.getByTestId('otp-input-0'), '1');
    await user.type(screen.getByTestId('otp-input-1'), '2');
    await user.type(screen.getByTestId('otp-input-2'), '3');
    await user.type(screen.getByTestId('otp-input-3'), '4');
    await user.type(screen.getByTestId('otp-input-4'), '5');
    await user.type(screen.getByTestId('otp-input-5'), '6');

    expect(screen.getByTestId('location-display')).toHaveTextContent('/transfer/pay');

    // Submit OTP
    await user.click(screen.getByTestId("submit-authentication-button"));

    // Verify successful authentication
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useOtpStore.getState().isOTPVerified).toBe(true);
    });
  });
});