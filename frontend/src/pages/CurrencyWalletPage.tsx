import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Users, X, ArrowLeftRight } from "lucide-react";
import axios from 'axios';
import Layout from '@/components/Layout';
import HeaderButtons from '@/components/dashboard/HeaderButtons';
import FlagGetter from '@/components/FlagGetter';
import useAuthStore from '@/stores/authStore';
import ConfirmationModal from '@/components/modal/ConfirmationModal';
import { useTransactionStore } from '@/stores/transactionStore';
import { API_URL } from '@/constants/API_URL';
import { Button } from '@/components/ui/Button';

interface UserWalletData {
  walletId: string,
  walletBalance: number;
  walletCurrency: string;
}

interface Currency {
  code: string; // e.g, 'AUD'
  countryCode: string; // e.g, 'AU'
  label: string; // e.g, 'Australian Dollar'
  flag: string;
  localeString: string; // e.g, 'en-AU'
}

const CurrencyWalletPage = () => {
  const navigate = useNavigate();
  const userId = useAuthStore.getState().userId;
  const token = useAuthStore.getState().token;
  const email = useAuthStore((state) => state.email);
  const { currencyCode } = useParams();
  const [currency, setCurrency] = useState<Currency>();
  const currencyList = useTransactionStore((c) => c.currencies);
  const {setCurrencyFrom, setCurrencyTo, setRecipient, setRecipientEmail, setTransactionType} = useTransactionStore();
  const [userWallet, setUserWallet] = useState<UserWalletData>();
  const [showCloseModal, setShowCloseModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserWallet = async () => {
      if (!userId) { setErrorMsg("Missing user ID"); return; }
      if (!currencyCode) { setErrorMsg("Missing currency code"); return; }

      try {
        const response = await axios.get(`${API_URL}/currencywallet/${currencyCode}/${userId}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        const walletData = response.data as UserWalletData;
        setUserWallet({
          walletId: walletData.walletId,
          walletBalance: walletData.walletBalance as number,
          walletCurrency: walletData.walletCurrency as string,
        });
      } catch (error: unknown) {
        if (axios.isAxiosError(error)) {
          const msg = error.response?.data?.errorMsg || 'Something went wrong';
          setErrorMsg(msg);
        } else {
          setErrorMsg('An unexpected error occurred');
        }
      }
    };

    const fetchCountryData = () => {
      if (!currencyCode) return;
      const currency = currencyList.find(
        (curr) => curr.code.toLowerCase() === currencyCode.toLowerCase()
      );
      if (currency) setCurrency(currency);
    };

    fetchCountryData();
    fetchUserWallet();
  }, [userId, token, currencyCode, currencyList]);

  const handleCloseWallet = async () => {
    if (!userId) { setErrorMsg("Missing user ID"); return; }
    if (!currencyCode) { setErrorMsg("Missing currency code"); return; }
    if (!userWallet) { setErrorMsg("Missing user wallet"); return; }

    try {
      setIsClosing(true);

      // Check if the balance is zero
      if (userWallet.walletBalance > 0) {
        setErrorMsg("You cannot close this wallet as it contains money");
        setShowCloseModal(false);
        setIsClosing(false);
        return;
      }

      await axios.delete(`${API_URL}/${currencyCode}/${userId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setIsClosing(false);
      navigate('/dashboard');
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || 'Something went wrong';
        setErrorMsg(msg);
      } else {
        setErrorMsg('An unexpected error occurred');
      }
    }
  };

  const handleConversion = () => {
    const currCurrency = currencyList.filter(c => c.code.toLowerCase() === currencyCode?.toLowerCase());
    setCurrencyFrom(currCurrency[0]);
    if (currencyCode?.toLowerCase() !== 'AUD'.toLowerCase()) {
      setCurrencyTo( { code: 'AUD', countryCode: 'AU', label: 'Australian Dollar', flag: '🇦🇺', localeString: 'en-AU' },) // Set to AUD by default
    }
    setTransactionType('transfer');
    setRecipientEmail(email!);
    setRecipient({
      email: 'SELF',
      walletInfo: [userWallet!.walletId]
    })
    navigate('/transfer/amount');
  }

  return (
    <Layout headerRight={<HeaderButtons />}>
      {/* Loading section */}
      {!userWallet &&
        <div className="p-10 text-muted-foreground text-xl">Loading wallet data...</div>
      }

      {/* Error Message */}
      {errorMsg && (
        <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-destructive/10 border-2 border-destructive text-destructive rounded z-50">
          <p className="break-words w-full pr-8">{errorMsg}</p>
          <button
            onClick={() => setErrorMsg(null)}
            className="absolute top-4 right-4 text-destructive hover:text-destructive/80"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div className="relative w-full p-6 md:p-10">
        {/* Balance Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 sm:gap-6">
          <div className="flex flex-col items-center md:items-start gap-3 sm:gap-5 flex-1 w-full">
            {/* Mobile Close Balance Button */}
            <div className="flex justify-end w-full md:hidden">
              <Button
                variant="destructive"
                onClick={() => setShowCloseModal(true)}
                className="flex items-center gap-2 text-base sm:text-lg"
              >
                <X size={16} />
                <span className="sr-only">Close balance</span>
              </Button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
              {currency && <FlagGetter countryCodes={currency.countryCode.toLowerCase()} />}
              <h1 className="text-foreground font-bold text-2xl sm:text-4xl md:text-5xl">
                {currency?.code} Balance
              </h1>
            </div>

            <h2 className="text-foreground font-bold text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-mono tabular-nums">
              {userWallet?.walletBalance?.toLocaleString('en-AU', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h2>
          </div>

          {/* Close Balance Button */}
          <Button
            variant="destructive"
            onClick={() => setShowCloseModal(true)}
            className="hidden md:flex items-center gap-2 text-lg absolute top-6 md:top-10 right-6 md:right-10"
          >
            <X className="h-5 w-5" />
            Close balance
          </Button>
        </div>

        {/* Action Buttons */}
        <div className="mt-8 sm:mt-12">
          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 max-w-3xl mx-auto">
            {[
              { icon: <ArrowUp className="h-5 w-5 text-foreground" />, label: 'Deposit', action: () => navigate('/deposit') },
              { icon: <ArrowDown className="h-5 w-5 text-foreground" />, label: 'Withdraw', action: () => navigate('/withdraw') },
              { icon: <ArrowLeftRight className="h-5 w-5 text-play-cyan" />, label: 'Convert', action: () => handleConversion() },
              { icon: <Users className="h-5 w-5 text-primary" />, label: 'Send', action: () => navigate('/transfer/recipient') }
            ].map((button, index) => (
              <div key={index} className="flex flex-col items-center gap-2 w-[calc(50%-4rem)] sm:w-auto">
                <button
                  onClick={button.action}
                  className="bg-card rounded-full w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 font-bold text-lg sm:text-xl md:text-2xl flex justify-center items-center hover:scale-105 sm:hover:scale-110 transform transition-all duration-300 shadow-sm hover:shadow-md"
                >
                  {button.icon}
                </button>
                <h1 className="font-bold text-sm sm:text-base md:text-lg lg:text-xl">{button.label}</h1>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      {showCloseModal && (
        <ConfirmationModal
          message={`Are you sure you want to close your ${currency?.code} balance?`}
          confirmText={isClosing ? "Closing..." : "Close Balance"}
          onConfirm={handleCloseWallet}
          onCancel={() => setShowCloseModal(false)}
          disabled={isClosing}
        />
      )}
    </Layout>
  );
};

export default CurrencyWalletPage;