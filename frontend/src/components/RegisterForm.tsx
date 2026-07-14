import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff } from 'lucide-react';
import validator from 'validator';
import axios from 'axios';
import useAuthStore from '@/stores/authStore';
import { API_URL } from '@/constants/API_URL';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Button } from '@/components/ui/Button';

const RegisterForm = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmationPassword, setConfirmationPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmationPassword, setShowConfirmationPassword] = useState(false);
  const [firstNameError, setFirstNameError] = useState('');
  const [lastNameError, setLastNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmationPasswordError, setConfirmationPasswordError] = useState('');
  const [passwordVisited, setPasswordVisited] = useState(false);
  const [confirmationPasswordVisited, setConfirmationPasswordVisited] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [passwordOnFocus, setPasswordOnFocus] = useState(false);
  const [confirmationPasswordOnFocus, setConfirmationPasswordOnFocus] = useState(false);
  const [errorMsg, setErrorMsg] = useState('')

  const navigate = useNavigate();
  const setAuth = useAuthStore.getState().setAuth;

  useEffect(() => {
    if (confirmationPasswordOnFocus || confirmationPasswordVisited) {
      const handler = setTimeout(() => {
        if (confirmationPassword.length == 0) {
          setConfirmationPasswordError('Please enter confirmation password');
          return;
        }
        if (password && confirmationPassword) {
          if (password === confirmationPassword) {
            setConfirmationPasswordError('');
          } else if (confirmationPassword.length == 0) {
            setConfirmationPasswordError('Please enter confirmation password');
          } else {
            setConfirmationPasswordError('Password and confirmation password does not match')
          }
        }
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [password, confirmationPassword, confirmationPasswordVisited]);

  useEffect(() => {
    if (passwordOnFocus || passwordVisited) {
      const handler = setTimeout(() => {
        if (password.length == 0) {
          setPasswordError('Please enter your password');
          return;
        }
        const validPasswordRegex = /^(?=.*?[a-z])(?=.*?[A-Z])(?=.*?[0-9])(?=.*?[^A-Za-z0-9\s]).{8,16}$/
        if (!validPasswordRegex.test(password)) {
          setPasswordError('Password must contain at least one lowercase, uppercase, number, and symbol, with length 8 - 16 characters');
        } else {
          setPasswordError('');
        }
      }, 300);
      return () => clearTimeout(handler);
    }
  }, [password, passwordVisited]);

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
    setConfirmationPassword('');
    setShowPassword(false);
    setShowConfirmationPassword(false);
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
    if (email.length == 0 || password.length == 0 || confirmationPassword.length == 0 || firstName.length == 0 || lastName.length == 0) {
      setHasError(true)
    } else if (emailError.length != 0 || passwordError.length != 0 || confirmationPasswordError.length != 0 ||
      firstNameError.length != 0 || lastNameError.length != 0 || password != confirmationPassword) {
      setHasError(true)
    } else {
      setHasError(false);
    }
  }, [firstName, lastName, email, password, confirmationPassword, firstNameError, lastNameError, emailError, passwordError, confirmationPasswordError])

  return (
    <div className='glass flex flex-col rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 transition ease-in-out'>
      <h3 className='text-foreground text-2xl font-bold pt-2 text-center mb-2'>Registration</h3>

      {errorMsg && <p className='text-destructive text-md'>{errorMsg}</p>}

      <div className='flex flex-col gap-3 w-full'>
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
          <Label required>Password</Label>

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
              onBlur={() => setPasswordVisited(true)}
              placeholder='Enter your password'
              className='border-none w-full focus:outline-none bg-transparent text-foreground'
            />
            {showPassword == false ? (
              <EyeOff
                className='absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground'
                onClick={() => setShowPassword(!showPassword)}
              />
            ) : (
              <Eye
                className='absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground'
                onClick={() => setShowPassword(!showPassword)}
              />
            )
            }
          </div>

          {passwordError !== '' && <p className='text-destructive text-sm'>{passwordError}</p>}
        </label>

        <label className='flex flex-col gap-1'>
          <Label required>Confirm password</Label>

          <div
            tabIndex={0}
            onFocus={() => setConfirmationPasswordOnFocus(true)}
            onBlur={() => setConfirmationPasswordOnFocus(false)}
            className={`relative w-full rounded-lg p-2 border-2 ${confirmationPasswordOnFocus ? 'border-ring ring-2 ring-ring/40' : 'border-input'}`}
          >
            <input
              data-testid="confirm-password-input"
              type={showConfirmationPassword ? 'text' : 'password'}
              value={confirmationPassword}
              onChange={(e) => setConfirmationPassword(e.target.value)}
              onBlur={() => setConfirmationPasswordVisited(true)}
              placeholder='Enter your password'
              className='border-none w-full focus:outline-none bg-transparent text-foreground'
            />
            {showConfirmationPassword == false ? (
              <EyeOff
                className='absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground'
                onClick={() => setShowConfirmationPassword(!showConfirmationPassword)}
              />
            ) : (
              <Eye
                className='absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground'
                onClick={() => setShowConfirmationPassword(!showConfirmationPassword)}
              />
            )
            }
          </div>

          {confirmationPasswordError !== '' && <p className='text-destructive text-sm'>{confirmationPasswordError}</p>}
        </label>
      </div>

      <Button
        onClick={() => handleSubmit()}
        disabled={hasError}
        className='w-full rounded-xl py-2'
      >
        Submit
      </Button>

      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className='w-full rounded-xl py-2'
      >
        Back
      </Button>
    </div>
  )
}

export default RegisterForm;
