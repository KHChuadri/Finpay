import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';

interface ConfirmationModalProps {
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}

const ConfirmationModal = ({
  message,
  confirmText,
  onConfirm,
  onCancel,
  disabled = false,
}: ConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/30 backdrop-blur-xs z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex flex-col gap-4">
          {/* Header and X button */}
          <div className="flex justify-between items-center">
            <div className={'flex items-center gap-3 text-red-500'}>
              <FaExclamationTriangle className="text-xl" />
              <h3 className="text-2xl font-bold">Close Balance</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-black hover:text-gray-800 transition-colors cursor-pointer"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Message */}
          <p className="text-black text-lg">{message}</p>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-black hover:bg-gray-100 rounded-lg transition-colors font-medium cursor-pointer"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={disabled}
              className={`px-4 py-2 rounded-lg text-white font-medium transition-colors 
                ${disabled ? 'bg-red-300 cursor-not-allowed hover:bg-none' : 'bg-red-600 hover:bg-red-700 cursor-pointer'}
              `}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;