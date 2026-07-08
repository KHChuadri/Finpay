import { cn } from '@/lib/utils';

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs tracking-wide',
        'border border-border rounded-md px-2.5 py-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
