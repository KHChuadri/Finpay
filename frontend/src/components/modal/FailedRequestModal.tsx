import { useNavigate } from "react-router-dom";

interface FailedRequestModalProps {
  onClose: () => void;
}

const FailedRequestModal = ({ onClose }: FailedRequestModalProps) => {
  const navigate = useNavigate();

  const resetRequest = () => {
    onClose();
  };

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/10 z-50'>
      <div className='bg-white rounded-xl shadow-2xl w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center'>
          <div className='text-5xl text-red-500 mb-4'>❌</div>
          <h2 className='text-xl font-bold text-black mb-2'>Request Failed</h2>
          <p className='text-gray-600 text-center mb-6'>
            Request cannot be made. Please try again or go back to the dashboard.
          </p>
          <div className='flex gap-4 w-full'>
            <button
              onClick={() => { window.location.reload(); resetRequest(); }}
              className='w-full bg-gray-200 text-gray-800 py-2 rounded-lg font-bold hover:bg-gray-300'
            >
              Try Again
            </button>
            <button
              onClick={() => { navigate('/dashboard'); resetRequest(); }}
              className='w-full bg-[#FFA294] text-white py-2 rounded-lg font-bold hover:bg-[#A8321E]'
            >
              Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FailedRequestModal;
