import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ error, className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        'w-full rounded-lg border bg-card px-3 py-2 text-foreground placeholder:text-subtle',
        'transition-colors focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        error
          ? 'border-destructive focus:ring-destructive/40 focus:border-destructive'
          : 'border-input',
        className,
      )}
      {...props}
    />
  ),
);
Input.displayName = 'Input';
