import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  emphasis?: boolean;
}

export function Card({ emphasis, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 transition-colors',
        emphasis ? 'border-border-strong' : 'border-border',
        className
      )}
      {...props}
    />
  );
}
