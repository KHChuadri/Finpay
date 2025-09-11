import React, { useRef, useEffect, useState } from 'react';
import { LiaTimesSolid } from 'react-icons/lia';
import useOtpStore from '../../stores/otpStore';

type AuthenticationProp = {
  onClose: () => void;
  userId: string;
  email: string;
};

const AuthenticationModal = ({ onClose, userId, email }: AuthenticationProp) => {
  const { disableSendOtp, timeLeft, errorMsg, setErrorMsg, getOtp, verifyOtp } = useOtpStore();
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const [otp, setOtp] = useState(new Array(6).fill(''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasSentOtp = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    const sendInitialOtp = async () => {
      if (!hasSentOtp.current && timeLeft === 0 && isMounted.current) {
        hasSentOtp.current = true;
        getOtp();
      }
    };

    sendInitialOtp();

    return () => {
      isMounted.current = false;
      hasSentOtp.current = false;
    };
  }, [])

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const value = e.target.value;

    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }

    if (index === 5 && value && newOtp.every(digit => digit)) {
      handleSubmit(newOtp.join(''));
    }
  };

  const resetInputField = () => {
    setOtp(new Array(6).fill(''));
    inputsRef.current[0]?.focus();
  }

  const handleSubmit = async (code: string) => {
    if (code.length !== 6) {
      setErrorMsg('Verification code needs to contain 6 digits');
      return;
    }
    
   setIsSubmitting(true);
    try {
      verifyOtp(userId, email, code);
      resetInputField();
    } catch (error) {
      console.error('OTP verification failed:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        inputsRef.current[index - 1]?.focus();
      }
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
    }

    if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;
    
    const newOtp = [...otp];
    pastedData.split('').forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    
    const lastFilledIndex = Math.min(pastedData.length - 1, 5);
    inputsRef.current[lastFilledIndex]?.focus();
    
    if (pastedData.length === 6) {
      handleSubmit(pastedData);
    }
  };

  const onFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join('');
    handleSubmit(code);
  };

  const handleResendOTP = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disableSendOtp) {
      getOtp();
      resetInputField();
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
      onClick={() => onClose()}
    >
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          data-testid="close-authentication-button"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors duration-200"
          onClick={() => onClose()}
          type="button"
          aria-label="Close modal"
        >
          <LiaTimesSolid className="w-5 h-5 text-gray-500" />
        </button>

        <div className="p-8">
          <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg transform transition-transform hover:scale-105">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>

          <h2 className="text-2xl font-bold text-gray-900 text-center mb-2">
            Two-Factor Authentication
          </h2>

          <p className="text-gray-600 text-center mb-6">
            Enter the 6-digit code we sent to your email
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 animate-in slide-in-from-top duration-200">
              <svg className="w-5 h-5 text-red-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-red-700 text-sm">{errorMsg}</p>
            </div>
          )}

          <div>
            <div className="flex gap-2 justify-center mb-6">
              {[...Array(6)].map((_, i) => (
                <input
                  data-testid={`otp-input-${i}`}
                  key={i}
                  type="text"
                  maxLength={1}
                  inputMode="numeric"
                  pattern="[0-9]"
                  className={`
                    w-12 h-14 text-center text-2xl font-semibold text-gray-900
                    border-2 rounded-lg transition-all duration-200
                    ${otp[i] ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-200
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                  ref={(el) => {
                    inputsRef.current[i] = el;
                  }}
                  value={otp[i]}
                  onChange={(e) => handleChange(e, i)}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  onPaste={i === 0 ? handlePaste : undefined}
                  disabled={isSubmitting}
                  aria-label={`Digit ${i + 1}`}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter' && otp.join('').length === 6) {
                      onFormSubmit(e);
                    }
                  }}
                />
              ))}
            </div>

            <button
              data-testid="submit-authentication-button"
              onClick={(e) => onFormSubmit(e)}
              disabled={otp.join('').length !== 6 || isSubmitting}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold text-white
                transition-all duration-200 transform
                ${otp.join('').length === 6 && !isSubmitting
                  ? 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0'
                  : 'bg-gray-300 cursor-not-allowed'
                }
              `}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Verifying...
                </span>
              ) : (
                'Verify Code'
              )}
            </button>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Didn&apos;t receive the code?{' '}
                <button
                  disabled={disableSendOtp}
                  onClick={(e) => handleResendOTP(e)}
                  className={`
                    font-semibold transition-colors duration-200
                    ${disableSendOtp 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-blue-600 hover:text-blue-700 hover:underline'
                    }
                  `}
                >
                  {disableSendOtp ? (
                    <span>Resend in {timeLeft}s</span>
                  ) : (
                    'Resend Code'
                  )}
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthenticationModal;