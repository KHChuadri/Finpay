# FinPay Minimal Dark Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give FinPay a cohesive Minimal Dark identity by moving theming onto CSS tokens and reskinning the shell + 4 highest-impact pages.

**Architecture:** Repurpose the existing shadcn CSS token names in `index.css` (dark = flagship, light = variant). The dark-mode toggle drives a `.dark` class on `<html>` instead of per-component JS ternaries. Build 5 small token-driven primitives, then reskin Layout, Dashboard, ChallengesList, Login, LandingPage against them. Non-migrated pages keep the old boolean path and still work.

**Tech Stack:** React 19, Vite, Tailwind v4, zustand, `motion` (all already installed). Tests: Jest + React Testing Library.

## Global Constraints

- **Preserve every `data-testid` and every visible copy string on the 4 reskinned pages.** Existing tests assert on them (e.g. `Send-dashboard-button`, `wallet-currency`, `finpay-header-logo`, headings "Send Transactions", "Total balance:", "Send Requests", "User Transactions History"; landing `exchange-smarter`, `why-choose-finpay`). Change styling only, not text or testids.
- Accent value differs per theme: dark `--primary: #B6FF3B`, light `--primary: #4B9A1E` (pure lime is illegible on white).
- No gradients, no glow, no confetti. Motion = count-up + bar fill + hover/press only, all gated by `prefers-reduced-motion`.
- Terracotta `#C6412A` / `#A8321E` / `#f98674` are retired on migrated files — replace with tokens, don't leave hardcoded hex.
- Do NOT delete `useDarkModeStore` — non-migrated pages still read its boolean.
- Style migrated components through Tailwind token utilities (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, `text-muted-foreground`), never new hardcoded hex.
- Run `cd frontend` before any npm/jest command. Test runner: `npm test -- <path>`.

---

### Task 1: Retheme the CSS tokens (dark flagship + light variant)

**Files:**
- Modify: `frontend/src/index.css:45-112` (the `:root` and `.dark` blocks)

No test — this is declarative CSS. Verified by build + visual in later tasks.

**Interfaces:**
- Produces: token utilities consumed everywhere — `bg-background`, `text-foreground`, `bg-card`, `border-border`, `bg-primary`, `text-primary-foreground`, `text-muted-foreground`, plus two new tokens `--border-strong` / `--color-border-strong` and `--positive` / `--color-positive`.

- [ ] **Step 1: Add the two new tokens to the `@theme inline` block**

In `frontend/src/index.css`, inside `@theme inline { ... }` (after line 27 `--color-border: var(--border);`), add:

```css
  --color-border-strong: var(--border-strong);
  --color-positive: var(--positive);
```

- [ ] **Step 2: Replace the `:root` light values**

Replace the body of `:root { ... }` (keep `--radius`) so the light-variant tokens read:

```css
:root {
  --radius: 0.625rem;
  --background: #F6F7F9;
  --foreground: #14171C;
  --card: #FFFFFF;
  --card-foreground: #14171C;
  --popover: #FFFFFF;
  --popover-foreground: #14171C;
  --primary: #4B9A1E;
  --primary-foreground: #FFFFFF;
  --secondary: #EEF0F3;
  --secondary-foreground: #14171C;
  --muted: #EEF0F3;
  --muted-foreground: #5A6270;
  --subtle: #8A93A0;
  --accent: #EEF0F3;
  --accent-foreground: #14171C;
  --positive: #2E9E63;
  --destructive: oklch(0.577 0.245 27.325);
  --border: #E4E7EC;
  --border-strong: #D3D8DF;
  --input: #E4E7EC;
  --ring: #4B9A1E;
  --sidebar: #FFFFFF;
  --sidebar-foreground: #14171C;
  --sidebar-primary: #4B9A1E;
  --sidebar-primary-foreground: #FFFFFF;
  --sidebar-accent: #EEF0F3;
  --sidebar-accent-foreground: #14171C;
  --sidebar-border: #E4E7EC;
  --sidebar-ring: #4B9A1E;
}
```

