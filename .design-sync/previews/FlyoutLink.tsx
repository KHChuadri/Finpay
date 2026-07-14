import FlyoutLink from '@/components/dashboard/FlyoutLink';

// FlyoutContent is revealed on hover; the still card shows the trigger.
export const Default = () => (
  <FlyoutLink
    FlyoutContent={<div className="bg-card border border-border rounded-lg p-3 shadow-xl text-sm">Account menu</div>}
  >
    <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground font-medium">Account</button>
  </FlyoutLink>
);
