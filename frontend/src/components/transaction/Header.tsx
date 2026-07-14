import { useNavigate, useLocation } from "react-router-dom";
import { useTransactionStore } from "@/stores/transactionStore";
import { LiaTimesSolid } from "react-icons/lia";
import { useGroupTransactionStore } from "@/stores/groupTransactionStore";

const Header = () => {
  const { recipient, isValidAmountPage, destCurrencyAmount, resetTransfer } =
    useTransactionStore();
  const navigate = useNavigate();
  const location = useLocation();
  const isActive = (path: string) => location.pathname.includes(path);
  const { groupId, isValidRecipientGroupPage, isValidAmountGroupPage, resetGroupData } = useGroupTransactionStore();
  const isTransfer = location.pathname.includes("/transfer");
  const isRequest = location.pathname.includes("/request");
  const isGroupTopUp = location.pathname.includes("/groups/topup");
  const isGroupWithdraw = location.pathname.includes("/groups/withdraw");

  const navigateToRecipient = () => {
    if (isTransfer) {
      navigate("/transfer/recipient");
    } else if (isRequest) {
      navigate("/request/recipient");
    } else if (isGroupTopUp) {
      navigate(`/groups/topup/${groupId}/recipient`);
    } else if (isGroupWithdraw) {
      navigate(`/groups/withdraw/${groupId}/recipient`);
    }
  };

  const navigateToAmount = () => {
    if (isGroupTopUp && isValidRecipientGroupPage()) {
      navigate(`/groups/topup/${groupId}/amount`);
    } else if (isGroupWithdraw && isValidRecipientGroupPage()) {
      navigate(`/groups/withdraw/${groupId}/amount`);
    }
    if (recipient.email.length == 0) return;
    // If current transaction is a transfer transaction, navigate to transfer amount page
    if (isTransfer) {
      navigate("/transfer/amount");
    } else if (isRequest) {
      // If current transaction is a request transaction, navigate to request amount page
      navigate("/request/amount");
    }
  };

  const navigateToPay = () => {
    if (
      recipient.email.length == 0 ||
      !isValidAmountPage() ||
      destCurrencyAmount == 0
    )
      return;
    navigate("/transfer/pay");
  };

  const navigateToTopup = () => {
    if (isGroupTopUp && isValidAmountGroupPage() && isValidRecipientGroupPage()) {
      navigate(`/groups/topup/${groupId}/pay`);
    }
  }

  const navigateToWithdraw = () => {
    if (isGroupWithdraw && isValidAmountGroupPage() && isValidRecipientGroupPage()) {
      navigate(`/groups/withdraw/${groupId}/pay`);
    }
  }

  const navigateToRequest = () => {
    if (recipient.email.length == 0 || !isValidAmountPage()) return;
    navigate("/request/details");
  };

  const handleClose = () => {
    resetTransfer();
    resetGroupData();
    if (isGroupTopUp || isGroupWithdraw) {
      navigate(`/groups/${groupId}`)
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="flex items-center justify-between relative w-full bg-secondary h-16 px-4 py-3 rounded-t-xl">
      <div className="w-8 h-8" />

      <nav className="flex space-x-2 md:space-x-10 text-muted-foreground font-medium text-sm md:text-base">
        <div
          onClick={() => navigateToRecipient()}
          className={`cursor-pointer ${isActive("/recipient") ? "text-foreground font-bold" : "hover:text-foreground"
            }`}
        >
          Recipient
          {isActive("/recipient") && (
            <div className="w-full h-[2px] bg-foreground rounded-full" />
          )}
        </div>
        <div
          onClick={() => navigateToAmount()}
          className={`cursor-pointer ${isActive("/amount") ? "text-foreground font-bold" : "hover:text-foreground"
            }`}
        >
          Amount
          {isActive("/amount") && (
            <div className="w-full h-[2px] bg-foreground rounded-full" />
          )}
        </div>
        {isTransfer && (
          <div
            onClick={() => navigateToPay()}
            className={`cursor-pointer ${isActive("/transfer/pay")
                ? "text-foreground font-bold"
                : "hover:text-foreground"
              }`}
          >
            Pay
            {isActive("/transfer/pay") && (
              <div className="w-full h-[2px] bg-foreground rounded-full" />
            )}
          </div>
        )}
        {isRequest && (
          <div
            onClick={() => navigateToRequest()}
            className={`cursor-pointer ${isActive("/request/details")
                ? "text-foreground font-bold"
                : "hover:text-foreground"
              }`}
          >
            Request
            {isActive("/request/details") && (
              <div className="w-full h-[2px] bg-foreground rounded-full" />
            )}
          </div>
        )}
        {isGroupTopUp && (
          <div
            onClick={() => navigateToTopup()}
            className={`cursor-pointer ${isActive("/request/details")
                ? "text-foreground font-bold"
                : "hover:text-foreground"
              }`}
          >
            TopUp
            {isActive("/request/details") && (
              <div className="w-full h-[2px] bg-foreground rounded-full" />
            )}
          </div>
        )}
        {isGroupWithdraw && (
          <div
            onClick={() => navigateToWithdraw()}
            className={`cursor-pointer ${isActive("/request/details")
                ? "text-foreground font-bold"
                : "hover:fill-foreground"
            }`}
          >
            Withdraw
            {isActive("/request/details") && (
              <div className="w-full h-[2px] bg-foreground rounded-full" />
            )}
          </div>
        )}
      </nav>

      <button
        onClick={() => handleClose()}
        data-testid="header-close-x-button"
      >
        <LiaTimesSolid className="w-8 h-8 text-muted-foreground hover:fill-foreground transition hover:cursor-pointer hover:opacity-80" />
      </button>
    </div>
  );
};

export default Header;
