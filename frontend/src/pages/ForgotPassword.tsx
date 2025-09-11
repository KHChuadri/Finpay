import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";

const COOLDOWN = 60;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFindUserEmail = async (email: string) => {
    try {
      const response = await axios.get('http://localhost:3000/send-password-reset-email', {
        params: { email }
      });

      if (response.status == 200) {
        const expiry = Date.now() + COOLDOWN * 1000;
        localStorage.setItem('cooldownTimer', expiry.toString());

        setSuccess(true);
        setCooldown(COOLDOWN);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || 'Something went wrong';
        setErrorMessage(msg);
        console.error('Finding user email error:', msg);
      } else {
        console.error('An unexpected error occurred');
      }
    }
  };

  useEffect(() => {
    const storedTimer = localStorage.getItem('cooldownTimer');
    if (storedTimer) {
      const timeLeft = Math.floor((parseInt(storedTimer) - Date.now()) / 1000);
      if (timeLeft > 0) {
        setCooldown(timeLeft);
        setSuccess(true);
      } else {
        localStorage.removeItem('cooldownTimer');
      }
    }
  }, []);

  useEffect(() => {
    if (cooldown <= 0) {
      setSuccess(false);
      setErrorMessage('');
      return;
    }

    const timer = setInterval(() => {
      setCooldown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  return (
    <Layout>
      <div className="bg-gradient-to-b from-[#FFA294] to-[#EECAB8] min-h-screen flex justify-center items-center w-full">
        <div className='flex flex-col bg-white rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 gap-4 shadow-2xl transition ease-in-out'>
          <h1 className="text-xl font-bold text-center">Reset Your Password</h1>

          {success && (
            <div className="text-green-600 font-medium text-center">
              ✅ Email has been sent! Please check your inbox.
            </div>
          )}

          {errorMessage && (
            <div className="text-red-600 font-medium text-center">
              ❌ {errorMessage}
            </div>
          )}

          <label className='flex flex-col'>
            <p className="font-semibold text-gray-800">Email Address</p>
            <div className='relative w-full border-2 border-gray-300 rounded-lg p-2'>
              <input
                type='text'
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (e.target.value === '') {
                    setErrorMessage('');
                  }
                }}
                placeholder='Enter your email'
                className='border-none w-full focus:outline-none'
              />
            </div>
          </label>

          <button
            onClick={() => handleFindUserEmail(email)}
            disabled={cooldown > 0}
            className={`w-full p-2 text-center rounded-xl font-bold hover:cursor-pointer transition ${cooldown > 0
                ? 'bg-gray-400 text-white cursor-not-allowed'
                : 'bg-[#C6412A] text-white hover:opacity-80'
              }`}
          >
            {cooldown > 0 ? `Try again in ${cooldown}s` : 'Submit'}
          </button>

          <button
            onClick={() => navigate('/login')}
            className='w-full border-2 border-[#C6412A] text-center p-2 text-[#C6412A] rounded-xl font-bold hover:opacity-80 hover:cursor-pointer'
          >
            Back
          </button>
        </div>
      </div>
    </Layout>
  )
}

export default ForgotPassword;