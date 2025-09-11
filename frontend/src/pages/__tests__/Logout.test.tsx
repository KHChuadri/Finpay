import ProtectedRoute from '@/ProtectedRoute';
import '@testing-library/jest-dom';
import { setupTestServer } from '../../../__mocks__/server';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import LandingPage from '../LandingPage';
import { LocationDisplay } from '@/utils/LocationDisplay';
import Dashboard from '../Dashboard';
import ProfilePage from '../ProfilePage';
import axios from 'axios';

setupTestServer();

// Logout mock
jest.mock('axios');
const mockLogout = axios as jest.Mocked<typeof axios>;

describe("Logout button test", () => {
  beforeEach(() => {
    // based on backend's return value
    mockLogout.post.mockResolvedValue({});

    render(
      <MemoryRouter initialEntries={["/dashboard"]}>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute auth>
              <>
                <LandingPage />
                <LocationDisplay />
              </>
            </ ProtectedRoute>
          } />
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
        </Routes>
      </MemoryRouter>
    );
  });

  beforeEach(() => {
    jest.spyOn(window, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('after entering dashboard, navigates to logout', async () => {    
    // The profile button
    const profileBtn = await screen.findByTestId('button-profile-icon');
    expect(profileBtn).toBeInTheDocument();
    fireEvent.click(profileBtn);

    // The buttons in the profile page's header 
    expect(await screen.findByTestId('back-to-dashboard')).toBeInTheDocument();

    // User clicks and logs out
    const logoutBtn = await screen.findByTestId('logout-button');
    expect(logoutBtn).toBeInTheDocument();
    fireEvent.click(logoutBtn);

    expect(await screen.findByTestId('exchange-smarter')).toBeInTheDocument();

    // back to landing page
    expect(await screen.findByTestId('why-choose-finpay')).toBeInTheDocument();
  });
});