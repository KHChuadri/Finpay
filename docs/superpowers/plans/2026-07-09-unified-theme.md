# Unified Theme Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply one consistent monochrome + single-accent theme across every page and component, correct in both light and dark mode, by moving all hardcoded colors onto existing semantic tokens and shared primitives.

**Architecture:** Tokens already live in `frontend/src/index.css`. Add 3 primitives (`Input`, `Label`, `PageContainer`), extend `Button` with a `destructive` variant, then migrate 72 hardcoded-color files onto tokens/primitives using a fixed mapping. No logic, copy, or layout-structure changes.

**Tech Stack:** React 19, Tailwind v4, Vite, TypeScript, Jest + React Testing Library (ts-jest, jsdom).

## Global Constraints

- Work on branch `theme/unified-monochrome`. Commit after every task.
- All paths below are relative to `frontend/`. Run all commands from `frontend/`.
- `cn` helper is `@/lib/utils`. `@/` maps to `src/`.
- **Color mapping (apply verbatim in every migration task):**
  | Hardcoded | Token class |
  |-----------|-------------|
  | `bg-white` | `bg-card` |
  | `bg-gray-50` / `bg-gray-100` | `bg-muted` |
  | `bg-gray-200` | `bg-secondary` |
  | `bg-gray-800` / `bg-gray-900` / `bg-black` | `bg-background` (page) or `bg-card` (panel) — pick by context |
  | `text-black` / `text-gray-800` / `text-gray-900` | `text-foreground` |
  | `text-gray-500` / `text-gray-600` / `text-gray-700` | `text-muted-foreground` |
  | `text-gray-400` | `text-subtle` |
  | `border-gray-200` / `border-gray-300` / `border-[#…]` | `border-border` (or `border-input` on form fields) |
  | `text-white` on a colored button | `text-primary-foreground` (primary) / `text-destructive-foreground` (destructive) |
  | `bg-[#C6412A]` / `bg-red-500/600` / `bg-blue-*` on an **action** button | `bg-primary` (default) or `bg-destructive` if the action deletes/removes/withdraws data |
  | `border-[#C6412A]` / colored button outline | `ghost` Button (neutral) |
  | `text-red-500` / `text-red-600` on **error messages** | `text-destructive` (stays red — semantic) |
  | `bg-red-200 border-red-400 text-red-700` error banners | `bg-destructive/10 border-destructive text-destructive` |
  | `outline-blue-300` / `border-blue-*` focus styles | remove; use `Input` focus ring |
  | `text-green-*` / `bg-green-*` success, and transaction-DELTA incoming amounts (`+$…`, "received", credits) | `text-positive` / `bg-positive` — NOTE: static wallet balances / totals are NOT signal amounts; leave them `text-foreground` (neutral). Green is reserved for actions + incoming deltas, not every figure. Negative/outgoing deltas → `text-destructive`. |
  | peach/brand gradient page bg `bg-gradient-to-* from-[#…] to-[#…]` | `bg-background` (flat token surface) |
  | amber/yellow warning: `bg-yellow-*` / `bg-amber-*` / `text-amber-*` / `border-amber-*` | warning token — `bg-warning`/`text-warning`/`border-warning`/`text-warning-foreground`; subtle banner = `bg-warning/10 border-warning text-warning` |
- **Preserve semantics:** error text stays `destructive` (red), positive amounts stay `positive` (green), country flags / chart colors / brand SVGs are NOT changed.
- **Raw `<input>` → `<Input>`; raw label markup → `<Label>`** wherever a straightforward swap keeps behavior (value, onChange, onBlur, placeholder, data-testid, type). Password fields with an eye-toggle wrapper keep their wrapper but the inner `<input>` adopts token classes (they cannot use `Input` directly because of the absolute-positioned icon — swap the gray/blue literals only).
- **Every migration task ends with:** `npx tsc --noEmit` passes, target `grep` is clean for those files, and a dark-mode screenshot of one representative page in the batch shows no white-on-black.
- Do not change `data-testid` attributes (tests depend on them).

---

## Task 1: Token fixes

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS custom properties `--destructive` (hex, both modes), `--destructive-foreground`, and Tailwind color `--color-destructive-foreground` → enables `bg-destructive`/`text-destructive-foreground` utilities.

- [ ] **Step 1: Register destructive-foreground in the `@theme inline` block**

In `src/index.css`, in the `@theme inline { … }` block, directly after the line `--color-destructive: var(--destructive);` add:

```css
  --color-destructive-foreground: var(--destructive-foreground);
```

- [ ] **Step 2: Set destructive hex + foreground in `:root`**

In the `:root { … }` block, replace:

