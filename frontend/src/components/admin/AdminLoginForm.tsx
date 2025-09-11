import { useState, useEffect } from "react";
import { FaEyeSlash } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import { API_URL } from "@/constants/API_URL";

const AdminLoginForm = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [disableButton, setDisableButton] = useState(true);
  const [passwordOnFocus, setPasswordOnFocus] = useState(false);

  const navigate = useNavigate();
  const { setAuth, resetAuth, token, userId } = useAuthStore();

  useEffect(() => {
    resetAuth();
  }, []);

  const isEmailValid = () => {
    if (email.length != 0) {
      setEmailError("");
    }
  };

  const isPasswordValid = () => {
    if (password.length != 0) {
      setPasswordError("");
    }
  };

  const handleLogin = async () => {
    if (email === "") {
      setEmailError("Please enter an email!");
    }

    if (password === "") {
      setPasswordError("Please enter a password");
    }

    try {
      const response = await axios({
        method: "POST",
        url: `${API_URL}/admin/login`,
        data: { email: email, password: password },
      });
      setAuth(response.data.token, response.data.userId);
      navigate('/admin');
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
        await axios.post("http://localhost:3000/logout", { token, userId });
      }
      resetAuth();
    }
  };


  useEffect(() => {
    if (email.length == 0 || password.length == 0) {
      setDisableButton(true);
    } else {
      setDisableButton(false);
    }
  }, [email, password]);

  return (
    <div className="flex flex-col bg-white rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 shadow-2xl transition ease-in-out">
      <h3 className="text-black text-2xl font-bold pt-2 text-center mb-2">
        Admin Login
      </h3>
      {errorMsg.length != 0 && (
        <p className="text-red-500 text-md">{errorMsg}</p>
      )}
      <label className="flex flex-col">
        Email
        <input
          type="email"
          value={email}
          onBlur={() => isEmailValid()}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Enter your email"
          className="border-2 border-gray-300 p-2 rounded-lg focus:outline-2 focus:outline-blue-300"
        />
        {emailError !== "" && (
          <p className="text-red-500 text-sm">{emailError}</p>
        )}
      </label>

      <label className="flex flex-col">
        Password
        <div
          tabIndex={0}
          onFocus={() => setPasswordOnFocus(true)}
          onBlur={() => setPasswordOnFocus(false)}
          className={`relative w-full rounded-lg p-2 ${
            passwordOnFocus
              ? "outline-2 outline-blue-300"
              : "border-2 border-gray-300"
          }`}
        >
          <input
            data-testid="password-input"
            type={showPassword ? "text" : "password"}
            value={password}
            onBlur={() => isPasswordValid()}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            className="border-none w-full focus:outline-none"
          />
          {showPassword == false ? (
            <FaEyeSlash
              className="absolute right-2 bottom-2.5"
              onClick={() => setShowPassword(!showPassword)}
            />
          ) : (
            <IoEyeSharp
              className="absolute right-2 bottom-2.5"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
        </div>
        {passwordError !== "" && (
          <p className="text-red-500 text-sm">{passwordError}</p>
        )}
      </label>

      <button
        onClick={() => handleLogin()}
        disabled={disableButton}
        className={`w-full text-white p-2 text-center rounded-xl font-bold hover:opacity-80 
          ${
            disableButton
              ? "bg-gray-400 hover:cursor-not-allowed"
              : "bg-[#C6412A] hover:cursor-pointer"
          }`}
      >
        Submit
      </button>

      <button
        onClick={() => navigate("/")}
        className="w-full border-2 border-[#C6412A] text-center p-2 text-[#C6412A] rounded-xl font-bold hover:opacity-80 hover:cursor-pointer"
      >
        Back
      </button>

      <button
        onClick={() => navigate("/forgotpassword")}
        className="underline self-center cursor-pointer text-gray-400"
      >
        Reset password
      </button>
    </div>
  );
};

export default AdminLoginForm;
