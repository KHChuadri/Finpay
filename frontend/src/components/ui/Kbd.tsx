import { cn } from '@/lib/utils';

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-[5px] border border-border bg-card2 px-1.5 py-0.5',
        'font-mono text-[10px] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
