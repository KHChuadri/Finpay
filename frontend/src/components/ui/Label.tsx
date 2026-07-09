import { cn } from '@/lib/utils';

// ponytail: renders label TEXT as a <span>, designed to sit inside a wrapping
// <label> that also wraps the input (the codebase's implicit-association
// pattern). A <span>, not a <label>, to avoid invalid nested <label> markup.
interface LabelProps extends React.HTMLAttributes<HTMLSpanElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <span className={cn('text-sm font-medium text-foreground', className)} {...props}>
      {children}
      {required && <span className="text-destructive"> *</span>}
    </span>
  );
}
