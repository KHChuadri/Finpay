import '@testing-library/jest-dom';
import { setupTestServer } from '../../../__mocks__/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import { LocationDisplay } from '@/utils/LocationDisplay';
import Dashboard from '../Dashboard';
import History from '../History';
import useAuthStore from '@/stores/authStore';
import useHistoryStore from '@/stores/historyStore';
import userEvent from '@testing-library/user-event';

setupTestServer();

const renderHistoryFlow = async () => {
  await act(async () => {
    // Set initial state
    useAuthStore.setState({
      userId: '123',
      token: 'mock-token',
      isVerified: true,
      isLocked: false,
      isAuthenticated: true,
    });

    useHistoryStore.setState({
      showModal: false,
      currencyExchange: false,
      incomingTransfer: false,
      outgoingTransfer: false,
      allTransaction: true,
      startingDate: null,
      endingDate: null,
    });

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/dashboard" element={
            <>
              <Dashboard />
              <LocationDisplay />
            </>
          } />
          <Route path="/history" element={
            <>
              <History />
              <LocationDisplay />
            </>
          } />
        </Routes>
      </MemoryRouter>
    );
  });
};

// Helper function to navigate to history page
const navigateToHistoryPage = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByTestId("view-history-button"));

  await waitFor(() => {
    expect(screen.getByTestId('location-display')).toHaveTextContent('/history');
  });
};