- [ ] **Step 3: Replace the `.dark` values with the flagship Minimal Dark palette**

Replace the body of `.dark { ... }` with:

```css
.dark {
  --background: #0B0D11;
  --foreground: #E7EBF2;
  --card: #12151B;
  --card-foreground: #E7EBF2;
  --popover: #12151B;
  --popover-foreground: #E7EBF2;
  --primary: #B6FF3B;
  --primary-foreground: #0B0D11;
  --secondary: #1E232C;
  --secondary-foreground: #E7EBF2;
  --muted: #1E232C;
  --muted-foreground: #9AA4B2;
  --subtle: #616B7A;
  --accent: #1E232C;
  --accent-foreground: #E7EBF2;
  --positive: #57C98A;
  --destructive: oklch(0.704 0.191 22.216);
  --border: #1E232C;
  --border-strong: #262D38;
  --input: #262D38;
  --ring: #B6FF3B;
  --sidebar: #12151B;
  --sidebar-foreground: #E7EBF2;
  --sidebar-primary: #B6FF3B;
  --sidebar-primary-foreground: #0B0D11;
  --sidebar-accent: #1E232C;
  --sidebar-accent-foreground: #E7EBF2;
  --sidebar-border: #1E232C;
  --sidebar-ring: #B6FF3B;
}
```

- [ ] **Step 4: Verify the build compiles**

Run: `cd frontend && npm run build`
Expected: build succeeds (tsc + vite), no CSS errors.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(ui): retheme CSS tokens to minimal dark + light variant"
```

---

### Task 2: Toggle drives the `.dark` class on `<html>`

**Files:**
- Modify: `frontend/src/stores/darkModeStore.ts`
- Test: `frontend/src/stores/__tests__/darkModeStore.test.ts` (create)

**Interfaces:**
- Consumes: nothing.
- Produces: `useDarkModeStore` — unchanged shape `{ darkMode: boolean; setDarkMode: (v: boolean) => void }`, but `setDarkMode` now also toggles `document.documentElement.classList` `dark`. Adds an exported `syncThemeClass(dark: boolean): void` helper.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/stores/__tests__/darkModeStore.test.ts`:

```typescript
import useDarkModeStore, { syncThemeClass } from '../darkModeStore';

describe('darkModeStore theme class', () => {
  afterEach(() => {
    document.documentElement.classList.remove('dark');
    useDarkModeStore.setState({ darkMode: false });
  });

  it('adds .dark to <html> when enabled', () => {
    useDarkModeStore.getState().setDarkMode(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes .dark from <html> when disabled', () => {
    useDarkModeStore.getState().setDarkMode(true);
    useDarkModeStore.getState().setDarkMode(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('syncThemeClass reflects the boolean', () => {
    syncThemeClass(true);
    expect(document.documentElement.classList.contains('dark')).toBe(true);
    syncThemeClass(false);
    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/stores/__tests__/darkModeStore.test.ts`
Expected: FAIL — `syncThemeClass` is not exported / class not toggled.

- [ ] **Step 3: Implement**

Replace `frontend/src/stores/darkModeStore.ts` with:

