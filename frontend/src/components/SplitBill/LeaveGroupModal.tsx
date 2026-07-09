import { LiaTimesSolid } from 'react-icons/lia';
import { FaDoorOpen } from "react-icons/fa";
import { Button } from '@/components/ui/Button';


type AuthenticationProp = {
  onClose: () => void;
  onConfirm: () => void;
};

const LeaveGroupModal = ({ onClose, onConfirm }: AuthenticationProp) => {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center"
      onClick={() => onClose()}
    >
      <div
        className="relative bg-card border border-border p-6 shadow-lg w-11/12 sm:w-1/2 max-w-md rounded"
        onClick={(e) => e.stopPropagation()}
      >
        
        <button
          data-testid="close-authentication-button"
          className="absolute top-2 right-2 cursor-pointer"
          onClick={() => onClose()}
          type="button"
        >
          <LiaTimesSolid className="w-6 h-6" />
        </button>


        <FaDoorOpen className="w-32 h-32 mx-auto mb-4" />
        <p className="mb-3 text-center font-bold text-2xl">
          Are You Sure You Want To Leave The Group?
        </p>
        <p className="mb-3 text-center font-bold text-m">
          This action cannot be reversed!
        </p>
        <div className="flex flex-row justify-between">
            <Button
            variant="destructive"
            className="w-fit h-fit px-8 py-3 text-sm rounded-lg shadow-md"
            onClick={() => onConfirm()}>
                Confirm
            </Button>
            <Button
            variant="ghost"
            className="w-fit h-fit px-8 py-3 text-sm rounded-lg shadow-md"
            onClick={() => onClose()}>
                Cancel
            </Button>
        </div>
      </div>
    </div>
  );
};

export default LeaveGroupModal;
