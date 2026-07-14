# Finpay Linear-Inspired Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Recreate the Linear-inspired Finpay redesign (Dashboard `1a`, Login `2a`, Register `2b`, OTP `3a`, Confirm `4a`, Add-currency `5a`, retuned `ui/` primitives) inside the existing React 19 + TS + Vite + Tailwind v4 frontend, reusing the token system, `cn()`, and `ui/` primitives.

**Architecture:** Extend the existing CSS-variable token system (already retuned — see "Prework, done"). Retune shared `ui/` primitives first, then build a persistent app-shell (sidebar + top bar) in `Layout.tsx`, then rebuild each surface on top. No new styling approach, no new global state — reuse existing Zustand stores. Every surface preserves the existing handlers and the `data-testid`s the jest suite asserts; where the redesign deletes an asserted element, the corresponding test is updated in the same task.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4 (CSS-var tokens in `src/index.css`), `cn()` (`src/lib/utils.ts`), `react-router-dom`, Zustand, `react-icons` + `lucide-react`, `react-country-flag`, `cmdk` (already installed). Fonts: Inter + JetBrains Mono (already loaded).

## Global Constraints

- **Dark-mode is the design target.** New tokens have light equivalents (already added) so light mode does not break; do not spend effort perfecting light-mode visuals.
- **Prefer semantic Tailwind classes** (`bg-card`, `bg-panel`, `bg-card2`, `border-border`, `border-border-strong`, `text-muted-foreground`, `text-subtle`, `bg-primary`, `text-primary`, `ring-ring`, `bg-hover`, `bg-green-tint`, `border-green-tint-border`, `bg-destructive-tint`, `text-destructive`) over hardcoded hex. Hex only where a value has no token.
- **Money, currency codes, kbd hints, OTP digits → mono.** Apply the `.num` utility (JetBrains Mono + tabular figures).
- **Accent green `#4CC38A` is functional only** — primary action, positive value, active/selected state. Never a large fill.
- **Depth = borders + layered surfaces, not shadows.** Modals: `shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)]`. Cards: at most `shadow-[0_20px_50px_-30px_rgba(0,0,0,.8)]`.
- **Focus ring:** green border + `0 0 0 3px rgba(76,195,138,.13)` glow (Tailwind: `focus:border-primary focus:ring-2 focus:ring-green-tint`). Error focus uses destructive equivalents.
- **Preserve every `data-testid` and asserted copy** unless the task explicitly updates the test. Preserve all existing route handlers and store calls.
- **Reuse `cn()`** for all conditional classes. Reuse existing `ui/` primitives; retune, never fork.
- **Verify each task:** `npx tsc --noEmit` clean, `npx vite build` succeeds, and the task's jest tests pass (`npx jest <file>`).

## Prework (DONE — do not redo)

`src/index.css` already retuned:
- `.dark` colors tuned to redesign hexes; `--primary`/`--ring`/`--sidebar-primary`/`--sidebar-ring` → `#4CC38A`; `--primary-foreground` → `#08130C`; `--destructive` → `#EE6A60`; `--warning` → `#E0A24E`; `--foreground`/`--muted-foreground`/`--subtle`/`--border`/`--border-strong`/`--card`/`--background` tuned.
- New tokens added (both `.dark` and `:root` light equivalents) and wired into `@theme inline`: `--panel`, `--card2`, `--hover`, `--primary-hover`, `--primary-border`, `--green-tint`, `--green-tint-border`, `--destructive-tint`, `--destructive-tint-border`.
- `--font-mono` (JetBrains Mono) added + loaded via Google Fonts; `.num` utility added; global `letter-spacing: -0.01em` on `body`.

Available classes from this: `bg-panel bg-card2 bg-hover text-primary-hover border-primary-border bg-green-tint border-green-tint-border bg-destructive-tint border-destructive-tint-border font-mono .num`.

## File Structure