```typescript
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DarkModeStore {
  darkMode: boolean;
  setDarkMode: (darkMode: boolean) => void;
}

export function syncThemeClass(dark: boolean): void {
  if (typeof document === 'undefined') return;
  document.documentElement.classList.toggle('dark', dark);
}

const useDarkModeStore = create<DarkModeStore>()(
  persist(
    (set) => ({
      darkMode: false,
      setDarkMode: (darkMode) => {
        syncThemeClass(darkMode);
        set({ darkMode });
      },
    }),
    {
      name: 'dark-mode-storage',
      onRehydrateStorage: () => (state) => {
        if (state) syncThemeClass(state.darkMode);
      },
    }
  )
);

export default useDarkModeStore;
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd frontend && npm test -- src/stores/__tests__/darkModeStore.test.ts`
Expected: PASS (3 tests).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/stores/darkModeStore.ts frontend/src/stores/__tests__/darkModeStore.test.ts
git commit -m "feat(ui): dark-mode toggle drives .dark class on html"
```

---

### Task 3: Static primitives — Card, Button, Pill

**Files:**
- Create: `frontend/src/components/ui/Card.tsx`
- Create: `frontend/src/components/ui/Button.tsx`
- Create: `frontend/src/components/ui/Pill.tsx`
- Test: `frontend/src/components/ui/__tests__/primitives.test.tsx` (create)

**Interfaces:**
- Consumes: `cn` from `frontend/src/lib/utils.ts` (exists).
- Produces:
  - `Card` — `React.FC<React.HTMLAttributes<HTMLDivElement> & { emphasis?: boolean }>`. Renders `<div>` with `bg-card border rounded-xl p-5`; `emphasis` swaps border to `border-strong`.
  - `Button` — `React.FC<React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' }>`. Default `variant='primary'`.
  - `Pill` — `React.FC<React.HTMLAttributes<HTMLSpanElement>>`. Mono, hairline, `text-muted-foreground`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/__tests__/primitives.test.tsx`:

```tsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { Card } from '../Card';
import { Button } from '../Button';
import { Pill } from '../Pill';