describe("History page test", () => {
  beforeEach(async () => {
    await renderHistoryFlow();
  });

  afterEach(async () => {
    await act(async () => {
      sessionStorage.clear();
      useAuthStore.getState().resetAuth();
      useHistoryStore.getState().reset();
    });
  });

  it("renders history page successfully from dashboard", async () => {
    const user = userEvent.setup();
    await navigateToHistoryPage(user);

    await waitFor(() => {
      expect(screen.getByTestId("history-header")).toBeInTheDocument();
    });
    expect(screen.queryByText(/no transactions found/i)).not.toBeInTheDocument();
  });

  it("displays transaction history items based on history data", async () => {
    const user = userEvent.setup();
    await navigateToHistoryPage(user);

    await waitFor(() => {
      expect(screen.getAllByTestId('history-item')).toHaveLength(3);
    });

    screen.debug(undefined, 300000);
    expect(screen.queryByText(/no transactions found/i)).not.toBeInTheDocument();

    // Transaction type 1 (sent to)
    expect(screen.getByText(/Today/i)).toBeInTheDocument();
    expect(screen.getByText(/sent to/i)).toBeInTheDocument();
    expect(screen.getByText(/receiver2@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/- USD 50.00/i)).toBeInTheDocument();
    expect(screen.getByText(/description: test outgoing transaction/i)).toBeInTheDocument();

    // Transaction type 2 (received from)
    expect(screen.getByText(/Yesterday/i)).toBeInTheDocument();
    expect(screen.getAllByText(/received from/i)).toHaveLength(2);
    expect(screen.getByText(/sender@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ \$100.00/i)).toBeInTheDocument();
    expect(screen.getByText(/description: test incoming transaction/i)).toBeInTheDocument();

    // Transaction type 3 (currency exchange)
    expect(screen.getByText(/2 days ago/i)).toBeInTheDocument();
    expect(screen.getAllByText(/received from/i)).toHaveLength(2);
    expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
    expect(screen.getByText(/\+ EUR 200.00/i)).toBeInTheDocument();
    expect(screen.getByText(/description: self transfer/i)).toBeInTheDocument();
  });

  it("opens and applies filters from filter modal", async () => {
    const user = userEvent.setup();
    await navigateToHistoryPage(user);

    // Open filter modal
    await user.click(screen.getByTestId('history-filters-button'));
    expect(await screen.findByTestId('history-filter-modal')).toBeInTheDocument();
    expect(screen.getByText('Transaction Types')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();

    // Apply incoming transfer filter
    await user.click(screen.getByText('Incoming Transfer'));
    await user.click(screen.getByTestId('apply-filters-button'));

    await waitFor(() => {
      expect(screen.getAllByTestId('history-item')).toHaveLength(2);
      expect(screen.getAllByText(/received from/i)).toHaveLength(2);
      expect(screen.getByText(/sender@example.com/i)).toBeInTheDocument();
      expect(screen.queryByText(/receiver2@example.com/i)).not.toBeInTheDocument();
    });

    // Reopen filter modal and apply outgoing transfer filter
    await user.click(screen.getByTestId('history-filters-button'));
    expect(await screen.findByTestId('history-filter-modal')).toBeInTheDocument();

    // Apply outgoing transfer filter
    await user.click(screen.getByText('Outgoing Transfer'));
    await user.click(screen.getByText('Incoming Transfer')); // removes the filter from previous click
    await user.click(screen.getByTestId('apply-filters-button'));

    await waitFor(() => {
      expect(screen.getAllByTestId('history-item')).toHaveLength(1);
      expect(screen.getAllByText(/sent to/i)).toHaveLength(1);
      expect(screen.getByText(/receiver2@example.com/i)).toBeInTheDocument();
      expect(screen.queryByText(/sender@example.com/i)).not.toBeInTheDocument();
    });

    // Reopen filter modal and apply currency exchange filter
    await user.click(screen.getByTestId('history-filters-button'));
    expect(await screen.findByTestId('history-filter-modal')).toBeInTheDocument();

    // Apply outgoing transfer filter
    const currencyExchangeFilter = screen.getAllByText('Currency Exchange');
    await user.click(currencyExchangeFilter[1]);
    await user.click(screen.getByText('Outgoing Transfer')); // removes the filter from previous click
    await user.click(screen.getByText('Incoming Transfer')); // removes the filter from previous click
    await user.click(screen.getByTestId('apply-filters-button'));

    await waitFor(() => {
      expect(screen.getAllByTestId('history-item')).toHaveLength(2);
      expect(screen.getAllByText(/received from/i)).toHaveLength(2);
      expect(screen.getByText(/user@example.com/i)).toBeInTheDocument();
      expect(screen.queryByText(/receiver2@example.com/i)).not.toBeInTheDocument();
      expect(screen.getByText(/description: self transfer/i)).toBeInTheDocument();
    });
  });

  it("filters transactions by search term", async () => {
    const user = userEvent.setup();
    await navigateToHistoryPage(user);

    // Open filter modal
    await user.click(screen.getByTestId('history-filters-button'));
    expect(await screen.findByTestId('history-filter-modal')).toBeInTheDocument();

    // Search for a specific email
    const searchInput = screen.getByTestId('search-email-input');
    await user.type(searchInput, 'sender@example.com');

    await waitFor(() => {
      expect(screen.getAllByTestId('history-item')).toHaveLength(1);
      expect(screen.getByText(/Yesterday/i)).toBeInTheDocument();
      expect(screen.getAllByText(/received from/i)).toHaveLength(1);
      expect(screen.getByText(/sender@example.com/i)).toBeInTheDocument();
      expect(screen.getByText(/\+ \$100.00/i)).toBeInTheDocument();
      expect(screen.getByText(/description: test incoming transaction/i)).toBeInTheDocument();
    });

    // Clear search
    await user.clear(searchInput);
    await waitFor(() => {
      expect(screen.getAllByTestId('history-item')).toHaveLength(3);
    });
  });

  it("displays empty state when no transactions match filters", async () => {
    const user = userEvent.setup();
    await navigateToHistoryPage(user);

    // Open filter modal
    await user.click(screen.getByTestId('history-filters-button'));
    expect(await screen.findByTestId('history-filter-modal')).toBeInTheDocument();
    expect(screen.getByText('Date Range')).toBeInTheDocument();

    // Set a date range that won't match any transactions
    const startDateInput = screen.getByLabelText('From:');
    const endDateInput = screen.getByLabelText('To:');

    // Clear any existing values first
    await user.clear(startDateInput);
    await user.clear(endDateInput);

    await user.type(startDateInput, '2023-01-01');
    await user.type(endDateInput, '2023-01-02');

    expect(startDateInput).toHaveValue('2023-01-01');
    expect(endDateInput).toHaveValue('2023-01-02');
    await user.click(screen.getByTestId('apply-filters-button'));

    await waitFor(() => {
      expect(screen.getByText('No transactions found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your filters or search term')).toBeInTheDocument();
    });
  });
});