- `src/components/ui/Button.tsx` — add `secondary` variant; retune all variants (Task 1).
- `src/components/ui/Input.tsx` — retune (38px, `card2` fill, green focus ring); add `icon` (leading) prop (Task 1).
- `src/components/ui/Pill.tsx` — add `tone` (`neutral | positive | warning | destructive`) for status/type pills (Task 1).
- `src/components/ui/Kbd.tsx` — **new**, small keyboard-key token (Task 1).
- `src/components/Layout.tsx` — new app shell: 236px sidebar + 56px top bar; keeps idle-timeout logic (Task 2).
- `src/components/dashboard/Sidebar.tsx` — **new**, extracted sidebar body (workspace switcher, search button, nav, wallets mini-list, user card) (Task 2).
- `src/pages/Dashboard.tsx` — balance hero + wallets grid + recent-activity table (Task 3).
- `src/components/dashboard/CurrencyWallet.tsx` — wallet cards grid + "Add wallet" tile (Task 3).
- `src/components/dashboard/HeaderButtons.tsx` — top-bar right cluster: bell + "New transfer" (Task 3).
- `src/pages/Login.tsx` + `src/components/LoginForm.tsx` — split brand panel `2a` (Task 4).
- `src/pages/Register.tsx` + `src/components/RegisterForm.tsx` — single-column `2b` + strength meter (Task 4).
- `src/components/dashboard/PasswordStrength.tsx` — **new**, meter + checklist (Task 4).
- `src/components/modal/authenticationModal.tsx` — OTP `3a` (Task 5).
- `src/components/modal/ConfirmationModal.tsx` — confirm `4a` (Task 6).
- `src/components/modal/AddCurrencyModal.tsx` — add-currency `5a` (Task 7).

Tests updated in-task: `src/pages/__tests__/Dashboard.test.tsx`, `Login.test.tsx`, `Register.test.tsx`, and `src/components/ui/__tests__/primitives.test.tsx` as needed.

---

## Task 1: Retune `ui/` primitives (foundation)

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`
- Modify: `src/components/ui/Pill.tsx`
- Create: `src/components/ui/Kbd.tsx`
- Test: `src/components/ui/__tests__/primitives.test.tsx` (update if variant class assertions break)

**Interfaces produced (later tasks rely on these):**
- `Button` — `variant?: 'primary' | 'secondary' | 'ghost' | 'destructive'`, `size?: 'sm' | 'md' | 'lg'`, `loading?: boolean`. Default `variant='primary'`, `size='md'`.
- `Input` — existing `error?: boolean` + new optional `icon?: React.ReactNode` (leading). Forward-ref preserved.
- `Pill` — existing span + new `tone?: 'neutral' | 'positive' | 'warning' | 'destructive'` (default `neutral`), `dot?: boolean` (leading status dot).
- `Kbd` — `<kbd>` token: `<Kbd>⌘K</Kbd>`.

- [ ] **Step 1: Read the current primitives** (`Button.tsx`, `Input.tsx`, `Pill.tsx`) to preserve their exact prop surface and class-merge order.

- [ ] **Step 2: Rewrite `Button.tsx`**

```tsx
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'destructive';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

const sizes = {
  sm: 'h-[30px] px-3 text-[13px] rounded-[9px]',
  md: 'h-9 px-4 text-sm rounded-[10px]',
  lg: 'h-[42px] px-5 text-sm rounded-[11px]',
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-medium cursor-pointer',
        'transition-colors active:translate-y-px disabled:opacity-45 disabled:cursor-not-allowed disabled:active:translate-y-0',
        sizes[size],
        variant === 'primary' &&
          'bg-primary text-primary-foreground border border-primary-border hover:bg-primary-hover',
        variant === 'secondary' &&
          'bg-card2 text-foreground border border-border-strong hover:border-primary',
        variant === 'ghost' &&
          'bg-transparent text-foreground hover:bg-hover',
        variant === 'destructive' &&
          'bg-destructive-tint text-destructive border border-destructive-tint-border hover:border-destructive',
        className,
      )}
      {...props}
    >
      {loading && (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      )}
      {children}
    </button>
  );
}
```

> Note: `destructive` is now the **tint** style. Confirmation dialogs that need a solid destructive fill pass `className="bg-destructive text-primary-foreground border-destructive hover:bg-destructive/90"` (Task 6 does this).

- [ ] **Step 3: Rewrite `Input.tsx`** — 38px height, `card2` fill, strong hairline, green focus ring, optional leading icon.

```tsx
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
```

- [ ] **Step 4: Retune `Pill.tsx`** — add `tone` + `dot`, keep default neutral identical in spirit (mono, hairline).

```tsx
import { cn } from '@/lib/utils';

interface PillProps extends React.HTMLAttributes<HTMLSpanElement> {
  tone?: 'neutral' | 'positive' | 'warning' | 'destructive';
  dot?: boolean;
}

const tones = {
  neutral: 'bg-card2 border-border text-muted-foreground',
  positive: 'bg-green-tint border-green-tint-border text-primary',
  warning: 'bg-warning/10 border-warning/30 text-warning',
  destructive: 'bg-destructive-tint border-destructive-tint-border text-destructive',
};
const dotColors = {
  neutral: 'bg-muted-foreground',
  positive: 'bg-primary',
  warning: 'bg-warning',
  destructive: 'bg-destructive',
};

