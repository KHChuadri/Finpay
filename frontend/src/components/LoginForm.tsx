import { useState, useEffect } from "react";
import { FaEyeSlash } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import { Mail } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import AuthenticationModal from "@/components/modal/authenticationModal";
import useOtpStore from "@/stores/otpStore";
import { API_URL } from "@/constants/API_URL";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";
import { Pill } from "@/components/ui/Pill";

const LoginForm = () => {
  const { setEmail } = useAuthStore();
  const [emailInput, setEmailInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [disableButton, setDisableButton] = useState(true);
  const [passwordOnFocus, setPasswordOnFocus] = useState(false);
  const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);

  const navigate = useNavigate();
  const { setUserId, resetAuth, token, userId } = useAuthStore();
  const { resetOtpStore } = useOtpStore();

  // Clear the reset auth and otp store
  useEffect(() => {
    resetAuth();
    resetOtpStore();
  }, []);

  const isEmailValid = () => {
    if (emailInput.length != 0) {
      setEmailError("");
    }
  };

  const isPasswordValid = () => {
    if (password.length != 0) {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    if (emailInput === "") {
      setEmailError("Please enter an email!");
    }

    if (password === "") {
      setPasswordError("Please enter a password");
    }

    try {
      const response = await axios({
        method: "POST",
        url: `${API_URL}/login`,
        data: { email: emailInput, password: password },
      });
      setUserId(response.data.userId);
      setEmail(emailInput);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg =
          error.response?.data?.errorMsg || "An error occurred during login";
        setErrorMsg(msg);
      } else {

        setErrorMsg("An unexpected error occurred");
      }

      // Logout if user change its password
      if (token && userId) {
        await axios.post(`${API_URL}/logout`, { token, userId });
      }
      resetOtpStore();
      resetAuth();
    }
  };

  useEffect(() => {
    if (userId) {
      setShowAuthenticationModal(true);
    }
  }, [userId]);

  const handleCloseOTPModal = () => {
    resetAuth();
    setShowAuthenticationModal(false);
  };

  useEffect(() => {
    if (emailInput.length == 0 || password.length == 0) {
      setDisableButton(true);
    } else {
      setDisableButton(false);
    }
  }, [emailInput, password]);

  return (
    <div className="flex w-full max-w-[900px] max-h-[560px] rounded-[16px] border border-border overflow-hidden bg-card shadow-xl">
      {showAuthenticationModal && (
        <AuthenticationModal
          onClose={() => handleCloseOTPModal()}
          userId={userId!}
          email={emailInput}
        />
      )}

      {/* Left gradient panel */}
      <div
        className="hidden md:flex w-[360px] shrink-0 flex-col justify-between p-8"
        style={{ background: "linear-gradient(165deg,#101512,#0B0C0E)" }}
      >
        <img src="/FinpayDarkMode.png" alt="FinPay Logo" className="h-8 w-auto" />
        <div className="flex flex-col gap-3">
          <h2 className="text-[26px] font-semibold leading-tight text-primary-foreground">
            Money that moves at your pace.
          </h2>
          <p className="text-muted-foreground text-sm">
            Track spending, split bills, and manage your money with a system built for clarity.
          </p>
          <div className="flex flex-wrap gap-2">
            <Pill tone="positive">No hidden fees</Pill>
            <Pill tone="positive">Bank-grade security</Pill>
          </div>
        </div>
      </div>

      {/* Right form column */}
      <div className="flex flex-1 flex-col justify-center px-6 py-8 sm:px-10">
        <div className="mx-auto flex w-full max-w-[320px] flex-col gap-4">
          <h1 className="text-2xl font-bold text-foreground text-center mb-2">
            Welcome back
          </h1>

          {errorMsg.length != 0 && (
            <p className="text-destructive text-sm text-center">{errorMsg}</p>
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full"
            // ponytail: passkey UI only, no WebAuthn
            onClick={() => {}}
          >
            Continue with a passkey
          </Button>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-subtle text-xs">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          <label className="flex flex-col gap-1">
            <Label>Email</Label>
            <Input
              type="email"
              icon={<Mail className="h-4 w-4" />}
              value={emailInput}
              onBlur={() => isEmailValid()}
              onChange={(e) => setEmailInput(e.target.value)}
              placeholder="Enter your email"
              error={emailError !== ""}
            />
            {emailError !== "" && (
              <p className="text-destructive text-sm">{emailError}</p>
            )}
          </label>

          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              <button
                type="button"
                onClick={() => navigate("/forgotpassword")}
                className="text-subtle text-xs underline cursor-pointer"
              >
                Forgot?
              </button>
            </div>
            <div
              tabIndex={0}
              onFocus={() => setPasswordOnFocus(true)}
              onBlur={() => setPasswordOnFocus(false)}
              className={`relative w-full rounded-lg p-2 border-2 ${
                passwordOnFocus
                  ? "border-ring ring-2 ring-ring/40"
                  : "border-input"
              }`}
            >
              <input
                data-testid="password-input"
                type={showPassword ? "text" : "password"}
                value={password}
                onBlur={() => isPasswordValid()}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="border-none w-full focus:outline-none bg-transparent text-foreground"
              />
              {showPassword == false ? (
                <FaEyeSlash
                  className="absolute right-2 bottom-2.5 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              ) : (
                <IoEyeSharp
                  className="absolute right-2 bottom-2.5 cursor-pointer"
                  onClick={() => setShowPassword(!showPassword)}
                />
              )}
            </div>
            {passwordError !== "" && (
              <p className="text-destructive text-sm">{passwordError}</p>
            )}
          </div>

          <Button
            onClick={() => handleLogin()}
            disabled={disableButton}
            className="w-full"
          >
            Sign in
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <button
              onClick={() => navigate("/register")}
              className="underline cursor-pointer text-foreground"
            >
              Create an account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginForm;
