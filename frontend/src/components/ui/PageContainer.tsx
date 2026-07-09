import { cn } from '@/lib/utils';

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'default' | 'narrow';
}

export function PageContainer({ size = 'default', className, ...props }: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-6 py-8',
        size === 'narrow' ? 'max-w-md' : 'max-w-6xl',
        className,
      )}
      {...props}
    />
  );
}
