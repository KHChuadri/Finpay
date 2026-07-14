import '@testing-library/jest-dom';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { LocationDisplay } from '../../utils/LocationDisplay';
import LandingPage from '../LandingPage';
import Register from '../Register';
import Dashboard from '../Dashboard';
import { setupTestServer } from '../../../__mocks__/server';

setupTestServer();

describe('Register Page testing', () => {
	beforeEach(() => {
		render(
			<MemoryRouter initialEntries={['/register']}>
				<Routes>
					<Route path="/" element={<><LandingPage />< LocationDisplay /></>} />
					<Route path="/register" element={<><Register /><LocationDisplay /></>} />
					<Route path="/dashboard" element={<><Dashboard /><LocationDisplay /></>} />
				</Routes>
			</MemoryRouter>
		);
	});

	it('renders the register page with form', () => {
		expect(screen.getByTestId('location-display')).toHaveTextContent('/register');

		expect(screen.getByRole('heading', { name: /create your account/i })).toBeInTheDocument();
		expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
		expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
		expect(screen.getByText("Password")).toBeInTheDocument();
	});

	it('validates first, last, and email format', async () => {
		const firstNameInput = screen.getByTestId('firstname-input');
		fireEvent.change(firstNameInput, { target: { value: '' } });
		fireEvent.blur(firstNameInput);

		const lastNameInput = screen.getByTestId('lastname-input');
		fireEvent.change(lastNameInput, { target: { value: '' } });
		fireEvent.blur(lastNameInput);

		const emailInput = screen.getByPlaceholderText(/enter your email/i);
		fireEvent.change(emailInput, { target: { value: 'invalidemail' } });
		fireEvent.blur(emailInput);

		await waitFor(() => {
			expect(screen.getByText(/please enter your first name/i)).toBeInTheDocument();
			expect(screen.getByText(/please enter your last name/i)).toBeInTheDocument();
			expect(screen.getByText(/please enter a valid email/i)).toBeInTheDocument();
		});
	});

	it('validates password requirements', async () => {
		const passwordInput = screen.getByTestId('password-input');
		fireEvent.change(passwordInput, { target: { value: 'weak' } });
		fireEvent.blur(passwordInput);

		await waitFor(() => {
			expect(screen.getByText(/8\+ characters/i)).toBeInTheDocument();
			expect(screen.getByText(/number/i)).toBeInTheDocument();
			expect(screen.getByText(/one symbol/i)).toBeInTheDocument();
		});
	});

	it('disables submit button when form is invalid', async () => {
		const submitButton = screen.getByRole('button', { name: /create account/i });
		expect(submitButton).toBeDisabled();

		// Fill in valid data
		fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
		fireEvent.change(screen.getByTestId('lastname-input'), { target: { value: 'Doe' } });
		fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } });
		fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'ValidPass1!' } });

		await waitFor(() => {
			expect(submitButton).not.toBeDisabled();
		});
	});

	it('submits the form successfully', async () => {
		const user = userEvent.setup();

		// Fill in valid data
		fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
		fireEvent.change(screen.getByTestId('lastname-input'), { target: { value: 'Doe' } });
		fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'john@example.com' } });
		fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'ValidPass1!' } });

		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByTestId('location-display')).toHaveTextContent('/dashboard');
		});
	});

	it('shows error message when registration fails', async () => {
		const user = userEvent.setup();

		// Fill in data with already used email
		fireEvent.change(screen.getByTestId('firstname-input'), { target: { value: 'John' } });
		fireEvent.change(screen.getByTestId('lastname-input'), { target: { value: 'Doe' } });
		fireEvent.change(screen.getByPlaceholderText(/enter your email/i), { target: { value: 'used@example.com' } });
		fireEvent.change(screen.getByTestId('password-input'), { target: { value: 'ValidPass1!' } });

		await user.click(screen.getByRole('button', { name: /create account/i }));

		await waitFor(() => {
			expect(screen.getByText(/Corresponding email has been used./i)).toBeInTheDocument();
		});
	});
});