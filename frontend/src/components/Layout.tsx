import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from "@/stores/authStore";
import useDarkModeStore from '@/stores/darkModeStore';

interface LayoutProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}

const TIMEOUT_DURATION = 3 * 60 * 1000; // 3 minutes
const WARNING_DURATION = 15 * 1000; // 15 seconds warning before timeout

const Layout = ({ children, headerRight }: LayoutProps) => {
  const navigate = useNavigate();
  const [activity, setActivity] = useState(Date.now());
  const [warning, setWarning] = useState(false);
  const [countdown, setCountdown] = useState(WARNING_DURATION / 1000);
  const token = useAuthStore((state) => state.token);
  const resetAuth = useAuthStore((state) => state.resetAuth);
  const { darkMode } = useDarkModeStore();

  const updateActivity = () => {
    setActivity(Date.now());
    setWarning(false);
    setCountdown(WARNING_DURATION / 1000);
  }

  useEffect(() => {
    const events = [
      'click', 'mousemove', 'touchstart', 'wheel', 'scroll',
      'mousedown', 'keydown', 'touchmove', 'pointerdown', 'pointermove', 'focus'
    ];

    // Add event listeners for user activity
    events.forEach(event => {
      window.addEventListener(event, updateActivity);
    });

    // Check idle timeout
    const checkInactivity = () => {
      const timeDiff = Date.now() - activity;

      // Show warning within 15 seconds of inactivity
      if (timeDiff > TIMEOUT_DURATION - WARNING_DURATION && !warning) {
        setWarning(true);
      }

      // Countdown timer
      if (warning) {
        const timeLeft = Math.ceil((TIMEOUT_DURATION - timeDiff) / 1000);
        setCountdown(timeLeft);
      }

      if (timeDiff > TIMEOUT_DURATION && token) {
        resetAuth();
        navigate('/login');
      }
    };

    const interval = setInterval(checkInactivity, 1000);

    return () => {
      // Cleanup event listeners and interval
      events.forEach(event => {
        window.removeEventListener(event, updateActivity);
      });
      clearInterval(interval);
    };
  }, [activity, warning, token, resetAuth, navigate]);

  return (
    <div
      className="flex flex-col min-h-screen bg-background text-foreground"
      onClick={updateActivity}
    >
      {/* Show Warning Popup */}
      {warning && token && (
        <div className="px-6 py-3 fixed top-6 left-1/2 w-[90%] max-w-md -translate-x-1/2 bg-yellow-500 rounded-lg shadow-xl z-20">
          <p className="font-medium text-center">You&apos;ll be logged out due to inactivity in {countdown} seconds.</p>
        </div>
      )}

      {/* Shared Header */}
      <nav className="w-full px-6 flex justify-between items-center bg-none">
        <button
          onClick={() => navigate('/dashboard')}
          data-testid="finpay-header-logo"
          className="flex items-center justify-center overflow-hidden cursor-pointer"
        >
          {darkMode ? <img src={'/FinpayDarkMode.png'} alt="FinPay Logo DarkMode" className="pt-5 pb-5 h-20 w-32" /> : 
          <img src={'/Finpay.png'} alt="FinPay Logo" className="h-20 w-32" />}
        </button>
        {headerRight}
      </nav>

      {/* Page Content */}
      <main className="flex flex-col flex-grow items-center">
        {children}
      </main>

      {/* Footer */}
      <footer className="w-full border-t border-border py-8">
        <div className="text-center text-muted-foreground">
          <p>© 2025 FinPay. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;