// ProgressBar animates its fill from 0 via requestAnimationFrame unless the
// user prefers reduced motion. Static preview capture happens before the
// animation settles, so force the reduced-motion path to render the fill at
// its resting (target) width — the true still state of the component.
if (typeof window !== 'undefined' && window.matchMedia) {
  const orig = window.matchMedia.bind(window);
  window.matchMedia = ((q: string) =>
    /reduced-motion/.test(q)
      ? ({ matches: true, media: q, onchange: null, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {}, dispatchEvent: () => false } as MediaQueryList)
      : orig(q)) as typeof window.matchMedia;
}

import { ProgressBar } from '@/components/ui/ProgressBar';

export const Quarter = () => <div className="w-64"><ProgressBar value={25} max={100} /></div>;
export const Half = () => <div className="w-64"><ProgressBar value={50} max={100} /></div>;
export const SavingsGoal = () => (
  <div className="w-64 space-y-1.5">
    <div className="flex justify-between text-sm text-foreground">
      <span>Holiday fund</span>
      <span>$1,800 / $2,500</span>
    </div>
    <ProgressBar value={1800} max={2500} />
  </div>
);
