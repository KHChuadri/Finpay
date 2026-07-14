import RequestMoney from '@/components/landing/RequestMoney';

export const Default = () => (
  <div className="w-96"><RequestMoney transferCompleted={false} onTransfer={() => {}} /></div>
);
export const Completed = () => (
  <div className="w-96"><RequestMoney transferCompleted={true} onTransfer={() => {}} /></div>
);
