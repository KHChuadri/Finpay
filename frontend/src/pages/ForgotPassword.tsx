import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Layout from "@/components/Layout";
import { API_URL } from "@/constants/API_URL";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

const COOLDOWN = 60;

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const handleFindUserEmail = async (email: string) => {
    try {
      const response = await axios.get(`${API_URL}/send-password-reset-email`, {
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
      <div className="bg-background min-h-screen flex justify-center items-center w-full">
        <div className='flex flex-col bg-card border border-border rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 gap-4 shadow-xl transition ease-in-out'>
          <h1 className="text-xl font-bold text-center">Reset Your Password</h1>

          {success && (
            <div className="text-positive font-medium text-center">
              ✅ Email has been sent! Please check your inbox.
            </div>
          )}

          {errorMessage && (
            <div className="text-destructive font-medium text-center">
              ❌ {errorMessage}
            </div>
          )}

          <label className='flex flex-col gap-1'>
            <Label>Email Address</Label>
            <Input
              type='text'
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (e.target.value === '') {
                  setErrorMessage('');
                }
              }}
              placeholder='Enter your email'
            />
          </label>

          <Button
            onClick={() => handleFindUserEmail(email)}
            disabled={cooldown > 0}
            className='w-full rounded-xl py-2'
          >
            {cooldown > 0 ? `Try again in ${cooldown}s` : 'Submit'}
          </Button>

          <Button
            variant="ghost"
            onClick={() => navigate('/login')}
            className='w-full rounded-xl py-2'
          >
            Back
          </Button>
        </div>
      </div>
    </Layout>
  )
}

export default ForgotPassword;