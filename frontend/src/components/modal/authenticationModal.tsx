import React, { useRef, useEffect, useState } from 'react';
import { LiaTimesSolid } from 'react-icons/lia';
import { Lock } from 'lucide-react';
import useOtpStore from '../../stores/otpStore';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

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
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(6,7,9,.5)] backdrop-blur-sm animate-in fade-in duration-200"
      onClick={() => onClose()}
    >
      <div
        className="relative bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-[376px] animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          data-testid="close-authentication-button"
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors duration-200"
          onClick={() => onClose()}
          type="button"
          aria-label="Close modal"
        >
          <LiaTimesSolid className="w-5 h-5 text-muted-foreground" />
        </button>

        <div className="p-8">
          <div className="h-10 w-10 mb-4 rounded-[9px] bg-green-tint text-primary flex items-center justify-center">
            <Lock className="w-5 h-5" />
          </div>

          <h2 className="text-[18px] font-semibold text-foreground mb-2">
            Verify it&apos;s you
          </h2>

          <p className="text-muted-foreground mb-6">
            Enter the 6-digit code we sent to your email (check spam folder as well)
          </p>

          {errorMsg && (
            <div className="mb-4 p-3 bg-destructive-tint border border-destructive-tint-border rounded-[10px] flex items-center gap-2 animate-in slide-in-from-top duration-200">
              <svg className="w-5 h-5 text-destructive flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
              <p className="text-destructive text-sm">{errorMsg}</p>
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
                  className={cn(
                    'w-11 h-12 rounded-[9px] text-center num text-xl transition-colors',
                    'focus:outline-none focus:ring-2 focus:ring-green-tint focus:border-primary',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    otp[i]
                      ? 'border-primary bg-green-tint'
                      : 'border border-border-strong hover:border-border-strong',
                  )}
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

            <Button
              data-testid="submit-authentication-button"
              onClick={(e) => onFormSubmit(e)}
              disabled={otp.join('').length !== 6 || isSubmitting}
              loading={isSubmitting}
              className="w-full"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Code'}
            </Button>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                Didn&apos;t receive the code?{' '}
                <button
                  disabled={disableSendOtp}
                  onClick={(e) => handleResendOTP(e)}
                  className={cn(
                    'font-semibold transition-colors duration-200',
                    disableSendOtp
                      ? 'text-subtle cursor-not-allowed'
                      : 'text-primary hover:opacity-80 hover:underline',
                  )}
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