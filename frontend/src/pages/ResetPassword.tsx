import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { IoEyeSharp } from "react-icons/io5";
import { FaEyeSlash, FaTimes } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
import axios from "axios";

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
          url: `http://localhost:3000/reset-password-token/${token}`
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
      const response = await axios.put('http://localhost:3000/reset-password', { token, password });
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
    <div className="bg-gradient-to-b from-[#FFA294] to-[#EECAB8] min-h-screen flex w-full justify-center items-center">
      <div className='relative flex flex-col bg-white rounded-2xl px-4 py-6 w-3/4 md:w-1/2 lg:w-1/4 gap-4 shadow-2xl transition ease-in-out'>
        <h1 className="text-xl font-bold text-center">Reset Your Password</h1>
        <IoMdClose 
          className="absolute right-5 top-5 fill-gray-400 hover:fill-gray-600 hover:cursor-pointer" 
          size={20}
          onClick={() => navigate('/login')}
        />
        { linkHasExpired ? <p className='text-black text-lg text-center font-semibold mt-2 p-3'>This link has expired or does not exists</p> : (
          <div className='flex flex-col gap-4'>
            {success && (
              <div className="text-green-600 font-medium text-center">
                ✅ Password reset successful! Head back to login page to continue.
              </div>
            )}

            {/* Error Message */}
            {errorMessage && (
              <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-200 border-2 border-red-400 text-red-700 rounded z-50">
                <p className="break-words w-full pr-8">{errorMessage}</p>
                <button
                  onClick={() => setErrorMessage(null)}
                  className="absolute top-4 right-4 text-red-700 hover:text-red-900 cursor-pointer"
                >
                  <FaTimes />
                </button>
              </div>
            )}

            <label className='flex flex-col'>
              Password
              <div className='relative w-full border-2 border-gray-300 rounded-lg p-2'>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={() => authenticatePassword()}
                  placeholder='Enter your new password'
                  className='border-none w-full focus:outline-none'
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
              {passwordError !== '' && <p className='text-red-600 text-sm'>{passwordError}</p>}
            </label>

            <label className='flex flex-col'>
              Confirm password
              <div className='relative w-full border-2 border-gray-300 rounded-lg p-2'>
                <input
                  type={showConfirmationPassword ? 'text' : 'password'}
                  value={confirmationPassword}
                  onBlur={() => isPasswordSame()}
                  onChange={(e) => setConfirmationPassword(e.target.value)}
                  placeholder='Confirm your new password'
                  className='border-none w-full focus:outline-none'
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
              {confirmationPasswordError !== '' && <p className='text-red-600 text-sm'>{confirmationPasswordError}</p>}
            </label>
            <button
              onClick={() => handleResetPassword(token!, password)}
              className='w-full bg-[#C6412A] text-white p-2 text-center rounded-xl font-bold hover:opacity-80 hover:cursor-pointer'
            >
              Submit
            </button>
            <button
              onClick={() => navigate('/login')}
              className='w-full border-2 border-[#C6412A] text-center p-2 text-[#C6412A] rounded-xl font-bold hover:opacity-80 hover:cursor-pointer'
            >
              {success ? (<p>Back</p>) : (<p>Go to login page</p>)}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default ResetPassword;