export function Pill({ tone = 'neutral', dot = false, className, children, ...props }: PillProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 font-mono text-[10.5px] tracking-wide',
        'border rounded-md px-2 py-0.5',
        tones[tone],
        className,
      )}
      {...props}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotColors[tone])} />}
      {children}
    </span>
  );
}
```

- [ ] **Step 5: Create `Kbd.tsx`**

```tsx
import { cn } from '@/lib/utils';

export function Kbd({ className, ...props }: React.HTMLAttributes<HTMLElement>) {
  return (
    <kbd
      className={cn(
        'inline-flex items-center rounded-[5px] border border-border bg-card2 px-1.5 py-0.5',
        'font-mono text-[10px] text-muted-foreground',
        className,
      )}
      {...props}
    />
  );
}
```

- [ ] **Step 6: Run primitive tests, fix assertions**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx`
If a test asserts an old class string (e.g. `bg-primary text-primary-foreground hover:opacity-90` or `rounded-lg`), update the assertion to the new class. Do **not** weaken behavioral assertions. Expected: PASS.

- [ ] **Step 7: Typecheck + build**

Run: `npx tsc --noEmit && npx vite build`
Expected: no errors.

- [ ] **Step 8: Commit**

```bash
git add src/components/ui/
git commit -m "feat(ui): retune primitives for Linear redesign (Button/Input/Pill + Kbd)"
```

---

## Task 2: App shell — `Layout.tsx` sidebar workspace (`1a`)

**Files:**
- Modify: `src/components/Layout.tsx`
- Create: `src/components/dashboard/Sidebar.tsx`
- Test: none new; existing pages render inside `Layout` — verify with build + Dashboard test in Task 3.

**Interfaces:**
- Consumes: `Button`, `Kbd`, `Pill` (Task 1); `useAuthStore`, `useDarkModeStore`, `useNavigate`.
- Produces: `Layout` keeps signature `({ children, headerRight }: { children: ReactNode; headerRight?: ReactNode })`. `headerRight` now renders in the 56px top bar (right side). Adds optional `title?: string` prop for the top-bar page title (default `"Home"`).
- Produces: `Sidebar` — no props; self-contained (reads stores). Renders the 236px `bg-panel` rail.

**Design (`1a`):**
- Root: `flex min-h-screen bg-background text-foreground`. Left `<Sidebar/>` (fixed 236px, `bg-panel`, `border-r border-border`). Right: `flex-1 flex flex-col`.
- Top bar: 56px, `border-b border-border`, `px-5`, flex justify-between: left = page `title` (15px/600, `tracking-tight`); right = `headerRight`.
- Main: `flex-1 overflow-y-auto p-[22px]` wrapping `children`.
- **Keep** the idle-timeout `useEffect` + warning banner verbatim (restyle banner to `bg-warning/10 border border-warning/30 text-warning rounded-[10px]`).
- **Keep** `data-testid="finpay-header-logo"` on the workspace switcher (sidebar top) so any logo-nav test still resolves; it routes to `/dashboard`.
- Sidebar contents top→bottom:
  1. Workspace switcher: 28px `bg-primary rounded-[7px]` "F" mark (swap to `/FinpayDarkMode.png` if you prefer the real logo; keep the green tile as the mark), "Finpay" 14px/600, chevron. `data-testid="finpay-header-logo"`, `onClick=navigate('/dashboard')`.
  2. Search button (`Button variant="secondary" size="sm"` full width, `justify-between`): `<span class="flex items-center gap-2 text-muted-foreground"><Search/> Search …</span><Kbd>⌘K</Kbd>`. `onClick` may be a no-op placeholder (command palette is out of scope for `1a`); keep it inert but present.
  3. Nav list: items `Home` (active), `Wallets`, `Transactions`, `Requests` (count badge `Pill` `3`), `Groups`. Routes: Home→`/dashboard`, Wallets→`/dashboard` (no dedicated route; keep `/dashboard`), Transactions→`/history`, Requests→`/request/list`, Groups→`/groups`. Active item: `bg-card2` + `text-primary` icon; others `text-muted-foreground hover:bg-hover`. Determine active via `useLocation().pathname`.
  4. `WALLETS` mono section label (`text-[10px] text-subtle font-mono tracking-wider`) + up to 3 mini wallet rows: 2-letter country chip (use `FlagGetter`) + code + right-aligned `.num` balance. Data: reuse a light wallet fetch — **to avoid a second fetch, accept wallets are dashboard-owned**; for the sidebar mini-list, fetch independently with the same `GET /wallet/:userId` call OR render a static placeholder set. Simplest: fetch in `Sidebar` with the existing axios+`API_URL` pattern. `// ponytail: independent fetch; hoist to a store if it becomes a perf issue`.
  5. Bottom user card: gradient avatar "JD" (derive initials from `authStore` name if available, else "JD"), name, `Pill tone="positive" dot` "Verified" when `isVerified`, kebab icon-button.