describe('ui primitives', () => {
  it('Card renders children and uses card bg', () => {
    render(<Card>hello</Card>);
    const el = screen.getByText('hello');
    expect(el).toBeInTheDocument();
    expect(el.className).toContain('bg-card');
  });

  it('Card emphasis uses strong border', () => {
    render(<Card emphasis>x</Card>);
    expect(screen.getByText('x').className).toContain('border-border-strong');
  });

  it('Button primary uses primary bg and forwards onClick', () => {
    const onClick = jest.fn();
    render(<Button onClick={onClick}>Go</Button>);
    const btn = screen.getByRole('button', { name: 'Go' });
    expect(btn.className).toContain('bg-primary');
    btn.click();
    expect(onClick).toHaveBeenCalled();
  });

  it('Button ghost uses transparent/hairline style', () => {
    render(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button', { name: 'Ghost' }).className).toContain('border');
  });

  it('Pill renders mono hairline', () => {
    render(<Pill>LVL 12</Pill>);
    expect(screen.getByText('LVL 12').className).toContain('font-mono');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/components/ui/__tests__/primitives.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement Card**

Create `frontend/src/components/ui/Card.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  emphasis?: boolean;
}

export function Card({ emphasis, className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'bg-card border rounded-xl p-5 transition-colors',
        emphasis ? 'border-border-strong' : 'border-border',
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 4: Implement Button**

Create `frontend/src/components/ui/Button.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost';
}

export function Button({ variant = 'primary', className, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        'rounded-lg px-4 py-2 font-medium cursor-pointer transition-colors',
        'active:translate-y-px disabled:opacity-50 disabled:cursor-not-allowed',
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90'
          : 'border border-border text-foreground hover:border-border-strong bg-transparent',
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 5: Implement Pill**

Create `frontend/src/components/ui/Pill.tsx`:

```tsx
import { cn } from '@/lib/utils';

export function Pill({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-xs tracking-wide',
        'border border-border rounded-md px-2.5 py-1 text-muted-foreground',
        className
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd frontend && npm test -- src/components/ui/__tests__/primitives.test.tsx`
Expected: PASS (5 tests).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/components/ui/Card.tsx frontend/src/components/ui/Button.tsx frontend/src/components/ui/Pill.tsx frontend/src/components/ui/__tests__/primitives.test.tsx
git commit -m "feat(ui): add Card, Button, Pill primitives"
```

---

### Task 4: Motion primitives — ProgressBar, CountUp

**Files:**
- Create: `frontend/src/components/ui/ProgressBar.tsx`
- Create: `frontend/src/components/ui/CountUp.tsx`
- Test: `frontend/src/components/ui/__tests__/motion.test.tsx` (create)

**Interfaces:**
- Consumes: `cn` from `@/lib/utils`.
- Produces:
  - `ProgressBar` — `React.FC<{ value: number; max: number; className?: string }>`. 4px `bg-muted` track, `bg-primary` fill; width `= min(value/max,1)*100%`; CSS width transition, disabled under reduced motion.
  - `CountUp` — `React.FC<{ value: number; format?: (n: number) => string; className?: string }>`. Animates 0→value on mount with `requestAnimationFrame`; renders final formatted value immediately under reduced motion / when `matchMedia` unavailable. Default format: `en-AU` 2dp.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/__tests__/motion.test.tsx`:

```tsx
import '@testing-library/jest-dom';
import { render, screen } from '@testing-library/react';
import { ProgressBar } from '../ProgressBar';
import { CountUp } from '../CountUp';

describe('motion primitives', () => {
  it('ProgressBar clamps width to 100%', () => {
    const { container } = render(<ProgressBar value={150} max={100} />);
    const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement;
    expect(fill.style.width).toBe('100%');
  });

  it('ProgressBar computes partial width', () => {
    const { container } = render(<ProgressBar value={25} max={100} />);
    const fill = container.querySelector('[data-testid="progress-fill"]') as HTMLElement;
    expect(fill.style.width).toBe('25%');
  });

  it('CountUp eventually shows the formatted target', async () => {
    render(<CountUp value={1234.5} />);
    expect(await screen.findByText('1,234.50')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd frontend && npm test -- src/components/ui/__tests__/motion.test.tsx`
Expected: FAIL — modules not found.

- [ ] **Step 3: Implement ProgressBar**

Create `frontend/src/components/ui/ProgressBar.tsx`:

```tsx
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
```

- [ ] **Step 4: Implement CountUp**

Create `frontend/src/components/ui/CountUp.tsx`:

```tsx
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
```

- [ ] **Step 5: Run test to verify it passes**

Run: `cd frontend && npm test -- src/components/ui/__tests__/motion.test.tsx`
Expected: PASS (3 tests). (jsdom ticks rAF; CountUp reaches target — reduced() is true when jest.setup mocks matchMedia to `matches:false`, otherwise rAF completes.)

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/ui/ProgressBar.tsx frontend/src/components/ui/CountUp.tsx frontend/src/components/ui/__tests__/motion.test.tsx
git commit -m "feat(ui): add ProgressBar and CountUp motion primitives"
```

---

### Task 5: Reskin Layout (the shell)

**Files:**
- Modify: `frontend/src/components/Layout.tsx:72-108`

**Interfaces:**
- Consumes: `useDarkModeStore` (for the logo image swap only).
- Produces: token-based app shell that every page renders inside.

Preserve: `data-testid="finpay-header-logo"`, both logo images, the inactivity warning popup behavior, `headerRight` slot, `<main>` and `<footer>` structure.

- [ ] **Step 1: Replace the root wrapper + footer classes with tokens**

In `frontend/src/components/Layout.tsx`, change the root `div` (line ~73-76). Remove the gradient ternary; use a flat token background:

```tsx
    <div
      className="flex flex-col min-h-screen bg-background text-foreground"
      onClick={updateActivity}
    >
```

Change the footer (line ~103-107) to:

```tsx
      <footer className="w-full border-t border-border py-8">
        <div className="text-center text-muted-foreground">
          <p>© 2025 FinPay. All rights reserved.</p>
        </div>
      </footer>
```

Keep the `nav`, the logo `button` + `darkMode ? FinpayDarkMode : Finpay` swap, and the warning popup exactly as-is (the popup's yellow is a semantic alert, leave it).

- [ ] **Step 2: Verify existing Layout-dependent tests still pass**

Run: `cd frontend && npm test -- src/pages/__tests__/Login.test.tsx`
Expected: PASS (Login renders inside Layout; logo testid intact).

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat(ui): reskin Layout shell to tokens"
```

---

### Task 6: Reskin Dashboard

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/Button`, `CountUp` from `@/components/ui/CountUp`, `Pill` from `@/components/ui/Pill`.
- Produces: reskinned dashboard; no exported API change.

Preserve (tests depend on these): testids `Send-dashboard-button`, `Deposit-dashboard-button`, `Withdraw-dashboard-button`, `Convert-dashboard-button`, `total-balance-heading`, `wallet-currency`, `aud-currency`, `send-requests-button`, `view-history-button`; headings "Send Transactions", "Send Requests", "User Transactions History"; heading text "Total balance:"; the `errorMessage` block; `<CurrencyWallet>` usage.

- [ ] **Step 1: Remove `darkMode` usage; import primitives**

Add imports:

```tsx
import { Button } from '@/components/ui/Button';
import { CountUp } from '@/components/ui/CountUp';
```

Delete `import useDarkModeStore ...` and `const { darkMode } = useDarkModeStore();`. Every `${darkMode ? ... : ...}` in this file is replaced per the rules below.

- [ ] **Step 2: Replace text-color ternaries with tokens**

Mechanical swap across the file:
- `${darkMode ? "text-white": "text-gray-900"}` and `${darkMode ? 'text-white' : ''}` → remove (inherit `text-foreground` from Layout). For muted sub-text (`<p>` descriptions) use `text-muted-foreground`.
- Section wrapper `${darkMode ? 'bg-gray-900' : 'bg-white'}` (the Send-Requests band, line ~178) → `bg-card border border-border rounded-2xl`.
- The `<img src={'/transaction.png'}>` `${darkMode ? 'bg-white' : ''}` → drop the bg entirely.

- [ ] **Step 3: Convert the four circular action buttons**

Each action button currently uses `bg-[#C6412A]`/`bg-gray-700` ternaries. Replace the four buttons' className (keep `onClick`, `data-testid`, and the icon child) with:

```tsx
className="w-18 h-18 sm:w-20 sm:h-20 bg-card border border-border hover:border-border-strong text-foreground rounded-full cursor-pointer transition-colors shadow-sm flex items-center justify-center"
```

Keep each `<label>` but drop its `darkMode` ternary — plain `className="mt-1 text-muted-foreground"`.

- [ ] **Step 4: Wrap the balance number in CountUp**

The AUD total (lines ~163-170): replace the inline `$ {userWallets...reduce(...)}` amount expression. Compute the sum into a const above the return:

```tsx
const audTotal = userWallets
  .filter((w) => w.walletCurrency === 'AUD')
  .reduce((total, w) => total + w.walletBalance, 0);
```

Then render:

```tsx
<p data-testid="wallet-currency" className="text-2xl md:text-3xl font-bold mr-2 md:ml-13">
  $<CountUp value={audTotal} />
</p>
<p data-testid="aud-currency" className="text-2xl font-semibold">AUD</p>
```

Keep `data-testid="total-balance-heading"` heading text "Total balance:".

- [ ] **Step 5: Convert the two rectangular CTAs to `<Button>`**

The "Send Requests" and "View History" buttons: keep `onClick` + `data-testid`, swap element to primitive:

```tsx
<Button onClick={() => navigate("/request/recipient")} data-testid="send-requests-button" className="px-6 py-3 rounded-lg shadow-sm">
  Send Requests
</Button>
```

```tsx
<Button onClick={() => navigate("/history")} data-testid="view-history-button" className="px-6 py-3 rounded-lg shadow-sm">
  View History
</Button>
```

- [ ] **Step 6: Run the Dashboard test suite**

Run: `cd frontend && npm test -- src/pages/__tests__/Dashboard.test.tsx`
Expected: PASS. If a test asserts an old color class, that's a genuine markup change — update the assertion to the new class; do not change copy or testids.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/pages/__tests__/Dashboard.test.tsx
git commit -m "feat(ui): reskin Dashboard to minimal dark tokens"
```

---

### Task 7: Reskin ChallengesList

**Files:**
- Modify: `frontend/src/pages/ChallengesList.tsx`

**Interfaces:**
- Consumes: `Card`, `Button`, `Pill`, `ProgressBar` from `@/components/ui/*`.
- Produces: reskinned challenges page; no exported API change.

Preserve: all copy (titles, section labels, empty-state messages, EXP text), the search input, the category `<select>`, section tab behavior, and the challenge data logic. Only styling changes.

- [ ] **Step 1: Remove `darkMode`; import primitives**

Delete `import useDarkModeStore` + `const { darkMode } = useDarkModeStore();`. Add:

```tsx
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Pill } from '@/components/ui/Pill';
import { ProgressBar } from '@/components/ui/ProgressBar';
```

- [ ] **Step 2: Replace `getCategoryColor` and `getProgressColor` with token-based styling**

Category chips become quiet mono pills (retire blue/green/purple washes). Replace `getCategoryColor` usages with `<Pill>{challenge.category}</Pill>`. Delete the now-unused `getCategoryColor` function. Delete `getProgressColor` and the `<div className={... getProgressColor}>` bar — it's replaced by `<ProgressBar>` in Step 4.

- [ ] **Step 3: Convert the challenge card container**

In `renderChallenge`, replace the outer status-colored `<div className={... bg-green-50 / bg-blue-50 / bg-white/60 ...}>` with a `<Card>`; use `emphasis` on completed:

```tsx
<Card emphasis={challenge.isCompleted} className="w-full mb-3">
```

Status text (`COMPLETED`, `EXPIRED`, `IN PROGRESS`, `AVAILABLE`) and EXP: keep the text, restyle to tokens — completed/in-progress use `text-positive`, expired/available use `text-muted-foreground`, EXP uses `text-subtle` mono. Titles `text-foreground`; descriptions `text-muted-foreground`.

- [ ] **Step 4: Replace the progress bar**

Where a started challenge shows progress, replace the manual track/fill markup with:

```tsx
<ProgressBar value={challenge.currentProgress} max={challenge.amountToGoal} />
```

Keep the surrounding `Progress` / `formatCurrency(...)` labels; restyle their text to `text-muted-foreground` / `text-foreground`.

- [ ] **Step 5: Restyle header, stats cards, section tabs, search, error/empty states**

- Page `<h1>Challenges</h1>`: drop `darkMode` ternary → `text-foreground`.
- Search `<input>` and category `<select>`: `bg-card border border-border rounded-full text-foreground focus:ring-2 focus:ring-ring` (remove `bg-white/60` and `#FFA294` ring).
- The three stat cards (`bg-white/60`): wrap each in `<Card>`; numbers use `text-primary` (available/in-progress/completed all one accent — keep the counts, drop blue/orange/green text).
- Section tab buttons: active = `<Button variant="primary">`, inactive = `<Button variant="ghost">` (keep icons + counts + onClick).
- Error card and empty-state card `bg-white/60` / `bg-red-50`: error stays semantic (`border-destructive text-destructive`); empty-state → `<Card>`. "Try Again" / "Clear search" buttons → `<Button>`.

- [ ] **Step 6: Verify build + lint (no test file exists for this page)**

Run: `cd frontend && npm run build && npm run lint`
Expected: build succeeds; no unused-var lint errors (confirm `getCategoryColor`/`getProgressColor` fully removed, `darkMode` gone).

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ChallengesList.tsx
git commit -m "feat(ui): reskin ChallengesList to minimal dark tokens"
```

---

### Task 8: Reskin Login + LandingPage

**Files:**
- Modify: `frontend/src/pages/Login.tsx`
- Modify: `frontend/src/pages/LandingPage.tsx`

**Interfaces:**
- Consumes: `Button` from `@/components/ui/Button`.
- Produces: reskinned auth entry + marketing landing.

Preserve: Login `<LoginForm />` usage; Landing testids `exchange-smarter`, `why-choose-finpay`, the `send`/`request` tab logic, `<SendMoneyCard>`/`<RequestMoneyCard>` usage, all copy.

- [ ] **Step 1: Reskin Login header button**

In `frontend/src/pages/Login.tsx`, replace the terracotta Back button with the primitive:

```tsx
import { Button } from '@/components/ui/Button';
// ...
  const headerButtons = (
    <div className="gap-4 md:flex items-center">
      <Button variant="ghost" onClick={() => navigate('/')}>Back</Button>
    </div>
  );
```

- [ ] **Step 2: Reskin LandingPage buttons + surfaces**

In `frontend/src/pages/LandingPage.tsx`:
- Header Login button → `<Button variant="ghost">Login</Button>`; Sign Up → `<Button>Sign Up</Button>` (import `Button`).
- "Get Started" CTA → `<Button className="flex items-center justify-center px-8 py-3">Get Started <ArrowRightIcon className="ml-2 h-5 w-5" /></Button>`.
- Headline `text-gray-800` → `text-foreground`; paragraph `text-gray-600` → `text-muted-foreground`.
- Feature panel `bg-white ... shadow-lg` → `bg-card border border-border`; inner `bg-gray-100` tiles → `bg-muted`; feature `<h3> text-gray-800` → `text-foreground`, `<p> text-gray-700` → `text-muted-foreground`; `BoltIcon`/etc `text-[#C6412A]` → `text-primary`.
- Send/Request toggle: track `bg-gray-100 border-gray-200` → `bg-muted border-border`; slider `bg-white` → `bg-card`; active label `text-[#C6412A]` → `text-primary`, inactive `text-gray-600 hover:bg-gray-200` → `text-muted-foreground hover:bg-accent`.
- Right card `bg-white shadow-lg` → `bg-card border border-border`.

- [ ] **Step 3: Run Login + Landing tests**

Run: `cd frontend && npm test -- src/pages/__tests__/Login.test.tsx src/pages/__tests__/LandingPage.test.tsx`
Expected: PASS (testids + copy preserved).

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/Login.tsx frontend/src/pages/LandingPage.tsx
git commit -m "feat(ui): reskin Login and LandingPage to minimal dark tokens"
```

---

### Task 9: Full regression + manual theme check

**Files:** none (verification task).

- [ ] **Step 1: Run the full frontend test suite**

Run: `cd frontend && npm test`
Expected: all suites PASS. Fix any assertion that broke purely on a changed style class (update the class in the test); never alter copy/testids to make a test pass.

- [ ] **Step 2: Build**

Run: `cd frontend && npm run build`
Expected: success.

- [ ] **Step 3: Manual visual check (both themes)**

Run: `cd frontend && npm run dev`. In the app, toggle dark mode and confirm on `/dashboard`, `/view/challenges`, `/login`, `/` (landing):
- Dark: `#0B0D11` canvas, lime accent only on progress + primary buttons, hairline borders, no gradients/glow.
- Light: `#F6F7F9` canvas, darker-lime accent legible, readable contrast.
- Toggle flips the whole app via `<html class="dark">`; no leftover terracotta or gray-scale ternaries on the 4 pages.
- Non-migrated pages (e.g. `/profile`) still render without breakage.

- [ ] **Step 4: Commit any test adjustments**

```bash
git add -A
git commit -m "test(ui): align assertions with minimal dark reskin"
```

---

## Self-Review

**Spec coverage:**
- Token sets (dark+light) → Task 1. ✓
- Theming mechanism (`.dark` class, keep store, non-migrated pages work) → Task 2 + Tasks 6-8 remove ternaries only on migrated files. ✓
- 5 primitives (Card, Button, ProgressBar, Pill, CountUp) → Tasks 3-4. ✓
- Reskin Layout, Dashboard, ChallengesList, Login, LandingPage → Tasks 5-8. ✓
- Restrained motion, no confetti → CountUp/ProgressBar honor reduced-motion; no confetti anywhere. ✓
- Success criteria (tests pass, no ternaries/terracotta on migrated pages, both themes) → Task 9. ✓
- Risk: MUI on the 4 pages — none of Dashboard/Challenges/Login/Landing import `@mui/*` (verified during planning); MUI-heavy pages are out of scope. ✓
- Risk: light-variant contrast → Task 1 uses darkened accent `#4B9A1E`; Task 9 Step 3 eyeballs it. ✓

**Placeholder scan:** none — all code and class swaps are concrete.

**Type consistency:** `syncThemeClass(dark: boolean)`, `Card({emphasis})`, `Button({variant})`, `ProgressBar({value,max})`, `CountUp({value,format})`, `Pill` — names/signatures consistent across producing and consuming tasks.
