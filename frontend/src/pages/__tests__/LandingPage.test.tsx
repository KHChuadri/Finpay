import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import LandingPage from '../LandingPage';
import Login from '../Login';
import Register from '../Register';
import { LocationDisplay } from '../../utils/LocationDisplay';

describe('LandingPage render testing', () => {
  beforeEach(() => {
    render(
      <MemoryRouter>
        <><LandingPage /><LocationDisplay /></>
      </MemoryRouter>
    );
  });

  it('renders main heading and Get Started button', () => {
    expect(screen.getByText(/Exchange Smarter\./i)).toBeInTheDocument();
    expect(screen.getByText(/Transfer Faster\./i)).toBeInTheDocument();
    expect(screen.getByText(/Why Choose FinPay\?/i)).toBeInTheDocument();

    const getStartedBtn = screen.getByRole('button', { name: /Get Started/i });
    expect(getStartedBtn).toBeInTheDocument();

    fireEvent.click(getStartedBtn);
    expect(screen.getByTestId('location-display')).toHaveTextContent('/register');
  });

  it('switches to RequestMoneyCard/SendMoneyCard when clicked', () => {
    const requestMoneyTab = screen.getByRole('button', { name: /Request Money/i });
    fireEvent.click(requestMoneyTab);

    expect(screen.getByText(/You are receiving:/i)).toBeInTheDocument();
    expect(screen.getByText(/Requesting To:/i)).toBeInTheDocument();

    const sendMoneyBtns = screen.getAllByRole('button', { name: /Send Money/i });
    const sendMoneyTab = sendMoneyBtns[0];
    fireEvent.click(sendMoneyTab);

    expect(screen.getByText(/You are sending:/i)).toBeInTheDocument();
    expect(screen.getByText(/Recipient Receive:/i)).toBeInTheDocument();
  });

  it('test send money/send request mock transfer successful when clicked', () => {
    const sendMoneyBtns = screen.getAllByRole('button', { name: /Send Money/i });
    const sendMoneyBtn = sendMoneyBtns[1];
    fireEvent.click(sendMoneyBtn);
    expect(screen.getByText(/Transfer Successful!/i)).toBeInTheDocument();

    const requestMoneyTab = screen.getByRole('button', { name: /Request Money/i });
    fireEvent.click(requestMoneyTab);
    const requestMoneyBtn = screen.getByRole('button', { name: /Send Request/i });
    fireEvent.click(requestMoneyBtn);
    expect(screen.getByText(/Request Successful!/i)).toBeInTheDocument();
  });
});

describe('LandingPage navigation testing', () => {
  it('login button navigates to /login', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><LandingPage />< LocationDisplay /></>} />
          <Route path="/login" element={<><Login /><LocationDisplay /></>} />
        </Routes>
      </MemoryRouter>
    );

    const loginBtn = screen.getByRole('button', { name: /Login/i });
    expect(loginBtn).toBeInTheDocument();

    fireEvent.click(loginBtn);
    expect(screen.getByText(/forgot/i)).toBeInTheDocument(); // 'forgot' link is unique to login page
    expect(screen.getByTestId('location-display')).toHaveTextContent('/login');
  });

  it('signup button navigates to /register', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<><LandingPage />< LocationDisplay /></>} />
          <Route path="/register" element={<><Register />< LocationDisplay /></>} />
        </Routes>
      </MemoryRouter>
    );

    const signupBtn = screen.getByRole('button', { name: /Sign up/i });
    expect(signupBtn).toBeInTheDocument();

    fireEvent.click(signupBtn);
    expect(screen.getByText(/create your account/i)).toBeInTheDocument();
    expect(screen.getByTestId('location-display')).toHaveTextContent('/register');
  });
})

