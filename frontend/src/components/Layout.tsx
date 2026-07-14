import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import useAuthStore from "@/stores/authStore";
import useDarkModeStore from '@/stores/darkModeStore';
import Sidebar from '@/components/dashboard/Sidebar';

interface LayoutProps {
  children: React.ReactNode;
  headerRight?: React.ReactNode;
  title?: string;
}

const TIMEOUT_DURATION = 3 * 60 * 1000; // 3 minutes
const WARNING_DURATION = 15 * 1000; // 15 seconds warning before timeout

const Layout = ({ children, headerRight, title = "Home" }: LayoutProps) => {
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

  const warningBanner = warning && token && (
    <div className="px-6 py-3 fixed top-6 left-1/2 w-[90%] max-w-md -translate-x-1/2 bg-warning/10 border border-warning/30 text-warning rounded-[10px] shadow-xl z-20">
      <p className="font-medium text-center">You&apos;ll be logged out due to inactivity in {countdown} seconds.</p>
    </div>
  );

  // Logged-out / pre-auth passthrough: no dashboard sidebar for landing/admin-login/etc.
  if (!token) {
    return (
      <div
        className="flex flex-col min-h-screen bg-background text-foreground"
        onClick={updateActivity}
      >
        {warningBanner}

        <nav className="sticky top-0 z-10 w-full border-b border-border bg-background/70 backdrop-blur-md">
          <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
            <button
              onClick={() => navigate('/dashboard')}
              data-testid="finpay-header-logo"
              className="flex items-center overflow-hidden cursor-pointer"
            >
              {darkMode ? <img src={'/FinpayDarkMode.png'} alt="FinPay Logo DarkMode" className="h-9 w-auto" /> :
              <img src={'/Finpay.png'} alt="FinPay Logo" className="h-9 w-auto" />}
            </button>
            {headerRight}
          </div>
        </nav>

        <main className="flex flex-col flex-grow items-center">
          {children}
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground" onClick={updateActivity}>
      {warningBanner}

      <Sidebar />

      <div className="flex flex-1 flex-col">
        <div className="flex h-14 items-center justify-between border-b border-border px-5">
          <h1 className="text-[15px] font-semibold tracking-tight">{title}</h1>
          {headerRight}
        </div>

        <main className="flex-1 overflow-y-auto p-[22px]">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;
