import { Label } from '@/components/ui/Label';
import { Input } from '@/components/ui/Input';

// Label renders inline text as a <span>; the codebase wraps it in a <label>
// alongside the input for implicit association.
export const Default = () => (
  <label className="flex w-72 flex-col gap-1.5">
    <Label>Amount</Label>
    <Input placeholder="0.00" />
  </label>
);

export const Required = () => (
  <label className="flex w-72 flex-col gap-1.5">
    <Label required>Recipient</Label>
    <Input placeholder="Search contacts" />
  </label>
);
