import { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ProgressBarProps {
  value: number;
  max: number;
  className?: string;
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function ProgressBar({ value, max, className }: ProgressBarProps) {
  const pct = `${Math.min(max > 0 ? value / max : 0, 1) * 100}%`;
  const [width, setWidth] = useState(prefersReducedMotion() ? pct : '0%');
  const mounted = useRef(false);

  useEffect(() => {
    if (prefersReducedMotion()) { setWidth(pct); return; }
    const id = requestAnimationFrame(() => setWidth(pct));
    mounted.current = true;
    return () => cancelAnimationFrame(id);
  }, [pct]);

  return (
    <div className={cn('h-1 rounded-full bg-muted overflow-hidden', className)}>
      <div
        data-testid="progress-fill"
        className="h-full rounded-full bg-primary transition-[width] duration-700 ease-out"
        style={{ width }}
      />
    </div>
  );
}
