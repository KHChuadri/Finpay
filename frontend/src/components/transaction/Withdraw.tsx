import { useState } from "react";
import Layout from "../Layout";
import TextField from "@mui/material/TextField";
import { FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import useAuthStore from "@/stores/authStore";
import Notice from "../Notice";
import { API_URL } from "@/constants/API_URL";

const Withdraw = () => {
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [valid, setValid] = useState(false);
  const {userId, token, isVerified, isLocked} = useAuthStore();

  const handleWithdraw = async () => {
    try {
      setValid(false);
      await axios.get(`${API_URL}/bankintegration/withdraw`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        params: {
          amount: amount,
          userId: userId,
        },
      });
      navigate("/dashboard");
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || "Something went wrong";
        setErrorMessage(msg);
        console.error("Error When Making Deposit Item:", msg);
      } else {
        setErrorMessage("An unexpected error occurred");
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    if (input === "0" || input === "0.") {
      setValid(false);
    } else {
      setValid(true);
    }
    setAmount(input);
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Layout>
        {/* Error Message */}
        {errorMessage && (
          <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-destructive/10 border-2 border-destructive text-destructive rounded z-50">
            <p className="break-words w-full pr-8">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="absolute top-4 right-4 text-destructive hover:text-destructive/80 cursor-pointer"
            >
              <FaTimes />
            </button>
          </div>
        )}
        <div className="flex flex-grow justify-center items-center w-full h-full">
          <div className="relative w-2/3 md:w-2/5 lg:w-1/3 bg-card rounded-xl p-4 h-2/3">
            <button
              className="absolute top-5 left-5 w-5 h-5 cursor-pointer"
              data-testid="withdraw-dashboard-return"
              onClick={() => navigate("/dashboard")}
            >
              <FaTimes className="w-7 h-7 fill-muted-foreground" size={20}/>
            </button>
            <div className='flex px-4 py-6 flex-col gap-3'>
              <Notice />
              <div className="flex justify-center">
                <img
                  src="/Deposit.png"
                  alt="Deposit illustration"
                  className="w-40 h-40 m-2"
                />
              </div>
              <h1 className="text-lg md:text-2xl text-center">
                Enter a withdraw amount:
              </h1>
              <div className="flex flex-row items-end gap-5">
                <span className="text-lg pb-1">AUD</span>
                <TextField
                  fullWidth
                  size="medium"
                  id="standard-basic"
                  label="Amount"
                  variant="standard"
                  value={amount}
                  onChange={handleInputChange}
                />
              </div>
              <button
                disabled={!isVerified || isLocked}
                onClick={handleWithdraw}
                className={`mt-4 p-2 w-full py-3 font-bold rounded-xl transition ${
                  valid && isVerified && !isLocked
                    ? "bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                }`}
              >
                Initiate payment
              </button>
            </div>
          </div>
        </div>
      </Layout>
    </div>
  );
};

export default Withdraw;
