# FinPay "Neon Ledger" Redesign — Foundation + Dashboard Proof

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land the "Neon Ledger" visual system (glass-on-chrome, neon accents, mono money) as reusable tokens + utilities + shared components, and prove it end-to-end by restyling the Dashboard page.

**Architecture:** The app is token-driven (Tailwind v4 + semantic CSS vars in `frontend/src/index.css`). Most of the redesign flows from adding tokens once. Glass is an additive `.glass` utility class and a `.glow-primary` hover — never a replacement for existing token classes — so component APIs stay frozen (keeps the `.design-sync` mirror valid) and the existing jest suite stays green as the regression net. An `AuroraBackground` component adds the ambient backdrop behind all content via `Layout`.

**Tech Stack:** React 19, Vite, Tailwind v4, `lucide-react` (icons), `motion` (animation), `zustand` (dark-mode store toggles `.dark` on `<html>`). Package manager: npm. Design spec: `DESIGN.md` at repo root.

## Global Constraints

- Dark-first, but light mode stays functional — every new token gets a light AND dark value.
- Glass (`backdrop-blur` + translucent) on chrome only (nav, modals, floating summary cards). Never on data tables/dense list bodies/form fields.
- No emoji in UI. Icons come from `lucide-react` only.
- Currency amounts use mono + `tabular-nums`.
- Component prop signatures in `src/components/ui/*` must NOT change (design-sync `config.json` documents them). Add styling via `className`/utility classes, not new props.
- All existing tests in `frontend/src/components/ui/__tests__/` must remain green after every task.
- Lime `--primary` is for accents/amounts/button fills only, never small body copy. Body text stays `--foreground`.
- Run all commands from `frontend/` unless stated. Verify with `npm test` and `npm run build`.

---

### Task 1: Add design tokens + glass/glow utilities

**Files:**
- Modify: `frontend/src/index.css` (`@theme inline` block, `:root` block, `.dark` block; add `@layer components`)
- Test: `frontend/src/components/ui/__tests__/primitives.test.tsx` (unchanged — used as regression check)

**Interfaces:**
- Produces: CSS custom properties `--surface-2`, `--play-violet`, `--play-cyan`, `--glass`, `--glass-line`, `--glass-shadow`; Tailwind color utilities `bg-play-violet` / `text-play-violet` / `bg-play-cyan` / `text-play-cyan` / `bg-surface-2`; utility classes `.glass` and `.glow-primary`. Later tasks consume these.

- [ ] **Step 1: Register color tokens in `@theme inline`**

In `frontend/src/index.css`, inside the existing `@theme inline { ... }` block, add these lines alongside the other `--color-*` entries:

```css
  --color-surface-2: var(--surface-2);
  --color-play-violet: var(--play-violet);
  --color-play-cyan: var(--play-cyan);
```

- [ ] **Step 2: Add light-mode values to `:root`**

Inside the existing `:root { ... }` block, add:

```css
  --surface-2: #FFFFFF;
  --play-violet: #6D5DF0;
  --play-cyan: #0EA5C6;
  --glass: rgba(255, 255, 255, 0.62);
  --glass-line: rgba(17, 20, 26, 0.08);
  --glass-shadow: 0 12px 40px rgba(17, 20, 26, 0.10);
```

- [ ] **Step 3: Add dark-mode values to `.dark`**

Inside the existing `.dark { ... }` block, add:

```css
  --surface-2: #171B22;
  --play-violet: #7C6BFF;
  --play-cyan: #3BE8FF;
  --glass: rgba(20, 24, 31, 0.55);
  --glass-line: rgba(255, 255, 255, 0.08);
  --glass-shadow: 0 12px 40px rgba(0, 0, 0, 0.35);
```

- [ ] **Step 4: Add glass + glow utilities**

At the end of `frontend/src/index.css`, after the existing `@layer base { ... }`, add:

