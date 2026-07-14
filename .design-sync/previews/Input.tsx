import { Input } from '@/components/ui/Input';

export const Default = () => <Input className="w-72" placeholder="Recipient email" />;
export const Filled = () => <Input className="w-72" defaultValue="jordan@finpay.com" />;
export const Error = () => <Input className="w-72" defaultValue="not-an-email" error />;
export const Disabled = () => <Input className="w-72" placeholder="Locked field" disabled />;
