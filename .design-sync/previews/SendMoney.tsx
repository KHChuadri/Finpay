import SendMoney from '@/components/landing/SendMoney';

export const Default = () => (
  <div className="w-96"><SendMoney transferCompleted={false} onTransfer={() => {}} /></div>
);
export const Completed = () => (
  <div className="w-96"><SendMoney transferCompleted={true} onTransfer={() => {}} /></div>
);
