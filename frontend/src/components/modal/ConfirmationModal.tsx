import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';
import { Button } from '@/components/ui/Button';

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
      <div className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 mx-4">
        <div className="flex flex-col gap-4">
          {/* Header and X button */}
          <div className="flex justify-between items-center">
            <div className={'flex items-center gap-3 text-destructive'}>
              <FaExclamationTriangle className="text-xl" />
              <h3 className="text-2xl font-bold">Close Balance</h3>
            </div>
            <button
              onClick={onCancel}
              className="text-foreground hover:text-muted-foreground transition-colors cursor-pointer"
            >
              <FaTimes className="text-xl" />
            </button>
          </div>

          {/* Message */}
          <p className="text-foreground text-lg">{message}</p>

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-4">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} disabled={disabled}>
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;