import { useNavigate } from "react-router-dom";
import { Button } from '@/components/ui/Button';

interface FailedRequestModalProps {
  onClose: () => void;
}

const FailedRequestModal = ({ onClose }: FailedRequestModalProps) => {
  const navigate = useNavigate();

  const resetRequest = () => {
    onClose();
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-[rgba(6,7,9,.5)] backdrop-blur-sm z-50'>
      <div className='bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center'>
          <div className='text-5xl text-destructive mb-4'>❌</div>
          <h2 className='text-xl font-bold text-foreground mb-2'>Request Failed</h2>
          <p className='text-muted-foreground text-center mb-6'>
            Request cannot be made. Please try again or go back to the dashboard.
          </p>
          <div className='flex gap-4 w-full'>
            <button
              onClick={() => { window.location.reload(); resetRequest(); }}
              className='w-full bg-secondary text-foreground py-2 rounded-lg font-bold hover:bg-secondary/80'
            >
              Try Again
            </button>
            <Button
              onClick={() => { navigate('/dashboard'); resetRequest(); }}
              className="w-full py-2"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailedRequestModal;