Icons: `lucide-react` — `Home, Wallet, ArrowLeftRight, Inbox, Users, Search, Bell, MoreVertical, ChevronsUpDown`.

- [ ] **Step 1: Create `Sidebar.tsx`** with the structure above. Use `cn()` for active state. Money uses `.num`.
- [ ] **Step 2: Rewrite `Layout.tsx`** to the two-column shell, preserving the idle-timeout `useEffect`/warning banner and footer (footer optional — you may drop it inside the app shell; keep `© 2025 FinPay` text only if a test needs it — none does, so dropping is fine). Move `headerRight` into the top bar; add `title` prop.
- [ ] **Step 3: Typecheck + build.** Run: `npx tsc --noEmit && npx vite build`. Expected: pass.
- [ ] **Step 4: Visual check** with `/run` or `npm run dev` — sidebar renders, active Home highlighted, no horizontal scroll.
- [ ] **Step 5: Commit**

```bash
git add src/components/Layout.tsx src/components/dashboard/Sidebar.tsx
git commit -m "feat(layout): app-shell sidebar workspace (1a)"
```

---

## Task 3: Dashboard `1a` — hero, wallets grid, activity table

**Files:**
- Modify: `src/pages/Dashboard.tsx`
- Modify: `src/components/dashboard/CurrencyWallet.tsx`
- Modify: `src/components/dashboard/HeaderButtons.tsx`
- Modify: `src/pages/__tests__/Dashboard.test.tsx`

**Interfaces:**
- Consumes: `Layout` (now `title` + `headerRight`), `Card`, `Button`, `Pill`, `CountUp`, `Input`/`Kbd` as needed; `UserWalletInfo` type (unchanged, exported from `Dashboard.tsx`).
- Consumes existing handlers verbatim: `fetchUserWallet`, `handleConvertNavigation`, `audTotal`, routes `/transfer/recipient`, `/deposit`, `/withdraw`.
- `CurrencyWallet` keeps props `{ userWallets: UserWalletInfo[]; onAddWallet: () => void }` and the `handleCurrencyAddition` PUT logic + `AddCurrencyModal` wiring + `data-testid="wallet-addition"` (now on the "Add wallet" tile).

**⚠️ Test-breaking redesign — must update `Dashboard.test.tsx`:** the redesign **deletes** the "Send Transactions" heading, the four 80px circle buttons with testids `Send/Deposit/Withdraw/Convert-dashboard-button`, the `request.jpg`/`transaction.png` photo sections, and the `send-requests-button` / `view-history-button` / copy strings the test asserts. Replacement mapping:
- The four quick actions become **44px rounded-square icon buttons** in the balance hero — **keep the same `data-testid`s** (`Send-dashboard-button`, `Deposit-dashboard-button`, `Withdraw-dashboard-button`, `Convert-dashboard-button`) and the same `onClick` handlers, so those assertions keep passing.
- `wallet-currency` testid stays on the balance number; `/AUD/i` text stays (the "AUD" label next to the hero balance).
- The Send-Requests and View-History photo sections are **removed**; delete the three `getByText` assertions (`Create and send your transactions…`, `Create and send transaction request…`, `View your transactions transfer and request history…`) and the `send-requests-button` / `view-history-button` assertions from the test. Requests/History are reachable via the sidebar nav instead.

- [ ] **Step 1: Update `HeaderButtons.tsx`** to the top-bar right cluster: a bell icon-button (keep `newNotif` logic + `/notification` route + `FaRegBell`/`VscBellDot`) and a `Button` "New transfer" → `navigate('/transfer/recipient')`. Drop the flyout `Account/Transfer/Features` menus and mobile menu (nav now lives in the sidebar). Keep the profile status logic only if reused; otherwise the sidebar user card carries verified state — remove the profile button here to avoid duplication. `// ponytail: nav moved to sidebar`.

