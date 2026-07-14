import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface ConfirmationModalProps {
  message: string;
  confirmText: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
  title?: string;
  summary?: string;
}

const ConfirmationModal = ({
  message,
  confirmText,
  onConfirm,
  onCancel,
  disabled = false,
  title = 'Close balance?',
  summary,
}: ConfirmationModalProps) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(6,7,9,.5)] backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-[376px] animate-in zoom-in-95 duration-200">
        <div className="flex flex-col gap-4 p-6">
          {/* Trash badge + title */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-[9px] bg-destructive-tint text-destructive flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-[18px] font-semibold text-foreground">{title}</h3>
          </div>

          {/* Message */}
          <p className="text-muted-foreground text-sm">{message}</p>

          {/* Optional summary row */}
          {summary !== undefined && (
            <div className="bg-card2 border border-border rounded-[10px] px-3 py-2 text-sm">
              {summary}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-end gap-3 mt-2">
            <Button variant="ghost" onClick={onCancel}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="bg-destructive text-primary-foreground border-destructive hover:bg-destructive/90"
              onClick={onConfirm}
              disabled={disabled}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
