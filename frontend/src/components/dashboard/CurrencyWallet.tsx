import { useNavigate } from "react-router-dom";
import FlagGetter from "../FlagGetter";
import { MdChevronLeft, MdChevronRight } from "react-icons/md";
import { useState } from "react";
import AddCurrencyModal from "../modal/AddCurrencyModal";
import axios from "axios";
import type { UserWalletInfo } from "@/pages/Dashboard";
import useAuthStore from "@/stores/authStore";
import { FaTimes } from "react-icons/fa";
import { API_URL } from "@/constants/API_URL";

interface WalletList {
  onAddWallet: () => void;
  userWallets: UserWalletInfo[];
}

function CurrencyWallet({ userWallets, onAddWallet }: WalletList) {
  const [showAddCurrencyModal, setShowAddCurrencyModal] = useState(false);
  const userId = useAuthStore.getState().userId;
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  function slideLeft() {
    const slider = document.getElementById("slider");
    if (slider) {
      slider.scrollBy({ left: -500 });
    }
  }

  function slideRight() {
    const slider = document.getElementById("slider");
    if (slider) {
      slider.scrollBy({ left: +500 });
    }
  }

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
    <div className="flex relative items-center">
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

      <MdChevronLeft onClick={slideLeft} className="cursor-pointer text-foreground" size={40} />
      <div
        id="slider"
        className="scrollbar-hide w-full flex gap-4 px-4 py-6 overflow-x-scroll scroll scroll-smooth whitespace-nowrap"
      >
        {userWallets.map((item, index) => (
          <button
            key={index}
            onClick={() => navigate(`/currencywallet/${item.walletCurrency}`)}
            className="shrink-0 rounded-lg items-center w-[220px] h-[220px] inline-block p-2 cursor-pointer hover:scale-90 ease-in-out duration-300 bg-card border border-border"
          >
            <div className="py-2 h-full flex flex-col justify-start">
              <div className="text-lg font-bold flex flex-row items-center gap-4 w-full overflow-hidden">
                <FlagGetter countryCodes={item.countryCode} />
                <div className="break-words whitespace-normal leading-snug mt-1 text-play-cyan">{item.walletCurrency}</div>
              </div>
              <div className="ml-2 mt-auto text-lg font-bold flex items-end font-mono tabular-nums text-foreground">
                {item.walletBalance.toLocaleString()}
              </div>
            </div>
          </button>
        ))}

        <button
          className="shrink-0 rounded-lg items-center w-[220px] h-[220px] inline-block p-2 cursor-pointer hover:scale-90 ease-in-out duration-300 bg-card border border-border text-foreground"
          onClick={toggleCurrencyModal}
          data-testid="wallet-addition"
        >
          <div className="mt-2 text-lg font-bold">Add More Wallet</div>
        </button>
        {showAddCurrencyModal && (
          <AddCurrencyModal onClose={handleModalClose} onAddCurrency={handleCurrencyAddition} />
        )}
      </div>
      <MdChevronRight
        onClick={slideRight}
        className="cursor-pointer text-foreground"
        size={40}
      />
    </div>
  );
}

export default CurrencyWallet;