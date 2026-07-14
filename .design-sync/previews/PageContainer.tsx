import { PageContainer } from '@/components/ui/PageContainer';
import { Card } from '@/components/ui/Card';

// PageContainer centers content and caps its width (max-w-6xl / max-w-md);
// it spans full width, so these render best one-per-row (cardMode: column).
export const Default = () => (
  <PageContainer>
    <Card>
      <p className="text-sm text-muted-foreground">Default page</p>
      <p className="text-foreground">Centered, max-w-6xl, responsive padding.</p>
    </Card>
  </PageContainer>
);

export const Narrow = () => (
  <PageContainer size="narrow">
    <Card>
      <p className="text-sm text-muted-foreground">Narrow page</p>
      <p className="text-foreground">Centered, max-w-md — for focused flows.</p>
    </Card>
  </PageContainer>
);
