import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'destructive';
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2 font-medium cursor-pointer transition-colors',
        'active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90 glow-primary transition-all duration-150'
          : variant === 'destructive'
          ? 'bg-destructive text-destructive-foreground hover:opacity-90'
          : 'border border-border text-foreground hover:border-border-strong bg-transparent',
        className
      )}
      {...props}
    />
  );
}
