import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const sizes = {
  sm: 'h-[30px] px-3 text-[13px] rounded-[9px]',
  md: 'h-9 px-4 text-sm rounded-[10px]',
  lg: 'h-[42px] px-5 text-sm rounded-[11px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium cursor-pointer',
        'transition-colors active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0',
        sizes[size],
        variant === 'primary' &&
          'bg-primary text-primary-foreground border border-primary-border hover:bg-primary-hover',
        variant === 'secondary' &&
          'bg-card2 text-foreground border border-border-strong hover:border-primary',
        variant === 'ghost' &&
          'bg-transparent text-foreground hover:bg-hover',
        variant === 'destructive' &&
          'bg-destructive-tint text-destructive border border-destructive-tint-border hover:border-destructive',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
