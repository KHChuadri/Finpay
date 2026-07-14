import { useState, useEffect } from "react";
import { Eye, EyeOff } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import AuthenticationModal from "@/components/modal/authenticationModal";
import useOtpStore from "@/stores/otpStore";
import { API_URL } from "@/constants/API_URL";
import { Input } from "@/components/ui/Input";
import { Label } from "@/components/ui/Label";
import { Button } from "@/components/ui/Button";

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
    <div className="glass flex flex-col rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 transition ease-in-out">
      {showAuthenticationModal && (
        <AuthenticationModal
          onClose={() => handleCloseOTPModal()}
          userId={userId!}
          email={emailInput}
        />
      )}
      <h3 className="text-foreground text-2xl font-bold pt-2 text-center mb-2">
        Login
      </h3>
      {errorMsg.length != 0 && (
        <p className="text-destructive text-md">{errorMsg}</p>
      )}
      <label className="flex flex-col gap-1">
        <Label>Email</Label>
        <Input
          type="email"
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

      <label className="flex flex-col gap-1">
        <Label>Password</Label>
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
            <EyeOff
              className="absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            />
          ) : (
            <Eye
              className="absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
        </div>
        {passwordError !== "" && (
          <p className="text-destructive text-sm">{passwordError}</p>
        )}
      </label>

      <Button
        onClick={() => handleLogin()}
        disabled={disableButton}
        className="w-full rounded-xl py-2"
      >
        Submit
      </Button>

      <Button
        variant="ghost"
        onClick={() => navigate("/")}
        className="w-full rounded-xl py-2"
      >
        Back
      </Button>

      <button
        onClick={() => navigate("/forgotpassword")}
        className="underline self-center cursor-pointer text-subtle"
      >
        Reset password
      </button>
    </div>
  );
};

export default LoginForm;
