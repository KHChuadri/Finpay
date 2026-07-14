import { Card } from '@/components/ui/Card';

export const Default = () => (
  <Card className="w-72">
    <p className="text-sm text-muted-foreground">Available balance</p>
    <p className="text-2xl font-semibold text-foreground">$4,820.50</p>
  </Card>
);

export const Emphasis = () => (
  <Card emphasis className="w-72">
    <p className="text-sm text-muted-foreground">Pending transfer</p>
    <p className="text-2xl font-semibold text-foreground">$1,200.00</p>
  </Card>
);
