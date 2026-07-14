import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDisplay } from '../../utils/LocationDisplay';
import LandingPage from '../LandingPage';
import Login from '../Login';
import ForgotPassword from '../ForgotPassword';
import Dashboard from '../Dashboard';
import { setupTestServer } from '../../../__mocks__/server';
import useAuthStore from '@/stores/authStore';
import useOtpStore from '@/stores/otpStore';
import ProtectedRoute from '@/ProtectedRoute';

setupTestServer();

describe("Login page testing", () => {
  beforeEach(() => {
    render(
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/" element={
            <ProtectedRoute auth>
              <>
                <LandingPage />
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
          <Route path="/forgotpassword" element={<><ForgotPassword /><LocationDisplay /></>} />
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
  });

  it('renders the login page with form', () => {
    expect(screen.getByTestId('location-display')).toHaveTextContent('/login');

    expect(screen.getByRole('heading', { name: /welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your email/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your password/i)).toBeInTheDocument();
    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.getByText(/forgot/i)).toBeInTheDocument();
  });

  it('disables submit button when form is invalid', async () => {
    const submitButton = screen.getByRole('button', { name: /sign in/i });
    expect(submitButton).toBeDisabled();

    // Fill in valid data
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'ValidPass1!' } });

    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });
  });

  it('shows error message when email is wrong', async () => {
    const user = userEvent.setup();

    // Fill in invalid data
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'invalid@example.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'wrongpassword' } });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Account does not exist with the given email/i)).toBeInTheDocument();
    });
  });

  it('shows error message when password is wrong', async () => {
    const user = userEvent.setup();

    // Fill in invalid data
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'valid@gmail.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'incorrectpassword' } });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Incorrect password/i)).toBeInTheDocument();
    });
  });

  it('navigates to forgot password page', async () => {
    const user = userEvent.setup();
    const forgotPasswordLink = screen.getByText(/forgot/i);
    await user.click(forgotPasswordLink);
    expect(screen.getByTestId('location-display')).toHaveTextContent('/forgotpassword');
  });

  it('close authentication modal successfully', async () => {
    const user = userEvent.setup();

    // Fill in valid data
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'valid@gmail.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'correctpassword' } });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enter the 6-digit code we sent to your email/i)).toBeInTheDocument();
    });
    const closeBtn = screen.getByTestId('close-authentication-button');

    await userEvent.click(closeBtn);
    await waitFor(() => {
      expect(screen.queryByText(/Enter the 6-digit code we sent to your email/i)).not.toBeInTheDocument();
    });
  });

  it('login with OTP verification successfully', async () => {
    const user = userEvent.setup();

    // Fill in valid data
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'valid@gmail.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'correctpassword' } });

    await user.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/Enter the 6-digit code we sent to your email/i)).toBeInTheDocument();
    });

    // Enter the test OTP (123456)
    await user.type(screen.getByTestId('otp-input-0'), '1');
    await user.type(screen.getByTestId('otp-input-1'), '2');
    await user.type(screen.getByTestId('otp-input-2'), '3');
    await user.type(screen.getByTestId('otp-input-3'), '4');
    await user.type(screen.getByTestId('otp-input-4'), '5');
    await user.type(screen.getByTestId('otp-input-5'), '6');

    expect(screen.getByTestId('location-display')).toHaveTextContent('/login');

    // Submit OTP
    await user.click(screen.getByTestId("submit-authentication-button"));

    // Verify successful authentication
    await waitFor(() => {
      expect(useAuthStore.getState().isAuthenticated).toBe(true);
      expect(useOtpStore.getState().isOTPVerified).toBe(true);
    });
  });
});