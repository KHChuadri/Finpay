import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
  icon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, icon, className, ...props }, ref) => {
    const field = (
      <input
        ref={ref}
        className={cn(
          'w-full h-[38px] rounded-[9px] border bg-card2 text-foreground placeholder:text-subtle',
          'text-sm transition-colors focus:outline-none focus:ring-2',
          icon ? 'pl-9 pr-3' : 'px-3',
          error
            ? 'border-destructive focus:ring-destructive-tint focus:border-destructive'
            : 'border-border-strong focus:ring-green-tint focus:border-primary',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className,
        )}
        {...props}
      />
    );
    if (!icon) return field;
    return (
      <div className="relative w-full">
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
          {icon}
        </span>
        {field}
      </div>
    );
  },
);
Input.displayName = 'Input';