```css
  --destructive: oklch(0.577 0.245 27.325);
```

with:

```css
  --destructive: #DC2626;
  --destructive-foreground: #FFFFFF;
```

- [ ] **Step 3: Set destructive hex + foreground in `.dark`**

In the `.dark { … }` block, replace:

```css
  --destructive: oklch(0.704 0.191 22.216);
```

with:

```css
  --destructive: #F87171;
  --destructive-foreground: #0B0D11;
```

- [ ] **Step 4: Verify build**

Run: `npx tsc --noEmit`
Expected: exit 0 (CSS is not typechecked, but confirms nothing else broke).

- [ ] **Step 5: Commit**

```bash
git add src/index.css
git commit -m "feat(theme): add destructive-foreground token, give destructive a hex"
```

---

## Task 2: Input primitive

**Files:**
- Create: `src/components/ui/Input.tsx`
- Test: `src/components/ui/__tests__/primitives.test.tsx` (append)

**Interfaces:**
- Produces: `Input` — `forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { error?: boolean }>`. Neutral by default; `error` swaps border/ring to destructive.

- [ ] **Step 1: Write the failing test**

Append inside the existing `describe('ui primitives', …)` block in `src/components/ui/__tests__/primitives.test.tsx` (add `import { Input } from '../Input';` at top):

```tsx
  it('Input uses input border by default', () => {
    render(<Input placeholder="name" />);
    expect(screen.getByPlaceholderText('name').className).toContain('border-input');
  });

  it('Input error swaps to destructive border', () => {
    render(<Input placeholder="bad" error />);
    expect(screen.getByPlaceholderText('bad').className).toContain('border-destructive');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t Input`
Expected: FAIL — cannot resolve `../Input`.

- [ ] **Step 3: Create the Input component**

