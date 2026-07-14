import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaEyeSlash } from 'react-icons/fa';
import { IoEyeSharp } from 'react-icons/io5';
import validator from 'validator';
import axios from 'axios';
import useAuthStore from '@/stores/authStore';
import { API_URL } from '@/constants/API_URL';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';
import { PasswordStrength, passwordChecks } from '@/components/dashboard/PasswordStrength';

const RegisterForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [hasError, setHasError] = useState(true);
  const [passwordOnFocus, setPasswordOnFocus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('')

  const navigate = useNavigate();
  const setAuth = useAuthStore.getState().setAuth;

  const isFirstNameValid = () => {
    if (firstName.length == 0) {
      setFirstNameError('Please enter your first name');
    } else {
      setFirstNameError('')
    }
  }

  const isLastNameValid = () => {
    if (lastName.length == 0) {
      setLastNameError('Please enter your last name');
    } else {
      setLastNameError('')
    }
  }

  const validateEmail = () => {
    if (!validator.isEmail(email)) {
      setEmailError('Please enter a valid email');
    } else {
      setEmailError('');
    }
  }

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setShowPassword(false);
  }

  const handleSubmit = async () => {
    if (hasError) return;

    const userData = {
      firstName: firstName,
      lastName: lastName,
      email: email,
      password: password
    }

    try {
      const response = await axios({
        method: 'POST',
        url: `${API_URL}/register`,
        data: userData,
      });
      setAuth(response.data.token, response.data.userId)
      navigate('/dashboard');
      resetForm();
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || 'An error occurred during login';
        setErrorMsg(msg);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  }

  useEffect(() => {
    const validEmail = email.length !== 0 && validator.isEmail(email);
    const validPassword = passwordChecks.every((c) => c.test(password));
    if (firstName && lastName && validEmail && validPassword) {
      setHasError(false);
    } else {
      setHasError(true);
    }
  }, [firstName, lastName, email, password])

  return (
    <div className='flex flex-col bg-card border border-border rounded-[16px] p-8 w-full max-w-[440px] gap-4 shadow-xl'>
      <img src="/FinpayDarkMode.png" alt="FinPay Logo" className="h-8 w-auto self-center mb-2" />

      <div className="flex flex-col gap-1 text-center">
        <h1 className='text-foreground text-2xl font-bold'>Create your account</h1>
        <p className="text-muted-foreground text-sm">Free forever. No card required.</p>
      </div>

      {errorMsg && <p className='text-destructive text-sm text-center'>{errorMsg}</p>}

      <div className='flex flex-col gap-3 w-full'>
        <div className="grid grid-cols-2 gap-3">
          <label className='flex flex-col gap-1'>
            <Label required>First name</Label>

            <Input
              data-testid="firstname-input"
              type="text"
              value={firstName}
              onBlur={() => isFirstNameValid()}
              onChange={(e) => setFirstName(e.target.value)}
              placeholder='Enter your first name'
              error={firstNameError.length !== 0}
            />

            {firstNameError.length != 0 && <p className='text-destructive text-sm'>{firstNameError}</p>}
          </label>

          <label className='flex flex-col gap-1'>
            <Label required>Last name</Label>

            <Input
              data-testid="lastname-input"
              type="text"
              value={lastName}
              onBlur={() => isLastNameValid()}
              onChange={(e) => setLastName(e.target.value)}
              placeholder='Enter your last name'
              error={lastNameError.length !== 0}
            />

            {lastNameError.length != 0 && <p className='text-destructive text-sm'>{lastNameError}</p>}
          </label>
        </div>

        <label className='flex flex-col gap-1'>
          <Label required>Email</Label>

          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={() => validateEmail()}
            placeholder='Enter your email'
            error={emailError !== ''}
          />

          {emailError !== '' && <p className='text-destructive text-sm'>{emailError}</p>}
        </label>

        <label className='flex flex-col gap-1'>
          <Label>Password</Label>

          <div
            tabIndex={0}
            onFocus={() => setPasswordOnFocus(true)}
            onBlur={() => setPasswordOnFocus(false)}
            className={`relative w-full rounded-lg p-2 border-2 ${passwordOnFocus ? 'border-ring ring-2 ring-ring/40' : 'border-input'}`}
          >
            <input
              data-testid="password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder='Enter your password'
              className='border-none w-full focus:outline-none bg-transparent text-foreground'
            />
            {showPassword == false ? (
              <FaEyeSlash
                className='absolute right-2 bottom-2.5 cursor-pointer'
                onClick={() => setShowPassword(!showPassword)}
              />
            ) : (
              <IoEyeSharp
                className='absolute right-2 bottom-2.5 cursor-pointer'
                onClick={() => setShowPassword(!showPassword)}
              />
            )
            }
          </div>

          <PasswordStrength password={password} />
        </label>
      </div>

      <Button
        onClick={() => handleSubmit()}
        disabled={hasError}
        className='w-full'
      >
        Create account
      </Button>

      <p className="text-center text-xs text-subtle">
        By creating an account, you agree to our Terms and Privacy Policy.
      </p>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button
          onClick={() => navigate('/login')}
          className="underline cursor-pointer text-foreground"
        >
          Sign in
        </button>
      </p>
    </div>
  )
}

export default RegisterForm;
