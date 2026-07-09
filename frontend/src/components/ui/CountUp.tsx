import { useEffect, useState } from 'react';

interface CountUpProps {
  value: number;
  format?: (n: number) => string;
  className?: string;
}

const defaultFormat = (n: number) =>
  n.toLocaleString('en-AU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function reduced(): boolean {
  return typeof window === 'undefined'
    || typeof window.matchMedia !== 'function'
    || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export function CountUp({ value, format = defaultFormat, className }: CountUpProps) {
  const [display, setDisplay] = useState(reduced() ? value : 0);

  useEffect(() => {
    if (reduced()) { setDisplay(value); return; }
    let raf = 0;
    const start = performance.now();
    const dur = 900;
    const tick = (t: number) => {
      const p = Math.min((t - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(value * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value]);

  return <span className={className}>{format(display)}</span>;
}