- [ ] **Step 2: Rewrite `Dashboard.tsx` body** inside `<Layout title="Home" headerRight={<HeaderButtons />}>`:
  - **Balance hero** `Card` with `bg-[linear-gradient(180deg,var(--card),var(--panel))] border-border rounded-[14px] p-[22px]`, flex justify-between:
    - Left: "Total balance" label (`text-muted-foreground text-[12.5px]`); `<p data-testid="wallet-currency" class="num text-[38px] font-semibold">$<CountUp value={audTotal} /></p>` + "AUD" (`text-xl`); a `Pill tone="positive"` `+2.4%` + "vs last month" (`text-subtle`).
    - Right: 4 compact quick actions — 44px `rounded-[11px] border border-border-strong bg-card2 hover:border-primary hover:text-primary` icon buttons with labels beneath. **Preserve the four `data-testid`s + handlers** (Send→`/transfer/recipient`, Deposit→`/deposit`, Withdraw→`/withdraw`, Convert→`handleConvertNavigation`). Icons: `IoIosSend`, `IoMdArrowUp`, `IoMdArrowDown`, `FaArrowRightArrowLeft` (already imported).
  - **Wallets grid** — render `<CurrencyWallet userWallets={userWallets} onAddWallet={fetchUserWallet} />`.
  - **Recent activity table** — header row `bg-panel` with mono uppercase labels `DESCRIPTION / TYPE / DATE / AMOUNT`, grid `grid-cols-[1fr_110px_120px_130px]`. Rows: 30px `rounded-[7px]` type icon (`bg-green-tint text-primary` for incoming), description + subline, `Pill` type, date (`text-subtle`), right-aligned `.num` amount (green `+`, plain `−`). **Data:** there is no transactions API wired into the dashboard today; render from a small local `recentActivity` constant (3–4 rows) so the table is real UI without inventing a backend. `// ponytail: static sample rows; wire to /history data when a dashboard feed endpoint exists`.
  - Keep the top error-message banner block (restyle to `bg-destructive-tint border border-destructive-tint-border text-destructive rounded-[10px]`).

- [ ] **Step 3: Rewrite `CurrencyWallet.tsx`** as a responsive grid (`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3`) of wallet `Card`s (drop the slider + chevrons):
  - Each card: country chip (`FlagGetter`) + `.num` code + change `Pill`; 20px `.num` balance; currency name (`text-subtle`); a 22px sparkline `<svg><polyline/></svg>` (green stroke if up else `text-subtle`; a static polyline is fine). Whole card `onClick=navigate('/currencywallet/${item.walletCurrency}')`.
  - Last cell: dashed "Add wallet" tile `border border-dashed border-border-strong hover:border-primary text-muted-foreground`, `onClick=toggleCurrencyModal`, **`data-testid="wallet-addition"`**.
  - Keep `handleCurrencyAddition` PUT + `AddCurrencyModal` render + `errorMsg` state verbatim.

- [ ] **Step 4: Update `Dashboard.test.tsx`** per the mapping above — keep the four action-button testid assertions and `wallet-currency`/`AUD`; remove the deleted-section assertions. Run: `npx jest src/pages/__tests__/Dashboard.test.tsx`. Expected: PASS.

- [ ] **Step 5: Typecheck + build.** Run: `npx tsc --noEmit && npx vite build`. Expected: pass.

- [ ] **Step 6: Visual check** via `/run`. Hero, wallet grid, activity table render in dark mode; quick actions hover green.

- [ ] **Step 7: Commit**

```bash
git add src/pages/Dashboard.tsx src/components/dashboard/CurrencyWallet.tsx src/components/dashboard/HeaderButtons.tsx src/pages/__tests__/Dashboard.test.tsx
git commit -m "feat(dashboard): sidebar-workspace hero + wallet grid + activity table (1a)"
```

---

## Task 4: Auth — Login `2a` (split panel) + Register `2b` (strength meter)

**Files:**
- Modify: `src/pages/Login.tsx`, `src/components/LoginForm.tsx`
- Modify: `src/pages/Register.tsx`, `src/components/RegisterForm.tsx`
- Create: `src/components/dashboard/PasswordStrength.tsx`
- Modify: `src/pages/__tests__/Login.test.tsx`, `src/pages/__tests__/Register.test.tsx`

**Interfaces:**
- Consumes: `Button`, `Input`, `Label` (Task 1). `LoginForm`/`RegisterForm` keep all existing state, `axios` calls, store usage, and the `AuthenticationModal` wiring in `LoginForm`.
- Produces: `PasswordStrength` — `{ password: string }`; renders 4 segment bars + requirement checklist; pure/presentational.

**Auth pages drop `Layout`** (auth is unauthenticated, full-bleed). `Login.tsx`/`Register.tsx` render the form centered on `bg-background` directly (no sidebar shell).

### Login `2a`
- 900×560 max, centered, `rounded-[16px] border border-border overflow-hidden` two-column card.
- Left 360px gradient panel `bg-[linear-gradient(165deg,#101512,#0B0C0E)]`: logo top; bottom headline "Money that moves at your pace." (26px/600), supporting paragraph (`text-muted-foreground`), two feature `Pill`s.
- Right: centered 320px form. Order: "Welcome back" heading; **passkey** `Button variant="secondary"` first ("Sign in with a passkey", inert placeholder — `// ponytail: passkey UI only, no WebAuthn`); "or" divider; Email `Input` with mail `icon` (keep `emailInput` state, prefill nothing — placeholder only); Password field (reuse the existing focus-ring wrapper pattern **or** switch to `Input` with a trailing eye toggle) with "Forgot?" link → `/forgotpassword`; green "Sign in" `Button` → `handleLogin`; "Create an account" footer → `/register`.

