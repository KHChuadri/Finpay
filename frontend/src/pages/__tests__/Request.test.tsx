import '@testing-library/jest-dom';
import { setupTestServer } from '../../../__mocks__/server';
import { describe } from 'node:test';
import useAuthStore from '@/stores/authStore';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/ProtectedRoute';
import Dashboard from '../Dashboard';
import { LocationDisplay } from '@/utils/LocationDisplay';
import Recipient from '@/components/transaction/Recipient';
import RequestAmount from '@/components/transaction/RequestAmount';
import Request from '@/components/transaction/Request';
import History from '../History';
import RequestListPage from '../RequestListPage';
import Login from '../Login';

setupTestServer();

const routeRender = (route: string) => {
  render(
    <MemoryRouter initialEntries={[route]}>
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute auth>
              <>
                <Dashboard />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/login" element={
            <ProtectedRoute auth>
              <>
                <Login />
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
          <Route path="/request/list" element={
            <ProtectedRoute auth>
              <>
                <RequestListPage />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
      </Routes>
    </MemoryRouter>
  );
}

const navMock = jest.fn();
jest.mock('react-router-dom', () => {
  return {
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => navMock
  }
});

describe("Request balance test", () => {
  it('navigating and rendering initial request list page', async () => {
    useAuthStore.setState({ userId: '123', token: 'mock-token', isVerified: true, isLocked: false });
    routeRender('/dashboard');
    
    const requestListNav = screen.getByTestId('sidebar-nav-requests');
    expect(requestListNav).toBeInTheDocument();

    fireEvent.click(requestListNav);
    
    // The request list page (with no requests)
    await waitFor(() => {
      expect(navMock).toHaveBeenCalledWith('/request/list')
    })
    routeRender('/request/list');

    await waitFor(() => {
      expect(screen.getByTestId('request-list-header')).toBeInTheDocument();
      expect(screen.getByTestId('no-requests')).toBeInTheDocument();
    });

    const newRequestBtn = screen.getByTestId('new-request-button');
    expect(newRequestBtn).toBeInTheDocument();

    fireEvent.click(newRequestBtn);

    await waitFor(() => {
      expect(navMock).toHaveBeenCalledWith('/request/recipient')
    })
  });

  it('rendering and filling the fields for making a request', async () => {
    // explicit token: null — test 1 leaves a token set (shallow-merged store), which
    // would otherwise trigger syncUserStatus and race isVerified back to false mid-test
    useAuthStore.setState({ userId: '123', token: null, isVerified: true, isLocked: false });
    routeRender('/dashboard');

    await waitFor(() => {
      expect(screen.getByTestId('wallet-currency')).toBeInTheDocument();
    });

    routeRender('/request/recipient');
    
    expect(screen.getByText(/Who are you requesting money from?/i)).toBeInTheDocument();
    expect(screen.getByTestId('email-request-input')).toBeInTheDocument();
    
    // Initially disabled before user inputs email
    const continueBtn = screen.getByTestId('first-continue-btn');
    expect(continueBtn).toBeDisabled();
    
    fireEvent.change(screen.getByTestId('email-request-input'), { target: { value: 'valid@gmail.com' } });
    
    // continue button enables after email is inputted
    await waitFor(() => {
      expect(continueBtn).not.toBeDisabled();
    });
    
    fireEvent.click(continueBtn);
    
    await waitFor(() => {
      expect(navMock).toHaveBeenCalledWith('/request/amount')
    })
    routeRender('/request/amount');
    // protected route for request amount after request email
    await waitFor(() => {
      expect(screen.getByTestId('you-request')).toBeInTheDocument();
      expect(screen.getByTestId('amount-req-input')).toBeInTheDocument()
    });
    
    fireEvent.change(screen.getByTestId('amount-req-input'), { target: { value: '0.3' } });
    fireEvent.change(screen.getByTestId('request-reason'), { target: { value: 'borrowing small change' } });
    
    const secondContinueBtn = screen.getByTestId('amount-continue-button');    
    expect(secondContinueBtn).not.toBeDisabled();
    fireEvent.click(secondContinueBtn);

    await waitFor(() => {
      expect(navMock).toHaveBeenCalledWith('/request/details')
    })
    routeRender('/request/details');
    
    // another protected route: request details summary and confirmation
    await waitFor(() => {
      expect(screen.getByTestId('request-details')).toBeInTheDocument();
    });
    
    // Details render on request details
    expect(screen.getByTestId('requested-amount')).toBeInTheDocument();
    expect(screen.getByTestId('target-recipient')).toBeInTheDocument();
    expect(screen.getByTestId('recipient-note')).toBeInTheDocument();
    expect(screen.getByTestId('date-of-request')).toBeInTheDocument();
    
    const requestConfirmBtn = screen.getByTestId('request-confirmation');
    fireEvent.click(requestConfirmBtn);
    
    // Modal confirmation popup
    await waitFor(() => {
      expect(screen.getByTestId('request-success-heading')).toBeInTheDocument();
    });
    expect(screen.getByTestId('request-summary-sentence')).toBeInTheDocument();
    
    const anotherRequestBtn = screen.getByTestId('another-request-button');
    expect(anotherRequestBtn).toBeInTheDocument();
    
    // returns to dashboard
    const dashboardReturnBtn = screen.getByTestId('dashboard-request-return');
    fireEvent.click(dashboardReturnBtn);

    // dashboard (rendered at the top of this test) is still mounted
    expect(screen.getByTestId('wallet-currency')).toBeInTheDocument();
  });
});