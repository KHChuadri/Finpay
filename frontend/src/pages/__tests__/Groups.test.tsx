import '@testing-library/jest-dom';
import { setupTestServer } from '../../../__mocks__/server';
import { describe } from 'node:test';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import ProtectedRoute from '@/ProtectedRoute';
import Dashboard from '../Dashboard';
import { LocationDisplay } from '@/utils/LocationDisplay';
import SplitBill from '../SplitBill';
import useAuthStore from '@/stores/authStore';

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
          <Route path="/groups" element={
            <ProtectedRoute auth>
              <>
                <SplitBill />
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

describe('Group and shared wallet testing', () => {
  it('navigating to splitbill page', () => {
    useAuthStore.setState({ userId: '123', token: 'mock-token', isVerified: true, isLocked: false });
    routeRender('/dashboard');
    
    const sharedWalletNav = screen.getByTestId('sidebar-nav-groups');
    expect(sharedWalletNav).toBeInTheDocument();

    fireEvent.click(sharedWalletNav);

    waitFor(() => {
      expect(navMock).toHaveBeenCalledWith('/groups')
    })
    routeRender('/groups');
    expect(screen.getByTestId('split-bill-header')).toBeInTheDocument();
    expect(screen.getByTestId('split-bill-paragraph')).toBeInTheDocument();

    const groupBtn = screen.getByTestId('create-group-button');
    fireEvent.click(groupBtn);
  });
});