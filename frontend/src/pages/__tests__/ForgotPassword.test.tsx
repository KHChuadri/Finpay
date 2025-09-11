import '@testing-library/jest-dom';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDisplay } from '../../utils/LocationDisplay';
import { setupTestServer } from '../../../__mocks__/server';
import ProtectedRoute from '@/ProtectedRoute';
import Login from '../Login';
import ForgotPassword from '../ForgotPassword';

setupTestServer();

describe("Forgot Password page testing", () => {
  beforeEach(() => {
    render(
      <MemoryRouter initialEntries={['/login']}>
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
        </Routes>
      </MemoryRouter>
    );

    localStorage.removeItem("cooldownTimer");
    jest.spyOn(console, 'error').mockImplementation(() => { });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("renders forgot password page successfully", async () => {
    const user = userEvent.setup();
    const resetBtn = screen.getByRole('button', { name: /Reset password/i });
    await user.click(resetBtn);

    expect(screen.getByTestId('location-display')).toHaveTextContent('/forgotpassword');
    expect(screen.getByPlaceholderText(/Enter your email/i)).toBeInTheDocument();
    expect(screen.queryByText(/Enter your password/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();
  });

  it('shows error for unknown email, clears error when input is cleared', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await user.type(screen.getByPlaceholderText(/enter your email/i), 'notfound@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/user with this email not found/i)).toBeInTheDocument();

    // clearing the input should clear the error per component logic
    await user.clear(screen.getByPlaceholderText(/enter your email/i));
    await waitFor(() => {
      expect(screen.queryByText(/user with this email not found/i)).not.toBeInTheDocument();
    });
  });

  it('shows error for empty email', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reset password/i }));

    // submit empty email
    await user.click(screen.getByRole('button', { name: /submit/i }));
    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();

    // type something then clear to ensure error clears
    await user.type(screen.getByPlaceholderText(/enter your email/i), 'abc');
    await user.clear(screen.getByPlaceholderText(/enter your email/i));
    await waitFor(() => {
      expect(screen.queryByText(/email is required/i)).not.toBeInTheDocument();
    });
  });

  it('sends email, starts cooldown, persists timer, and counts down', async () => {
    jest.useFakeTimers(); // fake timer for the interval
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime });

    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await user.type(screen.getByPlaceholderText(/enter your email/i), 'john@example.com');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await act(async () => { }); // flush everything

    expect(screen.getByText(/email has been sent/i)).toBeInTheDocument();
    const btn60 = screen.getByRole('button', { name: /try again in 60s/i });
    expect(btn60).toBeDisabled();

    // cooldown persisted
    const stored = localStorage.getItem('cooldownTimer');
    expect(stored).toBeTruthy();

    // Tick 3 seconds of the 1s interval
    await act(async () => {
      jest.advanceTimersByTime(3000);
    });
    expect(screen.getByRole('button', { name: /try again in 57s/i })).toBeDisabled();

    // Tick the rest
    await act(async () => {
      jest.advanceTimersByTime(57_000);
    });

    // After hitting zero, success clears and button re-enables
    expect(screen.queryByText(/email has been sent/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled();

    jest.useRealTimers();
  });

  it('Back button navigates to /login', async () => {
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: /reset password/i }));
    await user.click(screen.getByRole('button', { name: /back/i }));
    expect(screen.getByTestId('location-display')).toHaveTextContent('/login');
  });
});