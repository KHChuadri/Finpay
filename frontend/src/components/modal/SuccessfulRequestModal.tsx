import { useTransactionStore } from '@/stores/transactionStore';
import { useNavigate } from 'react-router-dom';

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
    <div className='fixed inset-0 flex items-center justify-center bg-black/10 z-50'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center gap-4'>
          <div data-testid='request-success-heading' className='flex flex-col justify-center items-center'>
            <div className='text-5xl text-green-600 mb-4'>✅</div>
            <h2 className='text-xl font-bold text-black'>Request Successful</h2>
          </div>

          <p data-testid='request-summary-sentence'>Your request for <strong>{amount}</strong> has been sent to <strong>{email}</strong>.</p>

          <div className='flex gap-4 w-full'>
            <button
              onClick={continueMakingRequest}
              data-testid='another-request-button'
              className='w-full bg-gray-200 text-gray-800 py-3 rounded-lg font-bold hover:bg-gray-300'
            >
              Make more request
            </button>
            <button
              onClick={backToDashboard}
              data-testid='dashboard-request-return'
              className='w-full bg-[#C6412A] text-white py-3 rounded-lg font-bold hover:bg-[#A8321E]'
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessfulRequestModal;
