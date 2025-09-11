import useDarkModeStore from '@/stores/darkModeStore';
import { useState } from "react";
import { ClipboardCopy, Check } from "lucide-react";

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
  const { darkMode } = useDarkModeStore();

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
    <div className={`space-y-4 ${darkMode ? 'text-white' : 'text-gray-800'}`}>
      <h2 className="text-xl font-bold mb-1">Bank Details</h2>
      <hr className={`h-1 ${darkMode ? 'bg-gray-700' : 'bg-gray-300'} border-0 rounded-lg mt-0 mb-2`} />

      {/* Bank Name */}
      <div className="space-y-3">
        <div className="flex items-start">
          <p className={`w-40 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Bank API</p>
          <p className="mx-2">:</p>
          <div className="flex-1">
            {isEditing ? (
              <input
                type="text"
                value={bankDetails.bankName}
                onChange={(e) => onBankDetailChange("bankName", e.target.value)}
                className={`w-full px-3 py-1.5 border rounded-md text-sm ${darkMode ? 'bg-gray-700 text-white' : 'text-gray-700'} focus:outline-none focus:ring-2 focus:ring-blue-400`}
              />
            ) : (
              <p>{bankDetails.bankName}</p>
            )}
          </div>
        </div>

        {/* Deposit ID */}
        <div className="flex items-start">
          <p className={`w-40 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Deposit ID</p>
          <p className="mx-2">:</p>
          <div className="flex-1">
            <div className="flex justify-between items-center w-full">
              <p className={`text-md break-all ${darkMode ? 'text-white' : 'text-black'}`}>
                {bankDetails.depositId}
              </p>
              <button
                onClick={() => handleCopy(bankDetails.depositId, 'deposit')}
                className={`ml-4 inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm ${darkMode
                    ? 'bg-white text-black border-white hover:bg-gray-200'
                    : 'bg-black text-white border-black hover:bg-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-400`}
              >
                {copiedDeposit ? <Check className="w-4 h-4" /> : <ClipboardCopy className="w-4 h-4" />}
                {copiedDeposit ? 'Copied' : 'Copy'}
              </button>
            </div>
          </div>
        </div>

        {/* Zai User ID */}
        <div className="flex items-start">
          <p className={`w-40 font-medium ${darkMode ? 'text-gray-300' : 'text-gray-700'}`}>Zai User ID</p>
          <p className="mx-2">:</p>
          <div className="flex-1">
            <div className="flex justify-between items-center w-full">
              <p className={`text-md break-all ${darkMode ? 'text-white' : 'text-black'}`}>
                {bankDetails.userId}
              </p>
              <button
                onClick={() => handleCopy(bankDetails.userId, 'user')}
                className={`ml-4 inline-flex items-center gap-2 px-3 py-1.5 border rounded-md text-sm ${darkMode
                    ? 'bg-white text-black border-white hover:bg-gray-200'
                    : 'bg-black text-white border-black hover:bg-gray-900'
                  } focus:outline-none focus:ring-2 focus:ring-blue-400`}
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
          className="text-blue-600 hover:text-blue-800 text-sm font-medium cursor-pointer"
        >
          Change Bank Details
        </button>
      )}
    </div>
  );
};

export default BankDetails;
