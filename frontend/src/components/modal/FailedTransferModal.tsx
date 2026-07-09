import { useTransactionStore } from "@/stores/transactionStore";
import { useNavigate } from "react-router-dom";
import { Button } from '@/components/ui/Button';

interface FailedTransferModalProp {
  errorMsg: string
}

const FailedTransferModal = ({errorMsg}: FailedTransferModalProp) => {
  const navigate = useNavigate();
  const { resetTransfer } = useTransactionStore()

  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/10 z-50'>
      <div className='bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center'>
          <div className='text-5xl text-destructive mb-4'>❌</div>
          <h2 className='text-xl font-bold text-foreground mb-2'>Transfer Failed</h2>
          <p className='text-muted-foreground text-center mb-6'>
            {errorMsg}
          </p>
          <div className='flex gap-4 w-full'>
            <button
              onClick={() => { window.location.reload(); resetTransfer() }}
              className='w-full bg-secondary text-foreground py-2 rounded-lg font-bold hover:bg-secondary/80'
            >
              Try Again
            </button>
            <Button
              onClick={() => { navigate('/dashboard'); resetTransfer() }}
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

export default FailedTransferModal;
