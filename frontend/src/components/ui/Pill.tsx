import { cn } from '@/lib/utils';

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'positive' | 'warning' | 'destructive';
  dot?: boolean;
}

const tones = {
  neutral: 'bg-card2 border-border text-muted-foreground',
  positive: 'bg-green-tint border-green-tint-border text-primary',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  destructive: 'bg-destructive-tint border-destructive-tint-border text-destructive',
};
const dotColors = {
  neutral: 'bg-muted-foreground',
  positive: 'bg-primary',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

export function Pill({ tone = 'neutral', dot = false, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide',
        'border rounded-md px-2 py-0.5',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  );
}
