import { create } from 'zustand';
import axios from 'axios';
import useAuthStore from './authStore';

interface OtpState {
  otpId: string,
  disableSendOtp: boolean,
  timeLeft: number,
  errorMsg: string,
  isOTPVerified: boolean, // to track if user has successfully being verified
  intervalId: NodeJS.Timeout | null,

  setOtpId: (otpId: string) => void;
  setDisableSendOtp: (disable: boolean) => void;
  setIsOTPVerified: (isVerified: boolean) => void;
  setTimeLeft: (timeLeft: number | ((prev: number) => number)) => void;
  getOtp: () => void;
  verifyOtp: (userId: string, email: string, otpCode: string) => void;
  setErrorMsg: (errorMsg: string) => void;
  resetOtpStore: () => void;
  clearTime: () => void
}

const useOtpStore = create<OtpState>()((set, get) => ({
  otpId: '',
  disableSendOtp: false,
  timeLeft: 0,
  errorMsg: '',
  isOTPVerified: false,
  intervalId: null,

  setOtpId: (otpId) => set({ otpId: otpId }),
  setDisableSendOtp: (disable) => set({ disableSendOtp: disable }),
  setTimeLeft: (value) => set(state => ({
    timeLeft: typeof value === 'function' ? value(state.timeLeft) : value
  })),
  setIsOTPVerified: (isVerified) => set({ isOTPVerified: isVerified }),
  setErrorMsg: (err) => set({ errorMsg: err }),

  clearTime: () => {
    const { intervalId, setTimeLeft } = get();
    if (intervalId) {
      clearInterval(intervalId);
      setTimeLeft(0);
      set({ intervalId: null });
    }
  },

  resetOtpStore: () => {
    const { clearTime } = get();
    clearTime();

    set({
      otpId: '',
      disableSendOtp: false,
      timeLeft: 0,
      errorMsg: '',
      isOTPVerified: false,
      intervalId: null,
    });
  },

  getOtp: async (signal?: AbortSignal) => {
    console.log("GET OTP STORE CALLED");
    const { setOtpId, setDisableSendOtp, setTimeLeft, setErrorMsg, clearTime } = get();
    const userId = useAuthStore.getState().userId;

    // Checking if there is any time interval left (avoiding memory leak)
    clearTime();

    if (!userId) {
      setErrorMsg('No user id found. Please try again');
      return;
    }

    try {
      setErrorMsg('');
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:3000/authentication/create/otp',
        data: { userId: userId },
        signal
      });

      setOtpId(response.data.otpId);
      setDisableSendOtp(true);
      setTimeLeft(60);

      const interval = setInterval(() => {
        setTimeLeft((prev: number) => {
          if (prev <= 1) {
            clearInterval(interval);
            setDisableSendOtp(false);
            set({ intervalId: null });
            return 0;
          }
          return prev - 1;
        });
      }, 1000)

      set({ intervalId: interval });
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An error occurred during login';
        setErrorMsg(msg);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  },

  verifyOtp: async (userId, email, otpCode) => {
    console.log("VERIFY OTP STORE CALLED")
    const { otpId, setErrorMsg, resetOtpStore, setIsOTPVerified } = get();
    const setToken = useAuthStore.getState().setToken;
    const setIsAuthenticated = useAuthStore.getState().setIsAuthenticated;

    setErrorMsg('');

    try {
      const response = await axios({
        method: 'POST',
        url: 'http://localhost:3000/authentication/verify/otp',
        data: { otpId: otpId, otp: parseInt(otpCode), userId, email }
      });
      setToken(response.data.token);
      setIsAuthenticated(true);
      setIsOTPVerified(true);
      setTimeout(() => resetOtpStore(), 1000); // Delay this as we want the receipt to show out first
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'An error occurred during login';
        setErrorMsg(msg);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  }
}));

export default useOtpStore;