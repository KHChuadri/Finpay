import ProtectedRoute from '@/ProtectedRoute';
import '@testing-library/jest-dom';
import { setupTestServer } from '../../../__mocks__/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { LocationDisplay } from '@/utils/LocationDisplay';
import Dashboard from '../Dashboard';
import ProfilePage from '../ProfilePage';
import Recipient from '@/components/transaction/Recipient';
import History from '../History';
import AddCurrencyModal from '@/components/modal/AddCurrencyModal';
import RequestAmount from '@/components/transaction/RequestAmount';
import Request from '@/components/transaction/Request';
import Deposit from '@/components/transaction/Deposit';
import Withdraw from '@/components/transaction/Withdraw';
import useAuthStore from '@/stores/authStore';

setupTestServer();

describe("Dashboard testing", () => {
  beforeEach(() => {
    useAuthStore.setState({ userId: '123', token: 'mock-token', isVerified: true, isLocked: false });
    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={
            <ProtectedRoute auth>

              <>
                <Dashboard />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/profile" element={
            <ProtectedRoute auth>
              <>
                <ProfilePage />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/request/recipient" element={
            <ProtectedRoute auth>
              <>
                <Recipient />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/transfer/recipient" element={
            <ProtectedRoute auth>
              <>
                <Recipient />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/request/amount" element={
            <ProtectedRoute auth>
              <>
                <RequestAmount />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/request/details" element={
            <ProtectedRoute auth>
              <>
                <Request />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/history" element={
            <ProtectedRoute auth>
              <>
                <History />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/deposit" element={
            <ProtectedRoute auth>
              <>
                <Deposit />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/withdraw" element={
            <ProtectedRoute auth>
              <>
                <Withdraw />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );
  });

  it('renders the top part of dashboard page', async () => {
    expect(screen.getByTestId('Send-dashboard-button')).toBeInTheDocument();
    expect(screen.getByTestId('Deposit-dashboard-button')).toBeInTheDocument();
    expect(screen.getByTestId('Withdraw-dashboard-button')).toBeInTheDocument();
    expect(screen.getByTestId('Convert-dashboard-button')).toBeInTheDocument();

  });

  it('rendering currency wallet UI', async () => {
    expect(screen.getByText(/Total balance/i)).toBeInTheDocument();
    expect(screen.getByTestId('wallet-currency')).toBeInTheDocument();
    expect(screen.getByText(/AUD/i)).toBeInTheDocument();

    expect(screen.getByTestId('wallet-addition')).toBeInTheDocument();
  });

  it('opening the new currency dialog in multi wallet', async () => {
    const closedModal = jest.fn();
    const addCurrency = jest.fn();
    render(<AddCurrencyModal onClose={closedModal} onAddCurrency={addCurrency} />)

    const addCurrencyBtn = screen.getByTestId('wallet-addition');
    fireEvent.click(addCurrencyBtn);

    // Opens the add currency dialog
    const currencyDialog = screen.getAllByTestId('add-currency-dialog');
    expect(currencyDialog.length).toBeGreaterThan(0);

    const currencyDialogHead = await screen.findAllByRole('heading', { name: /Add a balance/i });
    expect(currencyDialogHead.length).toBeGreaterThan(0);

    const closeCurrencyDialog = screen.getAllByRole('button', { name: /add-currency-close/i });
    fireEvent.click(closeCurrencyDialog[0]);

    const currencyFilters = screen.getAllByTestId('currency-filter');
    expect(currencyFilters.length).toBeGreaterThan(0);
  });

  it('test navigation to send requests when clicked, then navigating back to dashboard', async () => {
    const sendRequestsBtn = screen.getByTestId('Send-dashboard-button');
    fireEvent.click(sendRequestsBtn);

    expect(screen.getByText(/Who are you sending money to?/i)).toBeInTheDocument();
    expect(screen.getByTestId('email-request-input')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Continue/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Search saved recipients/i })).toBeInTheDocument();

    const finpayHomeBtn = await screen.findByTestId('finpay-header-logo');
    expect(finpayHomeBtn).toBeInTheDocument();
    fireEvent.click(finpayHomeBtn);
  });

  it('navigate to history page', async () => {
    const historyBtn = screen.getByTestId('sidebar-nav-transactions');
    fireEvent.click(historyBtn);
    expect(await screen.findByTestId('history-page')).toBeInTheDocument();

    expect(screen.getByTestId('history-header')).toBeInTheDocument();
    expect(screen.getByTestId('search-email-input')).toBeInTheDocument();
    expect(screen.getByTestId('history-filters-button')).toBeInTheDocument();
    expect(screen.getByTestId('history-timeline')).toBeInTheDocument();
  });
});