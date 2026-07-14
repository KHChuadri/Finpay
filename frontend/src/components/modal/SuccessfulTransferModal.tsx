import { useNavigate } from "react-router-dom";
import PaymentReceipt from "../transaction/PaymentReceipt";
import { useTransactionStore } from "@/stores/transactionStore";
import useScheduledPaymentStore from "@/stores/scheduledPaymentStore";
import { Button } from '@/components/ui/Button';

const SuccessfulTransferModal = () => {
  const navigate = useNavigate();
  const { resetTransfer } = useTransactionStore();
  const { resetScheduledPayment } = useScheduledPaymentStore();

  const continueTransaction = () => {
    resetTransfer();
    resetScheduledPayment();
    navigate('/transfer/recipient');
  }

  const backToDashboard = () => {
    resetTransfer();
    resetScheduledPayment();
    navigate('/dashboard');
  }
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-[rgba(6,7,9,.5)] backdrop-blur-sm z-50'>
      <div className='bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center gap-4'>
          <div className='flex flex-col justify-center items-center'>
            <div className='text-5xl text-positive mb-4'>✅</div>
            <h2 className='text-xl font-bold text-foreground mb-2'>Transfer Successful</h2>
          </div>

          <PaymentReceipt />

          <div className='flex gap-4 w-full'>
            <button
              onClick={() => continueTransaction()}
              className='w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg font-bold transition duration-300 shadow-md'
            >
              Make Another Transaction
            </button>

            <Button
              onClick={() => backToDashboard()}
              className="w-full py-2 shadow-md"
            >
              Dashboard
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SuccessfulTransferModal;