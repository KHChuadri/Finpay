import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoEyeSharp } from "react-icons/io5";
import { FaEyeSlash, FaTimes } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import axios from "axios";
import { API_URL } from "@/constants/API_URL";
import { Button } from "@/components/ui/Button";
import { Label } from "@/components/ui/Label";

const ResetPassword = () => {
  const navigate = useNavigate();
  const { token } = useParams();
  const [password, setPassword] = useState('');
  const [confirmationPassword, setConfirmationPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationPassword, setShowConfirmationPassword] = useState(false);
  const [confirmationPasswordError, setConfirmationPasswordError] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [linkHasExpired, setLinkHasExpired] = useState(false);

  useEffect(() => {
    const tryResetPassword = async () => {
      try {
        await axios({
          method: 'GET',
          url: `${API_URL}/reset-password-token/${token}`
        })
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          if (err.status === 405 || err.status === 404) {
            setLinkHasExpired(true);
          }
        }
        console.error(err);
      }
    }
    tryResetPassword();
  }, [])

  const authenticatePassword = () => {
    const validPasswordRegex = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[!@#$%^&*()=]).{8,16}$/
    if (!validPasswordRegex.test(password)) {
      setPasswordError('Password must contains one lowercase, uppercase, numbers and symbols');
    } else {
      setPasswordError('');
    }
  }

  const isPasswordSame = () => {
    if (password !== '' && confirmationPassword != '' && password !== confirmationPassword) {
      setConfirmationPasswordError('Password and confirmation password does not match')
    } else {
      setConfirmationPasswordError('');
    }
  }

  const handleResetPassword = async (token: string, password: string) => {
    try {
      const response = await axios.put(`${API_URL}/reset-password`, { token, password });
      if (response.status === 200) {
        setSuccess(true);
        setErrorMessage(null);
        navigate('/login');
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || 'Something went wrong';
        setErrorMessage(msg);
      } else {
        setErrorMessage('Something went wrong');
      }
      setSuccess(false);
    }
  }

  return (
    <div className="bg-background min-h-screen flex w-full justify-center items-center">
      <div className='relative flex flex-col bg-card border border-border rounded-2xl px-4 py-6 w-3/4 md:w-1/2 lg:w-1/4 gap-4 shadow-xl transition ease-in-out'>
        <h1 className="text-xl font-bold text-center">Reset Your Password</h1>
        <IoMdClose
          className="absolute right-5 top-5 fill-subtle hover:fill-muted-foreground hover:cursor-pointer"
          size={20}
          onClick={() => navigate('/login')}
        />
        { linkHasExpired ? <p className='text-foreground text-lg text-center font-semibold mt-2 p-3'>This link has expired or does not exists</p> : (
          <div className='flex flex-col gap-4'>
            {success && (
              <div className="text-positive font-medium text-center">
                ✅ Password reset successful! Head back to login page to continue.
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-destructive/10 border-2 border-destructive text-destructive rounded z-50">
                <p className="break-words w-full pr-8">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="absolute top-4 right-4 text-destructive hover:opacity-80 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <label className='flex flex-col gap-1'>
              <Label>Password</Label>
              <div className='relative w-full border-2 border-input rounded-lg p-2'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => authenticatePassword()}
                  placeholder='Enter your new password'
                  className='border-none w-full focus:outline-none bg-transparent text-foreground'
                />
                {showPassword == false ? (
                  <FaEyeSlash
                    className='absolute right-2 bottom-2.5'
                    onClick={() => setShowPassword(!showPassword)}
                  />
                ) : (
                  <IoEyeSharp
                    className='absolute right-2 bottom-2.5'
                    onClick={() => setShowPassword(!showPassword)}
                  />
                )}
              </div>
              {passwordError !== '' && <p className='text-destructive text-sm'>{passwordError}</p>}
            </label>

            <label className='flex flex-col gap-1'>
              <Label>Confirm password</Label>
              <div className='relative w-full border-2 border-input rounded-lg p-2'>
                <input
                  type={showConfirmationPassword ? 'text' : 'password'}
                  value={confirmationPassword}
                  onBlur={() => isPasswordSame()}
                  onChange={(e) => setConfirmationPassword(e.target.value)}
                  placeholder='Confirm your new password'
                  className='border-none w-full focus:outline-none bg-transparent text-foreground'
                />
                {showConfirmationPassword == false ? (
                  <FaEyeSlash
                    className='absolute right-2 bottom-2.5'
                    onClick={() => setShowConfirmationPassword(!showConfirmationPassword)}
                  />
                ) : (
                  <IoEyeSharp
                    className='absolute right-2 bottom-2.5'
                    onClick={() => setShowConfirmationPassword(!showConfirmationPassword)}
                  />
                )}
              </div>
              {confirmationPasswordError !== '' && <p className='text-destructive text-sm'>{confirmationPasswordError}</p>}
            </label>
            <Button
              onClick={() => handleResetPassword(token!, password)}
              className='w-full rounded-xl py-2'
            >
              Submit
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate('/login')}
              className='w-full rounded-xl py-2'
            >
              {success ? (<p>Back</p>) : (<p>Go to login page</p>)}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPassword;