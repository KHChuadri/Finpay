import { useEffect, useRef, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import { CiTimer } from "react-icons/ci";
import useAuthStore from "@/stores/authStore";
import Header from "@/components/transaction/Header";
import Layout from "@/components/Layout";
import SuccessfulTransferModal from "@/components/modal/SuccessfulTransferModal";
import FailedTransferModal from "@/components/modal/FailedTransferModal";
import useScheduledPaymentStore from "@/stores/scheduledPaymentStore";
import ScheduledPayment from "../modal/ScheduledPayment";
import AuthenticationModal from "@/components/modal/authenticationModal";
import axios from "axios";
import useOtpStore from "@/stores/otpStore";
import CircularProgress from "@mui/material/CircularProgress";

const Pay = () => {
  const {
    rawSourceCurrencyAmount,
    destCurrencyAmount,
    serviceFee,
    currencyFrom,
    currencyTo,
    recipientEmail,
    isValidAmountPage,
  } = useTransactionStore();
  const { userId, email, token } = useAuthStore();
  const { isOTPVerified } = useOtpStore();
  const {
    setShowScheduledPaymentModal,
    showScheduledPaymentModal,
    scheduleStatus,
    recurringStatus,
    paymentDate,
  } = useScheduledPaymentStore();

  const navigate = useNavigate();
  const location = useLocation();
  const [amountInAUD, setAmountInAUD] = useState<number | null>(null);
  const [needOTP, setNeedOTP] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  // const [userWallet, setUserWallet] = useState<Wallet | null>(null);
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const submittingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    const computeAud = async () => {
      try {
        if (currencyFrom.code === "AUD") {
          if (!cancelled) setAmountInAUD(rawSourceCurrencyAmount);
          return;
        }
        const res = await axios.get(
          `http://localhost:3000/exchangerate/${currencyFrom.code}/AUD`
        );
        const rate = Number(res.data?.rate ?? NaN);
        const aud = rate * Number(rawSourceCurrencyAmount);
        if (!cancelled && Number.isFinite(aud)) {
          setAmountInAUD(aud);
        }
      } catch {
        if (!cancelled) setAmountInAUD(rawSourceCurrencyAmount);
      }
    };

    computeAud();
    return () => {
      cancelled = true;
    };
  }, [currencyFrom.code, rawSourceCurrencyAmount]);

  useEffect(() => {
    if (amountInAUD && amountInAUD > 50) {
      setNeedOTP(true);
    }
  }, [amountInAUD]);

  useEffect(() => {
    const isTransferPage = location.pathname.startsWith("/transfer");
    if (isTransferPage && recipientEmail.length == 0) {
      navigate("/transfer/recipient");
    } else if (isTransferPage && !isValidAmountPage()) {
      navigate("/transfer/amount");
    }
  }, [location.pathname]);

  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!userId) {
        setErrorMsg("Missing userID");
        return;
      }

      try {
        const response = await axios.get(
          `http://localhost:3000/wallet/${userId}?currency=${currencyFrom.code}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setCurrentBalance(response.data.correspondingWallet.walletBalance);
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data?.errorMsg || "Something went wrong";
          setErrorMsg(msg);
        } else {
          setErrorMsg("An unexpected error occurred");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserWallet();
  }, [userId]);

  // useEffect(() => {
  //   if (userWallet) {
  //     setCurrentBalance(userWallet.walletBalance);
  //   }
  // }, [userWallet]);

  const authenticateTransaction = () => {
    if (needOTP && !isOTPVerified && !submittingRef.current) {
      setShowAuthenticationModal(true);
      return;
    }
    handleSend();
  };

  const handleSend = async () => {
    setIsLoading(true);
    if (submittingRef.current) return;
    submittingRef.current = true;

    try {
      let response;
      const amountSrc = parseFloat(rawSourceCurrencyAmount.toFixed(2));
      const amountDest = parseFloat(destCurrencyAmount.toFixed(2));

      if (
        amountSrc === 0.0 ||
        !amountSrc ||
        !recipientEmail
      ) {
        setShowFailedModal(true);
        return;
      }

      if (scheduleSuccess) {
        const schedulePaymentPayload = {
          debtorUserId: useAuthStore.getState().userId,
          creditorUserEmail: recipientEmail,
          scheduledDate: paymentDate,
          amountSrc,
          amountDest,
          currencySrc: currencyFrom.code,
          currencyDest: currencyTo.code,
        };

        response = await axios.post(
          "http://localhost:3000/schedule/payment",
          schedulePaymentPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        const transferPayload = {
          debtorUserId: useAuthStore.getState().userId,
          creditor: recipientEmail,
          amountSrc,
          amountDest,
          srcCurrency: currencyFrom.code,
          destCurrency: currencyTo.code,
        };

        response = await axios.post(
          "http://localhost:3000/p2ptransfer",
          transferPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      }

      if (response.data.success) {
        setShowSuccessfulModal(true);
      }
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const msg = err.response?.data?.errorMsg || "Transaction Failed";
        setErrorMsg(msg);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
      setShowFailedModal(true);
    } finally {
      setIsLoading(false);
      submittingRef.current = false;
    }
  };

  return (
    <div className="flex flex-col w-full min-h-screen">
      <Layout>
        <div className="flex flex-col flex-grow items-center justify-center w-full h-full mb-5">
          <div className="w-7/8 md:w-1/2 lg:w-1/3 bg-white flex flex-col rounded-xl">
            <Header />

            <div className="flex flex-col w-full gap-6 p-6">
              <h2 className="text-2xl font-bold">Pay with your Finpay card</h2>

              <div className="flex justify-between">
                <span className="w-40">Your current balance:</span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {currentBalance.toFixed(2)} {currencyFrom?.code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="w-40">You send exactly:</span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {rawSourceCurrencyAmount.toFixed(2)} {currencyFrom?.code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="w-40">
                  Service Fee: (included in total amount)
                </span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {rawSourceCurrencyAmount * parseFloat(serviceFee.toFixed(2))}{" "}
                  {currencyFrom?.code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="w-40">
                  Recipient receives exactly: (after service fee)
                </span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {destCurrencyAmount.toFixed(2)} {currencyTo?.code}
                </span>
              </div>

              <hr />

              <div className="flex justify-between">
                <span className="w-40">Balance after transaction:</span>
                <span className="font-mono text-right w-28 tabular-nums">
                  {(currentBalance - rawSourceCurrencyAmount).toFixed(2)}{" "}
                  {currencyFrom?.code}
                </span>
              </div>

              <button
                className="flex flex-row justify-between p-5 items-center gap-5 border hover:bg-[#A8321E]/20 font-semibold py-3 rounded-md cursor-pointer"
                onClick={() => setShowScheduledPaymentModal(true)}
              >
                <div className="flex justify-center items-center gap-5">
                  <CiTimer className="h-[30px] w-[30px]" />
                  <div className="flex flex-col text-left">
                    <p>{scheduleStatus}</p>
                    <p className="text-xs font-normal">{recurringStatus}</p>
                  </div>
                </div>
                {scheduleSuccess ? (
                  <>
                    <p className="bg-green-200 p-2 text-green-950 rounded-full">
                      Scheduled
                    </p>
                  </>
                ) : (
                  <>
                    <p className="bg-[#A8321E]/10 p-2 text-[#C6412A] rounded-full">
                      Schedule
                    </p>
                  </>
                )}
              </button>

              <button
                className="w-full bg-[#C6412A] hover:bg-[#A8321E] text-white font-semibold py-3 rounded-md cursor-pointer"
                onClick={() => authenticateTransaction()}
                disabled={isLoading}
                data-testid="button-pay"
              >
                {isLoading ? (
                  <CircularProgress color="inherit" size={20} />
                ) : (
                  "Pay"
                )}
              </button>
            </div>
          </div>

          {showAuthenticationModal && (
            <AuthenticationModal
              onClose={() => setShowAuthenticationModal(false)}
              userId={userId!}
              email={email!}
            />
          )}
          {showSuccessfulModal && <SuccessfulTransferModal />}
          {showFailedModal && <FailedTransferModal errorMsg={errorMsg} />}
          {showScheduledPaymentModal && (
            <ScheduledPayment setSuccess={() => setScheduleSuccess(true)} />
          )}
        </div>
      </Layout>
    </div>
  );
};

export default Pay;