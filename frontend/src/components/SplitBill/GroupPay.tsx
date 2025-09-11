import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import useAuthStore from "@/stores/authStore";
import Header from "@/components/transaction/Header";
import Layout from "@/components/Layout";
import SuccessfulTopupModal from "../modal/SuccessfulTopupModal";
import FailedTransferModal from "@/components/modal/FailedTransferModal";
import AuthenticationModal from "@/components/modal/authenticationModal";
import axios from "axios";
import useOtpStore from "@/stores/otpStore";
import CircularProgress from "@mui/material/CircularProgress";
import { useGroupTransactionStore } from "@/stores/groupTransactionStore";

interface Wallet {
  _id: string;
  userId: string;
  walletBalance: number;
  walletCurrency: string;
  countryCode: string;
}

interface GroupInfo {
  _id: string;
  members: string[];
  transactionHistory: string[];
  admin: object;
  groupName: string;
  description: string;
  walletCurrency: string;
  walletBalance: number;
}

const GroupPay = () => {
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState("");
  const [userWallet, setUserWallet] = useState<Wallet | null>(null);
  const [showSuccessfulModal, setShowSuccessfulModal] = useState(false);
  const [showFailedModal, setShowFailedModal] = useState(false);
  const { groupId } = useParams();
  const [currentBalance, setCurrentBalance] = useState(0);
  const [showAuthenticationModal, setShowAuthenticationModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    isValidRecipientGroupPage,
    rawSourceCurrencyAmount,
    sourceCurrencyAmount,
    destCurrencyAmount,
    serviceFee,
    currencyFrom,
    currencyTo,
    recipient,
    transactionType,
    groupName,
    isValidAmountGroupPage,
  } = useGroupTransactionStore();
  const { userId, token, email } = useAuthStore();
  const { isOTPVerified } = useOtpStore();

  const needOTP = sourceCurrencyAmount > 50;

  useEffect(() => {
    if (!isValidRecipientGroupPage()) {
      navigate(`/groups/${groupId}`);
    } else if (!isValidAmountGroupPage()) {
      navigate(`/groups/topup/${groupId}/amount`);
    }
  });

  useEffect(() => {
    if (transactionType === "TopUp") {
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
          setUserWallet(response.data.correspondingWallet);
        } catch (error: unknown) {
          if (axios.isAxiosError(error)) {
            const msg =
              error.response?.data?.errorMsg || "Something went wrong";
            setErrorMsg(msg);
          } else {
            setErrorMsg("An unexpected error occurred");
          }
        } finally {
          setIsLoading(false);
        }
      };
      fetchUserWallet();
    }
  }, [userId]);

  const fetchGroupInformation = async () => {
    try {
      if (!groupId) {
        setErrorMsg("No group id found");
        return;
      }

      const response = await axios.get(
        `http://localhost:3000/groups/${groupId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const GroupData = response.data as GroupInfo;
      setCurrentBalance(GroupData.walletBalance);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || "Something went wrong";
        setErrorMsg(msg);
        console.error("Fetching group data error:", msg);
      } else {
        setErrorMsg("An unexpected error occurred");
      }
    }
  };

  useEffect(() => {
    if (transactionType === "TopUp" && userWallet) {
      setCurrentBalance(userWallet.walletBalance);
    } else if (transactionType === "Withdraw") {
      fetchGroupInformation();
    }
  }, [userWallet]);

  const authenticateTransaction = () => {
    if (needOTP && !isOTPVerified) {
      setShowAuthenticationModal(true);
    }

    if (!needOTP) {
      handleSend();
    }
  };

  useEffect(() => {
    if (isOTPVerified) {
      setShowAuthenticationModal(false);
      handleSend();
    }
  }, [isOTPVerified]);

  const handleSend = async () => {
    setIsLoading(true);
    try {
      let response;
      const amountSrc = parseFloat(sourceCurrencyAmount.toFixed(2));
      const amountDest = parseFloat(destCurrencyAmount.toFixed(2));

      if (
        amountSrc === 0.0 ||
        !amountSrc ||
        (!userWallet && transactionType === "TopUp") ||
        !recipient ||
        !recipient.walletInfo
      ) {
        setShowFailedModal(true);
        return;
      }

      if (transactionType === "TopUp") {
        const transferPayload = {
          debtorAccountWallet: userWallet,
          groupId: groupId,
          amountSrc,
          amountDest,
          srcCurrency: currencyFrom.code,
          destCurrency: currencyTo.code,
        };

        response = await axios.post(
          "http://localhost:3000/topup",
          transferPayload,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } else {
        const transferPayload = {
          creditorInfo: recipient,
          groupId: groupId,
          amountSrc,
          amountDest,
          srcCurrency: currencyFrom.code,
          destCurrency: currencyTo.code,
        };
        response = await axios.post(
          "http://localhost:3000/withdraw",
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
    }
  };

  return (
    <div className="flex flex-col w-full h-screen">
      <Layout>
        <div className="flex flex-col flex-grow items-center justify-center w-full h-full">
          <div className="w-1/2 lg:w-1/3 bg-white flex flex-col rounded-xl">
            <Header />

            <div className="flex flex-col w-full gap-6 p-6">
              {transactionType === "TopUp" && (
                <h2 className="text-2xl font-bold">
                  Pay with your Finpay card
                </h2>
              )}
              {transactionType === "Withdraw" && (
                <h2 className="text-2xl font-bold">
                  Paying with Shared Wallet {groupName}
                </h2>
              )}
              <div className="flex justify-between">
                <span className="w-40">You current balance:</span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {currentBalance.toFixed(2)} {currencyFrom?.code}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="w-40">You send exactly:</span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {sourceCurrencyAmount.toFixed(2)} {currencyFrom?.code}
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
                <span className="w-40">Recipient receives exactly:</span>
                <span className="font-mono text-right w-40 tabular-nums">
                  {destCurrencyAmount.toFixed(2)} {currencyTo?.code}
                </span>
              </div>

              <hr />

              <div className="flex justify-between">
                <span className="w-40">Balance after transaction:</span>
                <span className="font-mono text-right w-28 tabular-nums">
                  {(currentBalance - sourceCurrencyAmount).toFixed(2)}{" "}
                  {currencyFrom?.code}
                </span>
              </div>

              <button
                className="w-full bg-[#C6412A] hover:bg-[#A8321E] text-white font-semibold py-3 rounded-md cursor-pointer"
                onClick={() => authenticateTransaction()}
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
          {showSuccessfulModal && <SuccessfulTopupModal />}
          {showFailedModal && <FailedTransferModal errorMsg={errorMsg} />}
        </div>
      </Layout>
    </div>
  );
};

export default GroupPay;
