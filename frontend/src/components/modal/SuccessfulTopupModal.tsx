import { useNavigate } from "react-router-dom";
import { useGroupTransactionStore } from "@/stores/groupTransactionStore";
import { Button } from '@/components/ui/Button';

const SuccessfulTopupModal = () => {
  const navigate = useNavigate();
  const { groupId, resetGroupData } = useGroupTransactionStore();

  const continueTransaction = () => {
    resetGroupData();
    navigate('/transfer/recipient');
  }

  const backToGroup = () => {
    navigate(`/groups/${groupId}`);
    resetGroupData();
  }
  return (
    <div className='fixed inset-0 flex items-center justify-center bg-black/10 z-50'>
      <div className='bg-card border border-border rounded-xl shadow-2xl w-full max-w-md p-6 mx-4'>
        <div className='flex flex-col items-center gap-4'>
          <div className='flex flex-col justify-center items-center'>
            <div className='text-5xl text-positive mb-4'>✅</div>
            <h2 className='text-xl font-bold text-foreground mb-2'>Top Up Successful</h2>
          </div>
          <div className='flex gap-4 w-full'>
            <button
              onClick={() => continueTransaction()}
              className='w-full bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg font-bold transition duration-300 shadow-md'
            >
              Make Another Transaction
            </button>

            <Button
              onClick={() => backToGroup()}
              className="w-full py-2 shadow-md"
            >
              Group
            </Button>
          </div>

        </div>
      </div>
    </div>
  )
}

export default SuccessfulTopupModal;