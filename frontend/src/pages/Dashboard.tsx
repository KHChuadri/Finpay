import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { FaTimes } from "react-icons/fa";
import axios from "axios";
import { IoIosSend, IoMdArrowDown, IoMdArrowUp } from "react-icons/io";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import { ArrowDownLeft, ArrowUpRight } from "lucide-react";
import Layout from '../components/Layout';
import HeaderButtons from "@/components/dashboard/HeaderButtons";
import CurrencyWallet from "../components/dashboard/CurrencyWallet";
import useAuthStore from "@/stores/authStore";
import { useTransactionStore } from "@/stores/transactionStore";
import { syncUserStatus } from "@/utils/syncUserStatus";
import { API_URL } from "@/constants/API_URL";
import { Card } from '@/components/ui/Card';
import { Pill } from '@/components/ui/Pill';
import { CountUp } from '@/components/ui/CountUp';
import { cn } from '@/lib/utils';

export interface UserWalletInfo {
  _id?: string;
  userId: string;
  countryCode: string; // e.g., "au" for Australia
  walletBalance: number;
  walletCurrency: string; // e.g., "AUD" for Australia
  currencyName: string; // e.g., "Australian Dollar"
}

// ponytail: static sample rows; wire to /history data when a dashboard feed endpoint exists
const recentActivity = [
  { description: 'Payment received', subline: 'From Alex Nguyen', type: 'Incoming', date: 'Jul 14', amount: 250.0, incoming: true },
  { description: 'Coffee & co.', subline: 'Card purchase', type: 'Purchase', date: 'Jul 13', amount: -6.5, incoming: false },
  { description: 'Transfer to savings', subline: 'Internal transfer', type: 'Transfer', date: 'Jul 12', amount: -400.0, incoming: false },
  { description: 'Freelance invoice', subline: 'From Studio Nine', type: 'Incoming', date: 'Jul 10', amount: 1200.0, incoming: true },
];

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
        currencyName: wallet.currencyName,
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

  const quickActions = [
    { testId: 'Send-dashboard-button', label: 'Send', Icon: IoIosSend, onClick: () => navigate('/transfer/recipient') },
    { testId: 'Deposit-dashboard-button', label: 'Deposit', Icon: IoMdArrowUp, onClick: () => navigate('/deposit') },
    { testId: 'Withdraw-dashboard-button', label: 'Withdraw', Icon: IoMdArrowDown, onClick: () => navigate('/withdraw') },
    { testId: 'Convert-dashboard-button', label: 'Convert', Icon: FaArrowRightArrowLeft, onClick: handleConvertNavigation },
  ];

  return (
    <Layout title="Home" headerRight={<HeaderButtons />}>
      {/* Error Message */}
      {errorMessage && (
        <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-destructive-tint border border-destructive-tint-border text-destructive rounded-[10px] z-50">
          <p className="break-words w-full pr-8">{errorMessage}</p>
          <button
            onClick={() => setErrorMessage(null)}
            className="absolute top-4 right-4 text-destructive hover:text-destructive/80 cursor-pointer"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="flex flex-col gap-5">
        {/* Balance hero */}
        <Card className="flex flex-col gap-6 bg-[linear-gradient(180deg,var(--card),var(--panel))] border border-border rounded-[14px] p-[22px] sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p data-testid="total-balance-heading" className="text-muted-foreground text-[12.5px]">Total balance</p>
            <div className="mt-1 flex items-end gap-2">
              <p data-testid="wallet-currency" className="num text-[38px] font-semibold text-foreground leading-none">
                $<CountUp value={audTotal} />
              </p>
              <span data-testid="aud-currency" className="text-xl text-foreground">AUD</span>
            </div>
            <div className="mt-2 flex items-center gap-2">
              <Pill tone="positive">+2.4%</Pill>
              <span className="text-subtle text-[12px]">vs last month</span>
            </div>
          </div>

          <div className="flex gap-3">
            {quickActions.map(({ testId, label, Icon, onClick }) => (
              <div key={testId} className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  onClick={onClick}
                  data-testid={testId}
                  className="flex h-[44px] w-[44px] items-center justify-center rounded-[11px] border border-border-strong bg-card2 text-foreground hover:border-primary hover:text-primary transition-colors cursor-pointer"
                >
                  <Icon className="h-[18px] w-[18px]" />
                </button>
                <span className="text-[11.5px] text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </Card>

        {/* Wallets grid */}
        <CurrencyWallet userWallets={userWallets} onAddWallet={fetchUserWallet} />

        {/* Recent activity */}
        <Card className="p-0 overflow-hidden">
          <div className="grid grid-cols-[1fr_110px_120px_130px] gap-2 bg-panel px-4 py-2 font-mono text-[10.5px] uppercase tracking-wide text-subtle">
            <span>Description</span>
            <span>Type</span>
            <span>Date</span>
            <span className="text-right">Amount</span>
          </div>

          <div className="flex flex-col">
            {recentActivity.map((row, index) => (
              <div
                key={index}
                className="grid grid-cols-[1fr_110px_120px_130px] items-center gap-2 px-4 py-3 border-t border-border"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={cn(
                      'flex h-[30px] w-[30px] shrink-0 items-center justify-center rounded-[7px]',
                      row.incoming ? 'bg-green-tint text-primary' : 'bg-card2 text-muted-foreground',
                    )}
                  >
                    {row.incoming ? <ArrowDownLeft className="h-4 w-4" /> : <ArrowUpRight className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-[13px] font-medium text-foreground">{row.description}</p>
                    <p className="truncate text-[12px] text-subtle">{row.subline}</p>
                  </div>
                </div>
                <Pill>{row.type}</Pill>
                <span className="text-subtle text-[13px]">{row.date}</span>
                <span className={cn('num text-right text-[13px]', row.amount > 0 ? 'text-primary' : 'text-foreground')}>
                  {row.amount > 0 ? '+' : '−'}${Math.abs(row.amount).toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </Layout>
  );
};

export default Dashboard;
