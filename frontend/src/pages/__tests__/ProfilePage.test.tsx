import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDisplay } from '../../utils/LocationDisplay';
import { setupTestServer } from '../../../__mocks__/server';
import ProtectedRoute from '@/ProtectedRoute';
import ProfilePage from '../ProfilePage';
import Dashboard from '../Dashboard';
import Register from '../Register';
import { userDb } from '../../../__mocks__/interfaceMock';
import axios from 'axios';

setupTestServer();

describe("Profile page testing", () => {
  beforeEach(async () => {
    render(
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={
            <ProtectedRoute auth>
              <>
                <Register />
                <LocationDisplay />
              </>
            </ProtectedRoute>
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
            <ProtectedRoute>
              <>
                <ProfilePage />
                <LocationDisplay />
              </>
            </ProtectedRoute>
          } />
        </Routes>
      </MemoryRouter>
    );

    // Registers the user every test run
    const user = userEvent.setup();
    fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
    fireEvent.change(screen.getByTestId('lastname-input'), { target: { value: 'Doe' } });
    fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } });
    fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'ValidPass1!' } });

    await user.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard');
    });

    await user.click(screen.getByTestId("button-profile-icon"));
  });

  type AxiosPut = typeof axios.put;
  let putSpy: jest.SpyInstance<ReturnType<AxiosPut>, Parameters<AxiosPut>>;
  const realPut: AxiosPut = axios.put.bind(axios);

  // Mock the "user/profile/upload-kyc" server API 
  beforeEach(() => {
    putSpy = jest.spyOn(axios, 'put').mockImplementation(
      async (...args: Parameters<AxiosPut>): ReturnType<AxiosPut> => {
        const [url, data, config] = args;

        if (typeof url === 'string' && /\/user\/profile\/upload-kyc$/.test(url)) {
          let userId = '123'; // Default userId is 123
          if (data instanceof FormData) {
            const formUserId = data.get('userId');
            if (typeof formUserId === 'string' && formUserId.trim()) {
              userId = formUserId.trim();
            }
          }

          const imageUrl = 'blob:jest-mock'; // Default KYCimg is 'blob:jest-mock'
          userDb[userId] = { ...userDb[userId], KYCimg: imageUrl };

          // Returns a Promise AxiosResponse<{...}> to the actual API call
          return Promise.resolve({
            data: { imageUrl, success: true },
            status: 200,
            statusText: 'OK',
            headers: {},
            config: config,
          }) as ReturnType<AxiosPut>;
        }
        return realPut(...args);
      }
    );
  });

  // Cleanup for the jest spy instance
  afterEach(() => {
    putSpy.mockRestore();
  });

  it('able to click profile icon in dashboard', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /Back to Dashboard/i }));
    expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard');
    expect(screen.getByTestId('wallet-currency')).toBeInTheDocument();
    await user.click(screen.getByTestId("button-profile-icon"));

    expect(screen.getByTestId('location-display')).toHaveTextContent('/profile');
    expect(screen.getByText(/Personal Details/i)).toBeInTheDocument();
    expect(screen.getByText("Bank Details")).toBeInTheDocument();
  });

  it('test profile page renders properly', async () => {
    expect(screen.getByTestId('location-display')).toHaveTextContent('/profile');
    expect(screen.getByText("Personal Details")).toBeInTheDocument();
    expect(screen.getByText("Bank Details")).toBeInTheDocument();

    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(screen.getByText("john@example.com")).toBeInTheDocument();

    expect(screen.getByText("Given Name")).toBeInTheDocument();
    expect(screen.getByText("John")).toBeInTheDocument();

    expect(screen.getByText("Family Name")).toBeInTheDocument();
    expect(screen.getByText("Doe")).toBeInTheDocument();

    expect(screen.getByText("Password")).toBeInTheDocument();
    expect(screen.queryByText('ValidPass1!')).not.toBeInTheDocument();

    expect(await screen.findByText(/bronze user/i)).toBeInTheDocument();
    expect(await screen.findByText(/exp:\s*0\/100/i)).toBeInTheDocument();

    expect(screen.getByText(/your account is not verified yet/i)).toBeInTheDocument();
  });

  it('check bank details rendered properly', async () => {
    const user = userEvent.setup();

    expect(screen.getByText("Bank Details")).toBeInTheDocument();
    expect(screen.getByText("Bank API")).toBeInTheDocument();
    expect(screen.getByText(/Zai API \(Sandbox\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Deposit ID/i)).toBeInTheDocument();
    expect(screen.getByText(/Zai User ID/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Change Bank Details/i }));
    expect(screen.getByTestId("button-save-bank-details")).toBeInTheDocument();
  });

  it('enters edit profile mode, validates required fields, saves changes, and persists them', async () => {
    const user = userEvent.setup();

    expect(screen.getByText(/personal details/i));
    await user.click(screen.getByRole('button', { name: /edit profile/i }));

    expect(screen.getByDisplayValue('John')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Doe')).toBeInTheDocument();

    // Trigger error empty field for first name
    const givenNameInput = screen.getByDisplayValue('John') as HTMLInputElement;
    await user.clear(givenNameInput);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText(/given name cannot be empty/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/enter given name/i), 'angel');

    // Trigger error empty field for family name
    const familyNameInput = screen.getByDisplayValue('Doe') as HTMLInputElement;
    await user.clear(familyNameInput);
    await user.click(screen.getByRole('button', { name: /save changes/i }));

    expect(screen.getByText(/family name cannot be empty/i)).toBeInTheDocument();
    await user.type(screen.getByPlaceholderText(/enter family name/i), 'francis');

    await user.type(screen.getByPlaceholderText(/enter address 1/i), 'mascot');
    await user.type(screen.getByPlaceholderText(/enter country/i), 'aus');

    fireEvent.change(screen.getByPlaceholderText(/select your date of birth/i), {
      target: { value: '2005-02-01' },
    });

    expect(screen.getByDisplayValue('angel')).toBeInTheDocument();
    expect(screen.getByDisplayValue('francis')).toBeInTheDocument();
    expect(screen.getByDisplayValue('mascot')).toBeInTheDocument();
    expect(screen.getByDisplayValue('aus')).toBeInTheDocument();
    expect(screen.getByDisplayValue('2005-02-01')).toBeInTheDocument();

    const fileInput = screen.getByLabelText(/upload id/i, { selector: 'input[type="file"]' });
    const kycFile = new File(['fake-image'], 'kyc.png', { type: 'image/png' });

    await user.upload(fileInput, kycFile);
    expect(URL.createObjectURL).toHaveBeenCalled();

    await user.click(screen.getByTestId("button-save-changes"));

    expect(await screen.findByText(/please wait for admin verification/i)).toBeInTheDocument();
    expect(screen.getByText(/2005/i)).toBeInTheDocument(); // jest uses en-US formatting
    expect(screen.getByText("angel")).toBeInTheDocument();
    expect(screen.getByText("francis")).toBeInTheDocument();
    expect(screen.getByText("mascot")).toBeInTheDocument();
    expect(screen.getByText("aus")).toBeInTheDocument();
  });

  it('toggles account type via modal (personal -> business -> personal)', async () => {
    const user = userEvent.setup();

    const personalBtn = await screen.findByRole('button', { name: /personal account/i });
    expect(personalBtn).toBeInTheDocument();

    // Open modal
    await user.click(personalBtn);
    expect(await screen.findByText(/change account type/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to change your account type to/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(await screen.findByRole('button', { name: /business account/i })).toBeInTheDocument();

    // Change to personal account again
    const businessBtn = await screen.findByRole('button', { name: /business account/i });
    expect(businessBtn).toBeInTheDocument();

    // Open modal
    await user.click(businessBtn);
    expect(await screen.findByText(/change account type/i)).toBeInTheDocument();
    expect(screen.getByText(/are you sure you want to change your account type to/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /confirm/i }));
    expect(await screen.findByRole('button', { name: /personal account/i })).toBeInTheDocument();
  });

  it('disables the account (lock) and shows locked state', async () => {
    const user = userEvent.setup();

    await user.click(screen.getByRole('button', { name: /disable account/i }));

    expect(await screen.findByRole('button', { name: /account disabled/i })).toBeDisabled();
    expect(await screen.findByText(/your account is locked/i)).toBeInTheDocument();
  });
});