```css
@layer components {
  .glass {
    background: var(--glass);
    backdrop-filter: blur(16px) saturate(135%);
    -webkit-backdrop-filter: blur(16px) saturate(135%);
    border: 1px solid var(--glass-line);
    box-shadow: var(--glass-shadow);
  }

  .glow-primary {
    transition: box-shadow 0.15s ease, transform 0.15s ease;
  }
  .glow-primary:hover {
    box-shadow: 0 0 24px color-mix(in srgb, var(--primary) 45%, transparent);
    transform: translateY(-1px);
  }

  @media (prefers-reduced-motion: reduce) {
    .glow-primary { transition: none; }
    .glow-primary:hover { transform: none; }
  }
}
```

- [ ] **Step 5: Verify existing tests still pass**

Run: `npm test -- src/components/ui/__tests__/primitives.test.tsx`
Expected: PASS (token additions don't change any asserted class).

- [ ] **Step 6: Verify build compiles the new utilities**

Run: `npm run build`
Expected: build succeeds, no CSS/TS errors.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/index.css
git commit -m "feat(design): add neon-ledger tokens, glass and glow utilities"
```

---

### Task 2: AuroraBackground component

**Files:**
- Create: `frontend/src/components/ui/AuroraBackground.tsx`
- Test: `frontend/src/components/ui/__tests__/aurora.test.tsx`

**Interfaces:**
- Consumes: `--play-violet`, `--play-cyan` (Task 1).
- Produces: `export function AuroraBackground(): JSX.Element` — a fixed, decorative, `aria-hidden` layer. Task 4 mounts it in `Layout`.

- [ ] **Step 1: Write the failing test**

Create `frontend/src/components/ui/__tests__/aurora.test.tsx`:

```tsx
import '@testing-library/jest-dom';
import { render } from '@testing-library/react';
import { AuroraBackground } from '../AuroraBackground';

describe('AuroraBackground', () => {
  it('renders a decorative, aria-hidden, non-interactive layer', () => {
    const { container } = render(<AuroraBackground />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute('aria-hidden', 'true');
    expect(root.className).toContain('pointer-events-none');
    expect(root.className).toContain('fixed');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/__tests__/aurora.test.tsx`
Expected: FAIL — `Cannot find module '../AuroraBackground'`.

- [ ] **Step 3: Write the component**

Create `frontend/src/components/ui/AuroraBackground.tsx`:

```tsx
export function AuroraBackground() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
    >
      <div
        className="absolute rounded-full blur-[90px] opacity-50"
        style={{
          width: 560, height: 560, top: -180, left: -120,
          background: 'radial-gradient(circle, var(--play-violet), transparent 65%)',
        }}
      />
      <div
        className="absolute rounded-full blur-[90px] opacity-40"
        style={{
          width: 620, height: 620, top: 120, right: -200,
          background: 'radial-gradient(circle, var(--play-cyan), transparent 65%)',
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage: 'radial-gradient(var(--border) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          maskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
          WebkitMaskImage: 'linear-gradient(180deg, transparent, #000 30%, #000 70%, transparent)',
        }}
      />
    </div>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- src/components/ui/__tests__/aurora.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/AuroraBackground.tsx frontend/src/components/ui/__tests__/aurora.test.tsx
git commit -m "feat(design): add AuroraBackground ambient layer"
```

---

### Task 3: Button neon glow (primary)

**Files:**
- Modify: `frontend/src/components/ui/Button.tsx`
- Test: `frontend/src/components/ui/__tests__/primitives.test.tsx` (add one assertion)

**Interfaces:**
- Consumes: `.glow-primary` utility (Task 1).
- Produces: primary `Button` carries `glow-primary` class. No prop change.

- [ ] **Step 1: Add the failing assertion**

In `frontend/src/components/ui/__tests__/primitives.test.tsx`, add this test inside the `describe('ui primitives', ...)` block:

```tsx
  it('Button primary carries the neon glow class', () => {
    render(<Button>Send</Button>);
    expect(screen.getByRole('button', { name: 'Send' }).className).toContain('glow-primary');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- src/components/ui/__tests__/primitives.test.tsx -t "neon glow"`
Expected: FAIL — class `glow-primary` not present.

- [ ] **Step 3: Add the glow class to the primary branch**

In `frontend/src/components/ui/Button.tsx`, change the primary variant branch from:

```tsx
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90'
```

to:

```tsx
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90 glow-primary'
```

- [ ] **Step 4: Run the full primitives suite**

Run: `npm test -- src/components/ui/__tests__/primitives.test.tsx`
Expected: PASS (including the original `bg-primary` assertion — still present).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/ui/Button.tsx frontend/src/components/ui/__tests__/primitives.test.tsx
git commit -m "feat(design): neon glow on primary buttons"
```

---

### Task 4: Layout — full glass nav + mount aurora

**Files:**
- Modify: `frontend/src/components/Layout.tsx`

**Interfaces:**
- Consumes: `AuroraBackground` (Task 2), `.glass` (Task 1).
- Produces: every authenticated page renders the aurora backdrop and a glass nav (no test — verified visually + by build).

- [ ] **Step 1: Import AuroraBackground**

In `frontend/src/components/Layout.tsx`, add to the imports at top:

```tsx
import { AuroraBackground } from '@/components/ui/AuroraBackground';
```

- [ ] **Step 2: Mount the aurora as the first child of the root div**

Change the opening of the returned root element from:

```tsx
    <div
      className="flex flex-col min-h-screen bg-background text-foreground"
      onClick={updateActivity}
    >
      {/* Show Warning Popup */}
```

to:

```tsx
    <div
      className="flex flex-col min-h-screen bg-background text-foreground"
      onClick={updateActivity}
    >
      <AuroraBackground />
      {/* Show Warning Popup */}
```

- [ ] **Step 3: Upgrade the nav to full glass**

Change the nav element's className from:

```tsx
      <nav className="sticky top-0 z-10 w-full border-b border-border bg-background/70 backdrop-blur-md">
```

to:

```tsx
      <nav className="glass sticky top-0 z-10 w-full !rounded-none !border-x-0 !border-t-0">
```

(The `.glass` utility provides fill/blur/hairline; the `!` overrides keep the nav a full-width bar rather than a floating card.)

- [ ] **Step 4: Verify build + existing tests**

Run: `npm run build`
Expected: succeeds.
Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 5: Visual check**

Run: `npm run dev`, open the app, log in, confirm: aurora blobs visible behind content, nav reads as frosted glass over scrolling content, content is not obscured. Toggle dark mode — both themes legible.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/components/Layout.tsx
git commit -m "feat(design): glass nav + aurora backdrop in Layout"
```

---

### Task 5: Dashboard — apply the system (vertical-slice proof)

**Files:**
- Modify: `frontend/src/pages/Dashboard.tsx`
- Modify: `frontend/src/components/dashboard/CurrencyWallet.tsx`

**Interfaces:**
- Consumes: `.glass`, `bg-surface-2`, `text-play-violet`, `text-play-cyan` (Task 1); `Button` glow (Task 3); `CountUp`, `Card` (existing).

This task restyles a live page. First READ the current full files, then apply the transforms below. Keep all data logic, hooks, handlers, and `data-testid` attributes unchanged — this is styling only.

- [ ] **Step 1: Read the current files**

Read `frontend/src/pages/Dashboard.tsx` and `frontend/src/components/dashboard/CurrencyWallet.tsx` in full before editing.

- [ ] **Step 2: Balance / summary card → glass + mono money**

Wrap the main balance/summary block in a glass card and render the balance with mono tabular figures. Apply these classes to the container and amount:

- Container: add `glass rounded-xl p-5` (replace any existing `bg-card border ...` on the summary block; leave dense wallet lists on solid `bg-card`/`bg-surface-2`).
- Balance number (the `CountUp` and its currency symbol): wrap in `className="font-mono tabular-nums tracking-tight"`.
- Positive deltas: `text-positive font-mono`; negative: `text-destructive font-mono`.

- [ ] **Step 3: Action buttons → glow**

Any primary action (Send / Schedule / Top up) must use the `Button` primitive (`variant="primary"`, glow comes free from Task 3). Replace raw `<button>` primary actions on this page with `<Button>`. Secondary actions use `<Button variant="ghost">`. Icons: import from `lucide-react` (e.g. `Send`, `ArrowLeftRight`, `Plus`), size `className="h-4 w-4"`. Remove any `react-icons` imports that these replaced.

- [ ] **Step 4: Wallet cards / rows → feature color coding**

In `CurrencyWallet.tsx`, keep the card body on a solid surface (`bg-card` or `bg-surface-2`, `border border-border`). Add a feature accent: currency/convert affordances use `text-play-cyan`; recurring/scheduled markers use `text-play-violet`; group/split markers use `text-primary`. Amounts inside get `font-mono tabular-nums`.

- [ ] **Step 5: Verify build + tests**

Run: `npm run build` → succeeds.
Run: `npm test` → all PASS (Dashboard has no snapshot asserting old classes; if any test references removed markup, update the selector, not the behavior).

- [ ] **Step 6: Visual + contrast check**

Run `npm run dev`, open the Dashboard in dark mode. Confirm: balance card reads as glass, amounts are monospaced and aligned, feature colors distinguish wallet/convert/group, primary buttons glow on hover. Body copy is `--foreground`, not lime. Spot-check lime is only on accents/amounts/fills.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/Dashboard.tsx frontend/src/components/dashboard/CurrencyWallet.tsx
git commit -m "feat(design): restyle Dashboard with neon-ledger system"
```

---

### Task 6: Foundation verification pass

**Files:** none (verification only)

- [ ] **Step 1: Full test suite**

Run: `npm test`
Expected: all suites PASS.

- [ ] **Step 2: Production build**

Run: `npm run build`
Expected: succeeds, no type or CSS errors.

- [ ] **Step 3: Manual smoke in both themes**

Run `npm run dev`. In light AND dark: nav glass legible, aurora subtle (not distracting), Dashboard balance card + amounts correct, buttons glow, no horizontal scroll, keyboard focus rings visible on buttons/links.

- [ ] **Step 4: Confirm design-sync surface untouched**

Run: `git status .design-sync`
Expected: clean — no changes to `.design-sync/`. (Redesign edits `src/` only; the mirror is refreshed later by re-running `/design-sync`, out of scope here.)

---

## Out of scope (follow-up plans, one per cluster)

Same system, applied page-by-page. Each is its own plan built on this foundation:
- **Auth cluster:** `Login`, `Register`, `ForgotPassword`, `ResetPassword` (narrow glass card on aurora).
- **Money-movement cluster:** `SplitBill`, `CurrencyConversionPage`, `ViewScheduledPayments`, `RequestListPage`.
- **Wallet cluster:** `MultiWallet`, `CurrencyWalletPage`.
- **Groups cluster:** `GroupPage`, `CreateGroup`, `ManageGroup`, `GroupHistory`, `GroupInvite`, `ChallengesList`.
- **Misc:** `History`, `Notification`, `ProfilePage`, `AdminPage`, `LandingPage`.
- **Modals:** the `src/components/modal/*` set → glass treatment.
- **Icon migration (optional):** unify remaining `react-icons` usages to `lucide-react`.
- **Re-run `/design-sync`** after the redesign lands on main to refresh the mirror + remote project.

## Self-Review

- **Spec coverage vs DESIGN.md:** tokens (T1), glass recipe (T1 `.glass`), aurora backdrop (T2/T4), motion/glow (T1/T3), mono money (T5), lucide icons + feature coding (T5), a11y contrast rule (constraints + T5/T6), glass-on-chrome-only (constraints, enforced T4/T5). Display-font decision is deferred in DESIGN.md — intentionally not a task.
- **Placeholders:** none — every code step shows real code; T5 page edits are bounded transforms with exact class strings against files read at execution.
- **Type/name consistency:** `AuroraBackground`, `.glass`, `.glow-primary`, `--play-violet`, `--play-cyan`, `--surface-2` used identically across tasks. Component prop signatures unchanged, so `.design-sync/config.json` stays accurate.
