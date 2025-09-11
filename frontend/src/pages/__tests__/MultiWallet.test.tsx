import ProtectedRoute from "@/ProtectedRoute";
import '@testing-library/jest-dom';
import { fireEvent, render, screen, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { LocationDisplay } from "@/utils/LocationDisplay";
import Dashboard from "../Dashboard";
import AddCurrencyModal from "@/components/modal/AddCurrencyModal";
import { setupTestServer } from "../../../__mocks__/server";
import { useTransactionStore } from "@/stores/transactionStore";
import { act } from "react";
import MockCurrencies from "../../../__mocks__/MockCurrencies"

setupTestServer();

const closedModal = jest.fn();
const addCurrency = jest.fn();

describe("Test for Adding a new currency", () => {
  beforeEach(() => {
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
        </Routes>
      </MemoryRouter>
    );
    render(<AddCurrencyModal onClose={closedModal} onAddCurrency={addCurrency}/>);
  });

  it('rendering currency wallet UI', async () => {
    expect(screen.getByTestId('total-balance-heading')).toBeInTheDocument();
    expect(screen.getByTestId('wallet-currency')).toBeInTheDocument();
    expect(screen.getByTestId('aud-currency')).toBeInTheDocument();

    expect(screen.getByTestId('wallet-addition')).toBeInTheDocument();
  });

  it('open the new currency dialog in multi wallet', async () => {
    const addCurrencyBtn = screen.getByTestId('wallet-addition');
    fireEvent.click(addCurrencyBtn);

    // Opens the add currency dialog
    const currencyDialog = screen.getAllByTestId('add-currency-dialog');
    expect(currencyDialog.length).toBeGreaterThan(0);

    // Dialog's header
    const currencyDialogHead = await screen.findAllByRole('heading', { name: /Add a balance/i});
    expect(currencyDialogHead.length).toBeGreaterThan(0);

    // Close button
    const closeCurrencyDialog = screen.getAllByRole('button', { name: /add-currency-close/i });
    // expect(closeCurrencyDialog.length).toBeGreaterThan(0);
    fireEvent.click(closeCurrencyDialog[0]);

    // Search bar (input) for filtering (regex matching) certain currencies
    const currencyFilters = screen.getAllByTestId('currency-filter');
    expect(currencyFilters.length).toBeGreaterThan(0);
  });

  it('using the filter input', async () => {
    // calls the currencies list for testing
    const mockCurrenciesList = MockCurrencies;

    // For React state updates
    act(() => {
      useTransactionStore.setState({ currencies: mockCurrenciesList });
    });

    const currencyFilters = screen.getAllByTestId('currency-filter');

    // Filtering for Indonesian Rupiah
    fireEvent.change(currencyFilters[0], { target: { value: 'idr' } });
    expect(screen.getByText(/Indonesian Rupiah/i)).toBeInTheDocument();

    // Filtering for a non existing currency
    fireEvent.change(currencyFilters[0], { target: { value: 'hsr' } });
    expect(screen.getByText(/No currencies found/i)).toBeInTheDocument();

    // Multiple currencies filtered from initial search matching (by currency code then regex), and ensuring certain currencies matching the filter are displayed
    fireEvent.change(currencyFilters[0], { target: { value: 'aud' } });
    expect(screen.getByText(/Australian Dollar/i)).toBeInTheDocument();
    expect(screen.getByText(/Saudi Riyal/i)).toBeInTheDocument();
    expect(screen.queryByText(/Singapore Dollar/i)).not.toBeInTheDocument();
  });

  it('selecting and adding new currencies', async () => {
    const currencyFilters = screen.getAllByTestId('currency-filter');

    fireEvent.change(currencyFilters[0], { target: { value: 'sgd' } });
    expect(screen.getByText(/Singapore Dollar/i)).toBeInTheDocument();

    // renders the filtered currencies (SGD)
    const specificCurrency = screen.getAllByRole('button', { name: /select-specific-currency/i });
    fireEvent.click(specificCurrency[0]);

    const addCurrencyBtns = screen.getAllByRole('button', { name: /add-specific-currency/i });
    fireEvent.click(addCurrencyBtns[0]);

    // addCurrency prop called and new currency added
    expect(addCurrency).toHaveBeenCalledTimes(1);

    const sgCurrencyObj = expect.objectContaining({
      countryCode: 'SG',
      currencyName: 'Singapore Dollar',
      walletCurrency: 'SGD',
      walletBalance: 0 
    });

    expect(addCurrency).toHaveBeenCalledWith(sgCurrencyObj);

    // adding a second currency (case if the user searches by first three characters of the country)
    fireEvent.change(currencyFilters[0], { target: { value: 'chi' } });
    expect(screen.getByText(/Chilean Peso/i)).toBeInTheDocument();
    expect(screen.getByText(/Chinese Yuan/i)).toBeInTheDocument();

    const yuanSelect = screen.getByText(/Chinese Yuan/i).closest('li');
    expect(yuanSelect).not.toBeNull();

    const secondSpecificCurrency = within(yuanSelect!).getByRole('button', { name: /select-specific-currency/i });
    fireEvent.click(secondSpecificCurrency);

    const secondAddCurrencyBtns = screen.getByRole('button', { name: /add-specific-currency/i });
    fireEvent.click(secondAddCurrencyBtns);

    // Since the 2nd currency is added right after the first
    expect(addCurrency).toHaveBeenCalledTimes(2);

    expect(addCurrency).toHaveBeenNthCalledWith(
      1, expect.objectContaining({
        countryCode: 'SG',
        currencyName: 'Singapore Dollar',
        walletCurrency: 'SGD',
        walletBalance: 0 
      })
    );
    expect(addCurrency).toHaveBeenNthCalledWith(
      2, expect.objectContaining({
        countryCode: 'CN',
        currencyName: 'Chinese Yuan',
        walletCurrency: 'CNY',
        walletBalance: 0 
      })
    );
  });
});