import { useTransactionStore } from '@/stores/transactionStore';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/Button';

interface SuccessfulRequestModalProps {
  amount: string;
  email: string;
  onClose: () => void;
}

const SuccessfulRequestModal = ({ amount, email, onClose }: SuccessfulRequestModalProps) => {
  const navigate = useNavigate();
  const { resetTransfer } = useTransactionStore();

  const continueMakingRequest = () => {
    resetTransfer();
    onClose();
    navigate('/request/recipient');
  };

  const backToDashboard = () => {
    resetTransfer();
    onClose();
    navigate('/dashboard');
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-[rgba(6,7,9,.5)] backdrop-blur-sm z-50'>
      <div className='bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center gap-4'>
          <div data-testid='request-success-heading' className='flex flex-col justify-center items-center'>
            <div className='text-5xl text-positive mb-4'>✅</div>
            <h2 className='text-xl font-bold text-foreground'>Request Successful</h2>
          </div>

          <p data-testid='request-summary-sentence'>Your request for <strong>{amount}</strong> has been sent to <strong>{email}</strong>.</p>

          <div className='flex gap-4 w-full'>
            <button
              onClick={continueMakingRequest}
              data-testid='another-request-button'
              className='w-full bg-secondary text-foreground py-3 rounded-lg font-bold hover:bg-secondary/80'
            >
              Make more request
            </button>
            <Button
              onClick={backToDashboard}
              data-testid='dashboard-request-return'
              className="w-full py-3"
            >
              Dashboard
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessfulRequestModal;
