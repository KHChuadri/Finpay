import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";
import { Input } from "@/components/ui/Input";

interface BankDetailsProps {
  bankDetails: {
    bankName: string;
    depositId: string;
    userId: string;
  };
  isEditing: boolean;
  onBankDetailChange: (key: string, value: string) => void;
  onChangeBankDetails: () => void;
}

const BankDetails = ({
  bankDetails,
  isEditing,
  onBankDetailChange,
  onChangeBankDetails,
}: BankDetailsProps) => {
  const [copiedDeposit, setCopiedDeposit] = useState(false);
  const [copiedUserID, setCopiedUserID] = useState(false);

  const handleCopy = async (text: string, type: 'deposit' | 'user') => {
    try {
      await navigator.clipboard.writeText(text);
      if (type === 'deposit') {
        setCopiedDeposit(true);
        setTimeout(() => setCopiedDeposit(false), 1500);
      } else {
        setCopiedUserID(true);
        setTimeout(() => setCopiedUserID(false), 1500);
      }
    } catch (err) {
      console.error("Clipboard copy failed:", err);
    }
  };

  return (
    <div className="space-y-4 text-foreground">
      <h2 className="text-xl font-bold mb-1">Bank Details</h2>
      <hr className="h-1 bg-border border-0 rounded-lg mt-0 mb-2" />

      {/* Bank Name */}
      <div className="space-y-3">
        <div className="flex items-start">
          <p className="w-40 font-medium text-muted-foreground">Bank API</p>
          <p className="mx-2">:</p>
          <div className="flex-1">
            {isEditing ? (
              <Input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => onBankDetailChange("bankName", e.target.value)}
                className="px-3 py-1.5 text-sm"
              />
            ) : (
              <p>{bankDetails.bankName}</p>
            )}
          </div>
        </div>

        {/* Deposit ID */}
        <div className="flex items-start">
          <p className="w-40 font-medium text-muted-foreground">Deposit ID</p>
          <p className="mx-2">:</p>
          <div className="flex-1">
            <div className="flex justify-between items-center w-full">
              <p className="text-md break-all text-foreground">
                {bankDetails.depositId}
              </p>
              <button
                onClick={() => handleCopy(bankDetails.depositId, 'deposit')}
                className="ml-4 inline-flex items-center gap-2 px-3 py-1.5 border border-foreground rounded-md text-sm bg-foreground text-background hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {copiedDeposit ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                {copiedDeposit ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Zai User ID */}
        <div className="flex items-start">
          <p className="w-40 font-medium text-muted-foreground">Zai User ID</p>
          <p className="mx-2">:</p>
          <div className="flex-1">
            <div className="flex justify-between items-center w-full">
              <p className="text-md break-all text-foreground">
                {bankDetails.userId}
              </p>
              <button
                onClick={() => handleCopy(bankDetails.userId, 'user')}
                className="ml-4 inline-flex items-center gap-2 px-3 py-1.5 border border-foreground rounded-md text-sm bg-foreground text-background hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-ring/40"
              >
                {copiedUserID ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                {copiedUserID ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {!isEditing && (
        <button
          onClick={onChangeBankDetails}
          className="text-primary hover:text-primary/80 text-sm font-medium cursor-pointer"
        >
          Change Bank Details
        </button>
      )}
    </div>
  );
};

export default BankDetails;
