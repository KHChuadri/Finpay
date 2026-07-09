import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { IoIosSend, IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import Layout from '../components/Layout';
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import CurrencyWallet from "../components/dashboard/CurrencyWallet";
import useAuthStore from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { syncUserStatus } from "@/utils/syncUserStatus";
import { API_URL } from "@/constants/API_URL";
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';

export interface UserWalletInfo {
  _id?: string;
  userId: string;
  countryCode: string; // e.g., "au" for Australia
  walletBalance: number;
  walletCurrency: string; // e.g., "AUD" for Australia
  currencyName: string; // e.g., "Australian Dollar"
}

const Dashboard = () => {
  const navigate = useNavigate();
  const userId = useAuthStore((state) => state.userId);
  const token = useAuthStore((state) => state.token);
  const email = useAuthStore((state) => state.email);
  const [userWallets, setUserWallets] = useState<UserWalletInfo[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { setRecipient, setRecipientEmail, setTransactionType, resetRequest, resetTransfer } = useTransactionStore();

  useEffect(() => {
    fetchUserWallet();
    syncUserStatus();
    resetRequest();
    resetTransfer();
  }, []);

  const fetchUserWallet = async () => {
    try {
      if (!userId) {
        setErrorMessage("No user ID found");
        return;
      }

      const response = await axios.get(`${API_URL}/wallet/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const walletData = response.data.wallets;

      const mappedWallets = walletData.map((wallet: UserWalletInfo) => ({
        _id: wallet._id,
        userId: wallet.userId,
        countryCode: wallet.walletCurrency.slice(0, 2).toLowerCase(),
        walletBalance: wallet.walletBalance,
        walletCurrency: wallet.walletCurrency,
      }));

      setUserWallets(mappedWallets);
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || 'Something went wrong';
        setErrorMessage(msg);
        console.error('Fetching user wallet error in dashboard:', msg);
      } else {
        setErrorMessage('An unexpected error occurred');
      }
    }
  };

  const handleConvertNavigation = () => {
    const selfRecipient = {
      email: 'SELF',
      walletInfo: userWallets
        .map((w) => w._id)
        .filter((id): id is string => typeof id === 'string')
    };
    setTransactionType('transfer');
    setRecipient(selfRecipient);
    setRecipientEmail(email!);
    navigate('/transfer/amount');
  }

  const audTotal = userWallets
    .filter((w) => w.walletCurrency === 'AUD')
    .reduce((total, w) => total + w.walletBalance, 0);

  return (
    <Layout headerRight={<HeaderButtons />}>
      {/* Error Message */}
      {errorMessage && (
        <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-red-200 border-2 border-red-400 text-red-700 rounded z-50">
          <p className="break-words w-full pr-8">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="absolute top-4 right-4 text-red-700 hover:text-red-900 cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row items-center md:items-center w-full md:px-4 py-8 space-y-6 md:space-y-0 md:space-x-10 min-h-[400px]">
        {/* Send Transactions Section*/}
        <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 mb-8 md:mb-0 items-center md:items-start text-center md:text-left">
          <div>
            <h2 className="text-3xl font-bold mb-2">Send Transactions</h2>
            <p className="text-muted-foreground">
              Create and send your transactions to your peers
            </p>
          </div>
          <div className="md:flex md:flex-row gap-4 grid grid-cols-2">
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate("/transfer/recipient")}
                data-testid="Send-dashboard-button"
                className="w-18 h-18 sm:w-20 sm:h-20 bg-card border border-border hover:border-border-strong text-foreground rounded-full cursor-pointer transition-colors shadow-sm flex items-center justify-center"
              >
                <IoIosSend className="w-8 h-8" />
              </button>
              <label className="mt-1 text-muted-foreground">Send</label>
            </div>
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate("/deposit")}
                data-testid="Deposit-dashboard-button"
                className="w-18 h-18 sm:w-20 sm:h-20 bg-card border border-border hover:border-border-strong text-foreground rounded-full cursor-pointer transition-colors shadow-sm flex items-center justify-center"
              >
                <IoMdArrowUp className="w-8 h-8" />
              </button>
              <label className="mt-1 text-muted-foreground">Deposit</label>
            </div>
            <div className="flex flex-col items-center">
              <button
                onClick={() => navigate("/withdraw")}
                data-testid="Withdraw-dashboard-button"
                className="w-18 h-18 sm:w-20 sm:h-20 bg-card border border-border hover:border-border-strong text-foreground rounded-full cursor-pointer transition-colors shadow-sm flex items-center justify-center"
              >
                <IoMdArrowDown className="w-8 h-8" />
              </button>
              <label className="mt-1 text-muted-foreground">Withdraw</label>
            </div>
            <div className="flex flex-col items-center">
              <button
                onClick={() => handleConvertNavigation()}
                data-testid="Convert-dashboard-button"
                className="w-18 h-18 sm:w-20 sm:h-20 bg-card border border-border hover:border-border-strong text-foreground rounded-full cursor-pointer transition-colors shadow-sm flex items-center justify-center"
              >
                <FaArrowRightArrowLeft className="w-6 h-6" />
              </button>
              <label className="mt-1 text-muted-foreground">Convert</label>
            </div>
          </div>
        </div>

        {/* Right Wallet Section */}
        <div className="w-3/4 md:w-1/2 flex flex-col justify-center text-center md:text-left">

          <h2 data-testid="total-balance-heading" className="text-xl font-extrabold justify-center relative md:left-0 mb-2 md:ml-13">Total balance:</h2>

          <div className="flex justify-center md:justify-start md:items-end mb-2 relative md:left-0">
            <p data-testid="wallet-currency" className="text-2xl md:text-3xl font-bold mr-2 md:ml-13">
              $<CountUp value={audTotal} />
            </p>
            <p data-testid="aud-currency" className="text-2xl font-semibold">AUD</p>
          </div>

          {/* Wallet List */}
          <CurrencyWallet userWallets={userWallets} onAddWallet={fetchUserWallet} />
        </div>
      </div>

      <div className="flex flex-col bg-card border border-border rounded-2xl md:flex-row items-center w-full px-4 md:px-10 py-8 space-y-6 md:space-y-0 md:space-x-10 min-h-[400px]">
        <img src={'/request.jpg'} className="w-72 h-72 rounded-full mt-4 md:mt-0"></img>
        <div className="w-full flex flex-col justify-center space-y-6 items-center md:items-end text-center md:text-right">
          <div>
            <h2 className="text-2xl font-bold mb-2">Send Requests</h2>
            <p className="text-sm text-muted-foreground">
              Create and send transaction request to your peers
            </p>
          </div>
          <Button onClick={() => navigate("/request/recipient")} data-testid="send-requests-button" className="px-6 py-3 rounded-lg shadow-sm">
            Send Requests
          </Button>
        </div>
      </div>

      <div className="flex flex-col-reverse md:flex-row items-center w-full px-4 md:px-10 py-8 space-y-6 md:space-y-0 md:space-x-10 min-h-[400px]">
        <div className="w-full flex flex-col justify-center space-y-6 items-center md:items-start text-center md:text-left">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              User Transactions History
            </h2>
            <p className="text-sm text-muted-foreground">
              View your transactions transfer and request history here
            </p>
          </div>
          <Button onClick={() => navigate("/history")} data-testid="view-history-button" className="px-6 py-3 rounded-lg shadow-sm">
            View History
          </Button>
        </div>
        <img src={'/transaction.png'} className="w-72 h-72 rounded-full items-end"></img>
      </div>
    </Layout>
  );
};

export default Dashboard;