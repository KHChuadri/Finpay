import { Pill } from '@/components/ui/Pill';

export const Status = () => <Pill>PENDING</Pill>;
export const Reference = () => <Pill>TXN-4821</Pill>;
export const Currencies = () => (
  <div className="flex gap-2">
    <Pill>USD</Pill>
    <Pill>AUD</Pill>
    <Pill>SGD</Pill>
  </div>
);