**⚠️ Test note (`Login.test.tsx`):** it asserts `getByText("Password")`, `getByText("Reset password")`, `getByTestId('password-input')`, and error strings from `handleLogin`. Keep `data-testid="password-input"` and the `Label` "Password". Rename the reset link copy from "Reset password" to "Forgot?" **and update the test's `getByText("Reset password")`** to match (or keep an accessible "Reset password" label). Error-message rendering path (`errorMsg`) is unchanged, so those assertions pass. Keep `Submit`→ handler behavior; button label may change to "Sign in" (update any label assertion).

### Register `2b`
- 440×640 max, single centered column, `rounded-[16px] border border-border p-8`.
- Logo; "Create your account" / "Free forever. No card required."; **First/Last name row** (`grid grid-cols-2 gap-3`); Email; Password with eye toggle + focus ring; then `<PasswordStrength password={password} />`; full-width "Create account" `Button`; Terms/Privacy microcopy.
- **Remove the confirm-password field and the wall-of-text regex error string**; the strength meter replaces them.

`PasswordStrength` logic (drives the meter — this is the one non-trivial branch in the task):

```tsx
import { cn } from '@/lib/utils';

const checks = [
  { label: '8+ characters', test: (p: string) => p.length >= 8 },
  { label: 'Upper & lowercase', test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { label: 'Number', test: (p: string) => /[0-9]/.test(p) },
  { label: 'One symbol', test: (p: string) => /[^A-Za-z0-9\s]/.test(p) },
];

export function PasswordStrength({ password }: { password: string }) {
  const met = checks.filter((c) => c.test(password)).length;
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-4 gap-1.5">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={cn('h-1 rounded-full', i < met ? 'bg-primary' : 'bg-muted')} />
        ))}
      </div>
      <ul className="flex flex-col gap-1">
        {checks.map((c) => {
          const ok = c.test(password);
          return (
            <li key={c.label} className={cn('flex items-center gap-2 text-[12px]', ok ? 'text-primary' : 'text-subtle')}>
              <span aria-hidden>{ok ? '✓' : '○'}</span>
              {c.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
```

**⚠️ Test note (`Register.test.tsx`):** it asserts `firstname-input`, `lastname-input`, `password-input`, `confirm-password-input`, and the exact regex error text `/password must contain at least one lowercase/i` and `/password and confirmation password does not match/i`. The `2b` design removes the confirm field and that error copy. **Decision required from these two options — default to (A):**
  - **(A, default) Update the test** to match `2b`: drop `confirm-password-input` and the confirmation-mismatch assertion; replace the regex-error assertion with strength-meter assertions (e.g. the "8+ characters" requirement turns met/green). Keep `firstname-input`, `lastname-input`, `password-input`, email validation (`/please enter a valid email/i` stays — `validateEmail` is unchanged). Registration still requires a valid password; gate the submit button on all four `checks` passing (replaces the old regex + confirm gate).
  - **(B) Keep confirm-password** field for parity and only restyle — smaller diff, less faithful to `2b`. Choose only if the reviewer wants the test suite untouched.

Submit gating (option A): replace `hasError` logic — button disabled unless `firstName && lastName && validEmail && checks.every(c => c.test(password))`. Keep the `handleSubmit` axios POST + `setAuth` + `navigate('/dashboard')` verbatim (it never sent `confirmationPassword` anyway).

- [ ] **Step 1: Create `PasswordStrength.tsx`** (code above).
- [ ] **Step 2: Rewrite `LoginForm.tsx`** to `2a` layout, preserving all state/handlers/`AuthenticationModal` wiring and `password-input` testid. Rewrite `Login.tsx` to center the split card without `Layout`.
- [ ] **Step 3: Rewrite `RegisterForm.tsx`** to `2b`: remove confirm field + regex error string, add `PasswordStrength`, retune gating. Rewrite `Register.tsx` to center the single column without `Layout`.
- [ ] **Step 4: Update `Login.test.tsx` and `Register.test.tsx`** per the notes above.
- [ ] **Step 5: Run auth tests.** `npx jest src/pages/__tests__/Login.test.tsx src/pages/__tests__/Register.test.tsx`. Expected: PASS.
- [ ] **Step 6: Typecheck + build.** `npx tsc --noEmit && npx vite build`. Expected: pass.
- [ ] **Step 7: Commit**

