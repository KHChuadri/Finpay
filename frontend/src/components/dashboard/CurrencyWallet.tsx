import { useNavigate } from "react-router-dom";
import FlagGetter from "../FlagGetter";
import { useState } from "react";
import AddCurrencyModal from "../modal/AddCurrencyModal";
import axios from "axios";
import type { UserWalletInfo } from "@/pages/Dashboard";
import useAuthStore from "@/stores/authStore";
import { FaTimes } from "react-icons/fa";
import { API_URL } from "@/constants/API_URL";
import { Card } from "@/components/ui/Card";
import { Pill } from "@/components/ui/Pill";
import { cn } from "@/lib/utils";

interface WalletList {
  onAddWallet: () => void;
  userWallets: UserWalletInfo[];
}

function CurrencyWallet({ userWallets, onAddWallet }: WalletList) {
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const userId = useAuthStore.getState().userId;
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const toggleCurrencyModal = () => {
    setShowAddCurrencyModal(true);
  }
  const handleModalClose = () => {
    setShowAddCurrencyModal(false);
  }

  const handleCurrencyAddition = async (newCurrency: UserWalletInfo) => {
    try {
      await axios.put(`${API_URL}/wallet/${userId}`, {
        walletCurrency: newCurrency.walletCurrency,
      });

      handleModalClose();
      onAddWallet(); // Fetches the user wallet again from dashboard
    } catch (error: unknown) {
      handleModalClose();
      if (axios.isAxiosError(error)) {
        const msg = error.response?.data?.errorMsg || 'Error occurred while doing currency addition';
        setErrorMsg(msg);
      } else {
        setErrorMsg('An unexpected error occurred during currency addition');
      }
    }
  }

  return (
    <div className="relative">
      {/* Error Message */}
      {errorMsg && (
        <div className="flex max-w-md w-full px-4 py-3 fixed top-8 left-1/2 transform -translate-x-1/2 bg-destructive/10 border-2 border-destructive text-destructive rounded z-50">
          <p className="break-words w-full pr-8">{errorMsg}</p>
          <button
            onClick={() => setErrorMsg(null)}
            className="absolute top-4 right-4 text-destructive hover:text-destructive/80"
          >
            <FaTimes />
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {userWallets.map((item, index) => {
          const up = index % 2 === 0;
          return (
            <Card
              key={index}
              onClick={() => navigate(`/currencywallet/${item.walletCurrency}`)}
              className="cursor-pointer hover:border-border-strong text-left"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full">
                    <FlagGetter countryCodes={item.countryCode} />
                  </span>
                  <span className="num text-[13px] font-semibold text-foreground">{item.walletCurrency}</span>
                </div>
                <Pill tone={up ? 'positive' : 'neutral'}>{up ? '+0.4%' : '-0.2%'}</Pill>
              </div>

              <p className="num mt-3 text-[20px] font-semibold text-foreground">
                {item.walletBalance.toLocaleString()}
              </p>
              <p className="text-subtle text-[12px]">{item.currencyName}</p>

              <svg viewBox="0 0 100 22" className="mt-2 h-[22px] w-full" preserveAspectRatio="none">
                <polyline
                  points="0,18 15,14 30,16 45,9 60,11 75,5 100,2"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={up ? 'text-primary' : 'text-subtle'}
                />
              </svg>
            </Card>
          );
        })}

        <button
          type="button"
          onClick={toggleCurrencyModal}
          data-testid="wallet-addition"
          className={cn(
            'flex min-h-[132px] flex-col items-center justify-center gap-1 rounded-xl',
            'border border-dashed border-border-strong text-muted-foreground hover:border-primary hover:text-primary',
          )}
        >
          <span className="text-[13px] font-medium">Add wallet</span>
        </button>
        {showAddCurrencyModal && (
          <AddCurrencyModal onClose={handleModalClose} onAddCurrency={handleCurrencyAddition} />
        )}
      </div>
    </div>
  );
}

export default CurrencyWallet;
