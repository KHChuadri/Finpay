// CountUp animates from 0 via requestAnimationFrame unless the user prefers
// reduced motion. Static capture happens mid-animation, so force the
// reduced-motion path to render the final value — the true still state.
if (typeof window !== 'undefined' && window.matchMedia) {
  const orig = window.matchMedia.bind(window);
  window.matchMedia = ((q: string) =>
    /reduced-motion/.test(q)
      ? ({ matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } as MediaQueryList)
      : orig(q)) as typeof window.matchMedia;
}

import { CountUp } from '@/components/ui/CountUp';

export const Balance = () => (
  <span className="text-3xl font-semibold text-foreground">
    $<CountUp value={4820.5} />
  </span>
);

export const Whole = () => (
  <span className="text-3xl font-semibold text-foreground">
    <CountUp value={128} format={(n) => Math.round(n).toString()} />
  </span>
);