```bash
git add src/pages/Login.tsx src/pages/Register.tsx src/components/LoginForm.tsx src/components/RegisterForm.tsx src/components/dashboard/PasswordStrength.tsx src/pages/__tests__/Login.test.tsx src/pages/__tests__/Register.test.tsx
git commit -m "feat(auth): split-panel login (2a) + strength-meter register (2b)"
```

---

## Task 5: OTP modal `3a` (quiet centred)

**Files:**
- Modify: `src/components/modal/authenticationModal.tsx`
- Test: covered by `Login.test.tsx` (uses `submit-authentication-button`, `otp-input-0..5`, `close-authentication-button`, "Enter the 6-digit code…" text) and the OTP behavior.

**Preserve verbatim:** `useOtpStore` wiring, all handlers (`handleChange`, `handleKeyDown`, `handlePaste`, `handleSubmit`, `handleResendOTP`, `onFormSubmit`), `otp` state, `isSubmitting`, `inputsRef`, auto-advance / backspace / arrow / paste / auto-submit-on-6th, resend timer/disabled, verifying spinner. **Keep every `data-testid`** (`close-authentication-button`, `otp-input-${i}`, `submit-authentication-button`).

**Restyle only (`3a`):**
- Scrim: `fixed inset-0 bg-[rgba(6,7,9,.5)] backdrop-blur-sm` + `animate-in fade-in duration-200` (keep).
- Surface: `bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)] w-[376px] animate-in zoom-in-95 duration-200`.
- Replace the 80px green lock block with a small **green-tint lock badge**: `h-10 w-10 rounded-[9px] bg-green-tint text-primary` + `lucide-react` `Lock` icon. Close button `LiaTimesSolid` top-right (keep testid).
- Copy: "Verify it's you" (18px/600) / "Enter the 6-digit code we sent to `j•••@acme.io`" — **but keep the existing asserted string** "Enter the 6-digit code we sent to your email (check spam folder as well)" OR update `Login.test.tsx`'s `/Enter the 6-digit code we sent to your email/i` to the new copy. Default: keep the current copy to avoid touching the test.
- 6 segmented inputs: `w-11 h-12 rounded-[9px] text-center .num text-xl`; empty `border border-border-strong`; filled `border-primary bg-green-tint`; focus `ring-2 ring-green-tint border-primary`. Keep all input handlers/refs.
- "Verify code" green `Button` full width (`loading={isSubmitting}` via Task 1's spinner — or keep inline spinner). Resend line: "Resend in {timeLeft}s" disabled state, else "Resend code" (keep handler).

- [ ] **Step 1: Restyle the modal** keeping all logic + testids + asserted copy.
- [ ] **Step 2: Run** `npx jest src/pages/__tests__/Login.test.tsx` (exercises the modal). Expected: PASS.
- [ ] **Step 3: Typecheck + build.** Expected: pass.
- [ ] **Step 4: Commit**

```bash
git add src/components/modal/authenticationModal.tsx
git commit -m "feat(modal): quiet centred OTP (3a)"
```

---

## Task 6: Confirmation modal `4a` (calm confirm)

**Files:**
- Modify: `src/components/modal/ConfirmationModal.tsx`
- Consumer unchanged: `src/pages/CurrencyWalletPage.tsx` passes `{ message, confirmText, onConfirm, onCancel, disabled }`.

**Keep the prop API identical** (`message`, `confirmText`, `onConfirm`, `onCancel`, `disabled?`). Add optional `title?: string` (default "Close balance?") and optional `summary?: string` for the summary row — both optional so the existing call site keeps working.

**Restyle (`4a`):**
- Same scrim/surface as Task 5 (`bg-[rgba(6,7,9,.5)] backdrop-blur-sm`, `bg-[#17181C] border-border-strong rounded-[16px]`, `w-[376px]`, `animate-in`).
- Small **destructive-tint trash badge**: `h-10 w-10 rounded-[9px] bg-destructive-tint text-destructive` + `lucide-react` `Trash2`. Neutral by default — destructive color appears **only** on the primary action.
- Title (18px/600) = `title`; consequence paragraph = `message`; optional summary row `bg-card2 border border-border rounded-[10px] px-3 py-2` showing `summary`.
- Footer: neutral `Button variant="ghost"` "Cancel" (`onCancel`) + solid-destructive primary `Button` "Close wallet" (`onConfirm`, `disabled`). For the solid fill on this dialog only: `<Button variant="destructive" className="bg-destructive text-primary-foreground border-destructive hover:bg-destructive/90" ...>{confirmText}</Button>`.

- [ ] **Step 1: Restyle** keeping the prop API; add optional `title`/`summary`.
- [ ] **Step 2: Verify consumer** `CurrencyWalletPage.tsx` still compiles and the "Close Balance" flow renders (`confirmText` drives the button label; `message` drives the paragraph).
- [ ] **Step 3: Typecheck + build.** Expected: pass.
- [ ] **Step 4: Commit**

```bash
git add src/components/modal/ConfirmationModal.tsx
git commit -m "feat(modal): calm confirm dialog (4a)"
```

---

## Task 7: Add-currency modal `5a` (searchable list)

**Files:**
- Modify: `src/components/modal/AddCurrencyModal.tsx`
- Consumer unchanged: `CurrencyWallet.tsx` passes `{ onClose, onAddCurrency }`.

**Keep verbatim:** `searchTerm`/`selectedCurrency` state, the `filteredCurrencies` `useMemo` (matches `label`/`code`/`countryCode`), `handleAddCurrency`, the `useTransactionStore` currencies, and **all `data-testid`/`aria-label`s**: `add-currency-dialog`, `currency-filter`, `select-specific-currency`, `add-currency-close`, `add-specific-currency`.

**Restyle (`5a`):**
- Scrim/surface as Task 5; `w-[388px]`.
- Sticky header: title "Add a balance" + close button (keep `aria-label="add-currency-close"`).
- Search `Input` with leading search `icon` (Task 1), placeholder "Search currency or country…", `data-testid="currency-filter"`.
- Scroll body: split `filteredCurrencies` into a `POPULAR` group (first ~4, or a hardcoded popular code list intersected with results) and `ALL CURRENCIES` group, each under a mono section label. Row = 2-letter `ReactCountryFlag` (already used) + name + `.num` code + a **radio dot** on the right (`h-4 w-4 rounded-full border`; selected = `bg-primary` with a check + row gets `bg-green-tint border-green-tint-border`). Keep `onClick=setSelectedCurrency(currency.code)` and `aria-label="select-specific-currency"`.
- Footer `Button` full width: label reflects selection — `Add ${selectedCurrency ?? ''} wallet` → "Add USD wallet"; keep `disabled={!selectedCurrency}`, `onClick=handleAddCurrency`, `aria-label="add-specific-currency"`.

- [ ] **Step 1: Restyle** keeping logic + all testids/aria-labels; swap the placeholder chip for `ReactCountryFlag` (already imported).
- [ ] **Step 2: Grep for tests** touching add-currency: `grep -rn "add-currency\|currency-filter\|select-specific-currency\|add-specific-currency" src/**/__tests__ src/pages/__tests__` and run any that match. Expected: PASS.
- [ ] **Step 3: Typecheck + build.** Expected: pass.
- [ ] **Step 4: Commit**

```bash
git add src/components/modal/AddCurrencyModal.tsx
git commit -m "feat(modal): searchable add-currency list (5a)"
```

---

## Final verification (after all tasks)

- [ ] Full test suite: `npx jest` — all pass (with the in-task test updates).
- [ ] `npx tsc --noEmit && npx vite build` — clean.
- [ ] `/run` the app: log in → OTP → dashboard → open add-currency → close-balance confirm; verify dark-mode tokens, green used only as accent, mono figures on money/codes/OTP, no horizontal page scroll.
- [ ] Remove now-unused photo assets **only if nothing else references them**: `grep -rn "request.jpg\|transaction.png\|mock_history" src public` before deleting `public/request.jpg`, `public/transaction.png`, `src/assets/mock_history.jpg`. `// ponytail: delete only if grep is clean`.

## Out of scope (per your selections)

Directions `1b`/`1c`, `2c`, `3b`/`3c`, `4b`/`4c`, `5b`/`5c`, and the global `⌘K` CommandPalette are **not** built. `4b` (type-to-confirm) is noted in the handoff for account deletion but no delete-account flow exists to attach it to — skip until one does.

## Self-review notes

- **Spec coverage:** 1a→T2+T3; 2a→T4; 2b→T4; 3a→T5; 4a→T6; 5a→T7; §6 primitives→T1; tokens→Prework. All selected directions covered.
- **Test conflicts surfaced:** Dashboard (deleted sections), Register (confirm field + regex error), Login (reset-link copy), OTP (copy) — each task states the exact test edit and defaults to the least-invasive choice.
- **Type consistency:** `Button` variants/sizes, `Input` `icon`, `Pill` `tone`/`dot`, `Kbd`, `PasswordStrength` `{password}`, `ConfirmationModal` optional `title`/`summary`, `CurrencyWallet`/`AddCurrencyModal` prop APIs — all unchanged where consumed, extended additively only.
