import '@testing-library/jest-dom';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDisplay } from '../../utils/LocationDisplay';
import { setupTestServer } from '../../../__mocks__/server';
import ProtectedRoute from '@/ProtectedRoute';
import Login from '../Login';
import ForgotPassword from '../ForgotPassword';
import ResetPassword from '../ResetPassword';
import useAuthStore from '@/stores/authStore';
import useOtpStore from '@/stores/otpStore';

setupTestServer();

describe("Reset Password page testing", () => {
  beforeEach(() => {
    localStorage.removeItem("cooldownTimer");
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const renderWithRoutes = (initialPath: string) => {
    return render(
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path="/login" element={
            <ProtectedRoute auth>
              <>
                <Login />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
          <Route path="/forgotpassword" element={<><ForgotPassword /><LocationDisplay /></>} />
          <Route path='reset-password/:token' element={<><ResetPassword /><LocationDisplay /></>} />
        </Routes>
      </MemoryRouter>
    );
  }

  it('valid token stays on page and allows input', async () => {
    renderWithRoutes('/reset-password/valid-token');

    expect(await screen.findByText(/reset your password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter your new password/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/confirm your new password/i)).toBeInTheDocument();
  });

  it('invalid token redirects to /forgotpassword', async () => {
    renderWithRoutes('/reset-password/invalid-token');

    expect(await screen.findByText('This link has expired or does not exists')).toBeInTheDocument();
  });

  it('validates password strength and confirmation mismatch on blur', async () => {
    renderWithRoutes('/reset-password/valid-token');
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();

    const pwd = screen.getByPlaceholderText(/enter your new password/i);
    const confirm = screen.getByPlaceholderText(/confirm your new password/i);
    const user = userEvent.setup();

    // Weak password
    await user.type(pwd, 'weak');
    await user.tab(); // triggers onBlur
    expect(screen.getByText(/password must contains one lowercase/i)).toBeInTheDocument();

    // Fix password (valid format)
    await user.clear(pwd);
    await user.type(pwd, 'ValidPass1!');
    await user.tab();
    await waitFor(() => {
      expect(screen.queryByText(/password must contains one lowercase/i)).not.toBeInTheDocument();
    });

    // Mismatch confirmation
    await user.type(confirm, 'Different1!');
    await user.tab();
    expect(screen.getByText(/password and confirmation password does not match/i)).toBeInTheDocument();

    // Match confirmation
    await user.clear(confirm);
    await user.type(confirm, 'ValidPass1!');
    await user.tab();
    await waitFor(() => {
      expect(screen.queryByText(/password and confirmation password does not match/i)).not.toBeInTheDocument();
    });
  });

  it('submits successfully and shows success modal, go back to login page, login with new password', async () => {
    renderWithRoutes('/reset-password/valid-token');
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();

    const pwd = screen.getByPlaceholderText(/enter your new password/i);
    const confirm = screen.getByPlaceholderText(/confirm your new password/i);
    const user = userEvent.setup();

    // Reset the password and press submit
    await user.type(pwd, 'NewMockPass1!');
    await user.tab();
    await user.type(confirm, 'NewMockPass1!');
    await user.tab();
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Back button navigates to /login
    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/login');
    });

    // Fill in valid data
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@gmail.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'NewMockPass1!' } });

    await user.click(screen.getByRole('button', { name: /submit/i }));

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

  it('expired token on submit, does not show success modal', async () => {
    renderWithRoutes('/reset-password/expired-token');
    expect(screen.getByText(/reset your password/i)).toBeInTheDocument();

    const pwd = screen.getByPlaceholderText(/enter your new password/i);
    const confirm = screen.getByPlaceholderText(/confirm your new password/i);
    const user = userEvent.setup();

    await user.type(pwd, 'ValidPass1!');
    await user.tab();
    await user.type(confirm, 'ValidPass1!');
    await user.tab();

    await user.click(screen.getByRole('button', { name: /submit/i }));
    await act(async () => { }); // flush everything

    // No success banner and reset token expired
    expect(screen.queryByText(/password reset successful!/i)).not.toBeInTheDocument();
    expect(await screen.findByText(/reset password token has expired/i)).toBeInTheDocument();
  });
});