Create `src/components/ui/Input.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t Input`
Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Input.tsx src/components/ui/__tests__/primitives.test.tsx
git commit -m "feat(ui): add Input primitive with token-driven focus + error states"
```

---

## Task 3: Label primitive

**Files:**
- Create: `src/components/ui/Label.tsx`
- Test: `src/components/ui/__tests__/primitives.test.tsx` (append)

**Interfaces:**
- Produces: `Label` — `React.LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }`. Renders children; `required` appends a `*` in `text-destructive`.

- [ ] **Step 1: Write the failing test**

Append to the `describe('ui primitives', …)` block (add `import { Label } from '../Label';`):

```tsx
  it('Label renders a required asterisk in destructive color', () => {
    render(<Label required>Email</Label>);
    const star = screen.getByText('*');
    expect(star.className).toContain('text-destructive');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t Label`
Expected: FAIL — cannot resolve `../Label`.

- [ ] **Step 3: Create the Label component**

Create `src/components/ui/Label.tsx`:

```tsx
import { cn } from '@/lib/utils';

interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
  required?: boolean;
}

export function Label({ required, className, children, ...props }: LabelProps) {
  return (
    <label className={cn('text-sm font-medium text-foreground', className)} {...props}>
      {children}
      {required && <span className="text-destructive"> *</span>}
    </label>
  );
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t Label`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Label.tsx src/components/ui/__tests__/primitives.test.tsx
git commit -m "feat(ui): add Label primitive with required asterisk"
```

---

## Task 4: PageContainer primitive

**Files:**
- Create: `src/components/ui/PageContainer.tsx`
- Test: `src/components/ui/__tests__/primitives.test.tsx` (append)

**Interfaces:**
- Produces: `PageContainer` — `React.HTMLAttributes<HTMLDivElement> & { size?: 'default' | 'narrow' }`. `default` → `max-w-6xl`, `narrow` → `max-w-md`. Always `mx-auto w-full px-6 py-8`.

- [ ] **Step 1: Write the failing test**

Append (add `import { PageContainer } from '../PageContainer';`):

```tsx
  it('PageContainer defaults to max-w-6xl and narrow to max-w-md', () => {
    const { rerender } = render(<PageContainer>a</PageContainer>);
    expect(screen.getByText('a').className).toContain('max-w-6xl');
    rerender(<PageContainer size="narrow">b</PageContainer>);
    expect(screen.getByText('b').className).toContain('max-w-md');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t PageContainer`
Expected: FAIL — cannot resolve `../PageContainer`.

- [ ] **Step 3: Create the PageContainer component**

Create `src/components/ui/PageContainer.tsx`:

```tsx
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t PageContainer`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/PageContainer.tsx src/components/ui/__tests__/primitives.test.tsx
git commit -m "feat(ui): add PageContainer width primitive"
```

---

## Task 5: Button destructive variant

**Files:**
- Modify: `src/components/ui/Button.tsx`
- Test: `src/components/ui/__tests__/primitives.test.tsx` (append)

**Interfaces:**
- Produces: `Button` variant union `'primary' | 'ghost' | 'destructive'`. `destructive` → `bg-destructive text-destructive-foreground hover:opacity-90`.

- [ ] **Step 1: Write the failing test**

Append (add `import { Button } from '../Button';` if not already imported in the file):

```tsx
  it('Button destructive variant uses destructive bg', () => {
    render(<Button variant="destructive">Delete</Button>);
    expect(screen.getByText('Delete').className).toContain('bg-destructive');
  });
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx -t "destructive variant"`
Expected: FAIL — no `bg-destructive` (only primary/ghost exist).

- [ ] **Step 3: Extend Button**

In `src/components/ui/Button.tsx`, change the interface line:

```tsx
  variant?: 'primary' | 'ghost';
```
to:
```tsx
  variant?: 'primary' | 'ghost' | 'destructive';
```

and replace the variant ternary:

```tsx
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90'
          : 'border border-border text-foreground hover:border-border-strong bg-transparent',
```
with:
```tsx
        variant === 'primary'
          ? 'bg-primary text-primary-foreground hover:opacity-90'
          : variant === 'destructive'
          ? 'bg-destructive text-destructive-foreground hover:opacity-90'
          : 'border border-border text-foreground hover:border-border-strong bg-transparent',
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx jest src/components/ui/__tests__/primitives.test.tsx`
Expected: PASS (all primitives tests green).

- [ ] **Step 5: Commit**

```bash
git add src/components/ui/Button.tsx src/components/ui/__tests__/primitives.test.tsx
git commit -m "feat(ui): add Button destructive variant"
```

---

## Migration tasks (6–13)

Each task migrates one area using the **Global Constraints color mapping**. Below is the single worked example every migration task follows; apply the same transformation shape to each file in the batch.

### Worked example: `src/components/RegisterForm.tsx`

Card wrapper — `bg-white … shadow-2xl` → `bg-card border border-border … shadow-xl`; heading `text-black` → `text-foreground`; `text-red-500` error → `text-destructive`.

Each label block becomes:

```tsx
<label className="flex flex-col gap-1">
  <Label required>First name</Label>
  <Input
    data-testid="firstname-input"
    type="text"
    value={firstName}
    onBlur={() => isFirstNameValid()}
    onChange={(e) => setFirstName(e.target.value)}
    placeholder="Enter your first name"
    error={firstNameError.length !== 0}
  />
  {firstNameError.length !== 0 && <p className="text-destructive text-sm">{firstNameError}</p>}
</label>
```

Password fields keep their eye-toggle wrapper `<div>`; only swap the wrapper's `border-gray-300` → `border-input`, `outline-blue-300` → `ring-2 ring-ring/40`, and the inner `<input>` keeps `border-none w-full focus:outline-none bg-transparent text-foreground`.

Submit button:
```tsx
<Button className="w-full rounded-xl py-2" disabled={hasError} onClick={() => handleSubmit()}>Submit</Button>
```
Back button:
```tsx
<Button variant="ghost" className="w-full rounded-xl py-2" onClick={() => navigate('/')}>Back</Button>
```

Add imports: `import { Input } from '@/components/ui/Input';`, `import { Label } from '@/components/ui/Label';`, `import { Button } from '@/components/ui/Button';`.

---

### Task 6: Migrate auth + entry forms

**Files (modify):** `src/components/LoginForm.tsx`, `src/components/RegisterForm.tsx`, `src/components/admin/AdminLoginForm.tsx`, `src/components/admin/AdminLogin.tsx`, `src/pages/Register.tsx`, `src/pages/ForgotPassword.tsx`, `src/pages/ResetPassword.tsx`, `src/components/LockedNotice.tsx`, `src/components/VerificationNotice.tsx`

- [ ] **Step 1:** Apply the color mapping + Input/Label/Button swaps to each file, following the worked example. Preserve all `data-testid`, state, and handlers.
- [ ] **Step 2:** Run `npx tsc --noEmit` → exit 0.
- [ ] **Step 3:** Run `grep -nE "bg-white|text-gray-|border-\[#|bg-\[#|text-black|outline-blue|border-blue|bg-red-[0-9]" src/components/LoginForm.tsx src/components/RegisterForm.tsx src/components/admin/AdminLoginForm.tsx src/components/admin/AdminLogin.tsx src/pages/Register.tsx src/pages/ForgotPassword.tsx src/pages/ResetPassword.tsx src/components/LockedNotice.tsx src/components/VerificationNotice.tsx` → only intentional matches (ideally none).
- [ ] **Step 4:** Dark-mode visual check — start `npm run dev`, screenshot `/register` and `/login` in dark mode; confirm card is dark, no white panel, buttons green/ghost.
- [ ] **Step 5:** Run `npx jest` → existing tests pass.
- [ ] **Step 6:** Commit: `git commit -am "refactor(theme): migrate auth + entry forms to tokens/primitives"`

### Task 7: Migrate landing components

**Files:** `src/components/landing/SendMoney.tsx`, `src/components/landing/RequestMoney.tsx`, `src/pages/LandingPage.tsx`
- [ ] **Step 1:** Apply mapping. The `border-primary` / `bg-primary` button work is already done; finish remaining `bg-white`, `text-gray-*`, `bg-[#…]` inside these files.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-\[#|border-\[#" src/components/landing/*.tsx src/pages/LandingPage.tsx` → clean.
- [ ] **Step 4:** Dark-mode screenshot of `/` → send/request card consistent.
- [ ] **Step 5:** Commit: `git commit -am "refactor(theme): migrate landing to tokens"`

### Task 8: Migrate dashboard

**Files:** `src/components/dashboard/CurrencyWallet.tsx`, `src/components/dashboard/HeaderButtons.tsx`, `src/components/dashboard/ListGroup.tsx`, `src/components/dashboard/LogoutButton.tsx`, `src/pages/Dashboard.tsx`, `src/pages/MultiWallet.tsx`, `src/pages/CurrencyWalletPage.tsx`
- [ ] **Step 1:** Apply mapping; wrap page bodies in `<PageContainer>` where a raw max-width div exists. Positive balances → `text-positive`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-gray-|bg-\[#|border-\[#|text-white" src/components/dashboard/*.tsx src/pages/Dashboard.tsx src/pages/MultiWallet.tsx src/pages/CurrencyWalletPage.tsx` → clean.
- [ ] **Step 4:** Dark-mode screenshot of `/dashboard` → consistent.
- [ ] **Step 5:** Commit: `git commit -am "refactor(theme): migrate dashboard to tokens"`

### Task 9: Migrate transaction flow

**Files:** all of `src/components/transaction/*.tsx` (Currencies, Deposit, ExchangeRate, Header, Pay, PaymentReceipt, Recipient, RecipientInfo, Request, RequestAmount, SavedRecipient, TransferAmount, Withdraw, adminWithdraw), `src/pages/CurrencyConversionPage.tsx`
- [ ] **Step 1:** Apply mapping. Error banners (`bg-red-200 border-red-400 text-red-700`) → `bg-destructive/10 border-destructive text-destructive`. Raw inputs → `Input`. `border-[#fea293]` (RecipientInfo) → `border-input`. Withdraw/Deposit "confirm" buttons stay `primary`; any "remove"/"delete" → `destructive`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-\[#|border-\[#|bg-red-[0-9]|text-white" src/components/transaction/*.tsx src/pages/CurrencyConversionPage.tsx` → clean.
- [ ] **Step 4:** Dark-mode screenshot of a transfer flow (Dashboard → Send) → consistent.
- [ ] **Step 5:** Run `npx jest` → pass (transaction components have tests).
- [ ] **Step 6:** Commit: `git commit -am "refactor(theme): migrate transaction flow to tokens/primitives"`

### Task 10: Migrate modals

**Files:** all of `src/components/modal/*.tsx` (AddCurrencyModal, ConfirmationModal, FailedRequestModal, FailedTransferModal, HistoryFilterModal, ScheduledPayment, SuccessfulRequestModal, SuccessfulTopupModal, SuccessfulTransferModal, authenticationModal), `src/components/admin/ErrorModal.tsx`, `src/components/admin/SuccessModal.tsx`
- [ ] **Step 1:** Apply mapping. Modal panels `bg-white` → `bg-card border border-border`; overlay backdrops keep `bg-black/50` (intentional scrim — leave). "Cancel" buttons → `ghost`; "Confirm delete/leave" → `destructive`; success confirm → `primary`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-\[#|border-\[#|text-white" src/components/modal/*.tsx src/components/admin/ErrorModal.tsx src/components/admin/SuccessModal.tsx` → clean (ignore `bg-black/50` scrims).
- [ ] **Step 4:** Dark-mode screenshot of one open modal (e.g. History filter) → consistent.
- [ ] **Step 5:** Commit: `git commit -am "refactor(theme): migrate modals to tokens"`

### Task 11: Migrate SplitBill / groups components

**Files:** all of `src/components/SplitBill/*.tsx` (GroupPay, GroupRecipient, GroupTopUp, GroupWithdraw, Groups, Invites, LeaveGroupModal, ManageMembers, Members, PendingInvites)
- [ ] **Step 1:** Apply mapping. `LeaveGroupModal` confirm → `destructive`; `GroupWithdraw` confirm → `primary`. Raw inputs → `Input`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-\[#|border-\[#|text-white|bg-red-[0-9]" src/components/SplitBill/*.tsx` → clean.
- [ ] **Step 4:** Dark-mode screenshot of a group page → consistent.
- [ ] **Step 5:** Commit: `git commit -am "refactor(theme): migrate SplitBill components to tokens"`

### Task 12: Migrate admin

**Files:** `src/components/admin/AdminChallengePage.tsx`, `src/components/admin/AdminMainPage.tsx`, `src/pages/AdminPage.tsx`
- [ ] **Step 1:** Apply mapping; wrap page body in `<PageContainer>` where applicable.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-gray-|bg-\[#|border-\[#|text-white" src/components/admin/AdminChallengePage.tsx src/components/admin/AdminMainPage.tsx src/pages/AdminPage.tsx` → clean.
- [ ] **Step 4:** Dark-mode screenshot of `/admin` → consistent.
- [ ] **Step 5:** Commit: `git commit -am "refactor(theme): migrate admin to tokens"`

### Task 13: Migrate profile + remaining pages

**Files:** `src/components/profile/BankDetails.tsx`, `src/components/profile/PersonalDetails.tsx`, `src/pages/ProfilePage.tsx`, `src/pages/Notification.tsx`, `src/components/NotificationList.tsx`, `src/pages/History.tsx`, `src/pages/GroupHistory.tsx`, `src/pages/ViewScheduledPayments.tsx`, `src/pages/RequestListPage.tsx`, `src/pages/GroupInvite.tsx`, `src/pages/GroupPage.tsx`, `src/pages/ManageGroup.tsx`, `src/pages/CreateGroup.tsx`, `src/pages/SplitBill.tsx`
- [ ] **Step 1:** Apply mapping; raw inputs → `Input`/`Label`; wrap page bodies in `<PageContainer>` where a raw max-width wrapper exists. Positive amounts → `text-positive`, negative → `text-destructive`.
- [ ] **Step 2:** `npx tsc --noEmit` → 0.
- [ ] **Step 3:** `grep -nE "bg-white|text-gray-|bg-gray-|bg-\[#|border-\[#|text-white|bg-red-[0-9]" <all files above>` → clean.
- [ ] **Step 4:** Dark-mode screenshot of `/profile`, `/history` → consistent.
- [ ] **Step 5:** Commit: `git commit -am "refactor(theme): migrate profile + remaining pages to tokens"`

---

## Task 14: Final verification sweep

**Files:** none (verification only)

- [ ] **Step 1: Repo-wide grep**

Run:
```bash
grep -rnE "bg-white|text-gray-[0-9]|bg-gray-[0-9]|border-\[#|bg-\[#|text-\[#|outline-blue|border-blue-[0-9]" src --include="*.tsx"
```
Expected: only intentional, justified matches (chart/flag/scrim). Investigate and fix or annotate each remaining hit.

- [ ] **Step 2: Typecheck + tests**

Run: `npx tsc --noEmit` → exit 0.
Run: `npx jest` → all pass.

- [ ] **Step 3: Dark-mode acceptance screenshots**

Start `npm run dev`. In dark mode, screenshot: `/`, `/login`, `/register`, `/dashboard`, one transaction flow, `/profile`, one group page, `/admin`. Confirm zero white-on-black and consistent green-accent buttons.

- [ ] **Step 4: Light-mode spot check**

Toggle light mode; screenshot `/dashboard` and `/register`. Confirm nothing regressed.

- [ ] **Step 5: Commit any final fixes**

```bash
git commit -am "chore(theme): final consistency sweep"
```

---

## Self-review notes

- **Spec coverage:** tokens (Task 1) ✓, three primitives (Tasks 2–4) ✓, Button destructive (Task 5) ✓, all 72 files migrated across Tasks 6–13 ✓ (auth 9, landing 3, dashboard 7, transaction 15, modals 12, SplitBill 10, admin 3, profile+rest 14 — covers the grep list), light+dark verification (Task 14) ✓.
- **Semantics preserved:** error→destructive, positive→positive, scrims/flags/charts untouched — stated in Global Constraints and per-task steps.
- **Types:** `Input`/`Label`/`PageContainer`/`Button` signatures defined in Tasks 2–5 and consumed unchanged in migration tasks.
