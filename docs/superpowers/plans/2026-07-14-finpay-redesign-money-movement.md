# FinPay "Neon Ledger" Redesign — Money-Movement Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Neon Ledger system to the four money-movement pages — SplitBill, CurrencyConversionPage, ViewScheduledPayments, RequestListPage — so their surfaces read as glass-on-aurora, amounts are mono, statuses are chips, and icons come from lucide.

**Architecture:** Built on the foundation + auth branches. These pages all render inside `Layout`, so the aurora + glass nav are already present. Each task restyles ONE page: glass its floating summary/chrome containers, keep dense lists/rows on solid surfaces, set currency amounts to mono tabular, encode statuses as chips, and swap react-icons for lucide. Submit/action buttons already use the `Button` primitive (glow inherited). Shared `src/components/transaction/*` amount components (Pay, TransferAmount, PaymentReceipt, ExchangeRate, etc.) are OUT OF SCOPE here — they are shared across many flows and get their own follow-up plan; only touch a page's own JSX.

**Tech Stack:** React 19, Tailwind v4, `lucide-react`, existing `.glass` utility + tokens. Package manager: npm. Spec: `DESIGN.md`.

## Global Constraints

- Styling + icon swaps only. Do NOT change data fetching, hooks, state, handlers, effects, pagination, filtering logic, `data-testid`/`data-*`, or any `src/components/transaction/*` or `src/components/SplitBill/*` child component. Restyle only the page file named in each task.
- **Glass = chrome only.** A floating summary card, a filter/search bar, an outer container that sits over the aurora → `.glass`. Dense data (payment rows, request rows, tables, list bodies) STAYS on solid `bg-card`/`bg-surface-2` with `border border-border` for readability. When in doubt, keep it solid.
- Glass recipe: replace a container's `bg-card [border border-border] [shadow-*]` with the single utility `glass`, KEEPING layout classes (flex/grid/rounded/padding/width/gap).
- **Money is mono:** every rendered currency amount gets `font-mono tabular-nums`. Do not change the value, formatting function, or currency code text.
- **Status chips:** render a payment/request status as a pill — `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` plus a semantic tint: pending/scheduled → `bg-warning/15 text-warning`; completed/paid/success → `bg-positive/15 text-positive`; failed/cancelled → `bg-destructive/15 text-destructive`. Never encode status by color alone — keep the status text label.
- No emoji. Icons from `lucide-react`. Swap map: `LiaTimesSolid`→`X`, `FaFilter`→`Filter`, `FaSearch`→`Search`, `MdCancel`→`X`. Size swapped icons `h-5 w-5` (or match the element they replace) and keep each icon's existing `onClick`/position classes. Remove every react-icons import a swap makes unused.
- Body/label copy stays `text-foreground`/`text-muted-foreground`, never lime.
- All existing tests in `frontend/` stay green. From `frontend/`: `./node_modules/.bin/jest` (real result is the `Test Suites:`/`Tests:` summary; ignore a trailing `ℹ tests 0` artifact) and `npm run build`.
- `.design-sync/` untouched.

---

### Task M1: SplitBill — glass the hub surfaces

**Files:**
- Modify: `frontend/src/pages/SplitBill.tsx`

SplitBill is a small hub page (~55 lines) that renders `bg-card` blocks and pulls in `SplitBill/*` children. Restyle only `SplitBill.tsx`; do not touch the child components.

- [ ] **Step 1: Read the file**

Read `frontend/src/pages/SplitBill.tsx` in full. Identify which `bg-card` blocks are chrome (a framing/hero container → glass) vs content the children render (leave to children).

- [ ] **Step 2: Glass the framing containers**

For each `bg-card` block in `SplitBill.tsx` that is a page-level framing container (not a dense list), replace `bg-card` (and any `border border-border`/`shadow-*` on the same element) with `glass`, keeping layout classes. Leave the `rounded-full bg-card w-[250px] h-[250px]` image/avatar element as-is if `bg-card` there is a placeholder fill behind an image — glass on an image tile adds nothing; use judgment and note the call in the report.

- [ ] **Step 3: Verify**

Run: `./node_modules/.bin/jest` → all suites pass.
Run: `npm run build` → succeeds.

- [ ] **Step 4: Commit**

```bash
git add frontend/src/pages/SplitBill.tsx
git commit -m "feat(design): glass SplitBill hub surfaces"
```

---

### Task M2: CurrencyConversionPage — glass card, mono amounts, lucide

**Files:**
- Modify: `frontend/src/pages/CurrencyConversionPage.tsx`

- [ ] **Step 1: Read the file**

Read `frontend/src/pages/CurrencyConversionPage.tsx` in full. Note the `bg-card` conversion card (~line 76), the `LiaTimesSolid` icon usage, and where converted/entered amounts and the exchange rate render.

- [ ] **Step 2: Swap the icon**

Replace `import { LiaTimesSolid } from 'react-icons/lia';` with `import { X } from 'lucide-react';`. Replace every `<LiaTimesSolid ... />` with `<X ... />`, keeping its `onClick` and position classes and adding `h-5 w-5` if it has no size. Remove the react-icons import.

- [ ] **Step 3: Glass the conversion card**

The conversion card wrapper (`bg-card flex flex-col rounded-xl px-6 py-6 gap-2`, ~line 76) is chrome — replace `bg-card` with `glass`, keeping the rest.

- [ ] **Step 4: Mono the amounts**

Every rendered currency amount and the exchange-rate figure gets `font-mono tabular-nums` added to its className. If the amount is inside a component this page imports from `transaction/` (e.g. `ExchangeRate`), do NOT edit that component — only add mono to amounts written directly in `CurrencyConversionPage.tsx`. If none are written directly here, note that in the report.

- [ ] **Step 5: Verify**

Run: `./node_modules/.bin/jest` → pass. `npm run build` → succeeds (a failure usually means a leftover `LiaTimesSolid`).

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/CurrencyConversionPage.tsx
git commit -m "feat(design): glass conversion card, mono amounts, lucide X"
```

---

### Task M3: ViewScheduledPayments — glass chrome, mono amounts, status chips, lucide

**Files:**
- Modify: `frontend/src/pages/ViewScheduledPayments.tsx`

This is the largest page (~339 lines): a search bar, filter control, a paginated list of scheduled payments, and an empty-state card. Read it fully first.

- [ ] **Step 1: Read the file**

Read `frontend/src/pages/ViewScheduledPayments.tsx` in full. Locate: the search input (`bg-card ... rounded-full`, ~line 209), the filter button (`bg-card ... rounded-full`, ~line 216), the empty-state card (`bg-card border border-border p-8 rounded-2xl`, ~line 231), the payment rows/list, each row's amount, and each row's status.

- [ ] **Step 2: Swap icons to lucide**

Replace:
```tsx
import { FaFilter, FaSearch } from "react-icons/fa";
import { MdCancel } from "react-icons/md";
```
with:
```tsx
import { Filter, Search, X } from "lucide-react";
```
Then: `<FaFilter ... />`→`<Filter ... />`, `<FaSearch ... />`→`<Search ... />`, `<MdCancel ... />`→`<X ... />`, each keeping its existing `onClick`/position classes and adding `h-5 w-5` where it had no explicit size. Remove both react-icons imports.

- [ ] **Step 3: Glass the search + filter chrome; keep the list solid**

The search bar and filter button are chrome → replace their `bg-card` with `glass` (keep the `rounded-full` + padding + layout). The empty-state card is a floating message card → `glass` (replace `bg-card border border-border shadow-sm`). The payment ROWS/list body are dense data → leave them on solid `bg-card`/`border border-border` (do not glass them).

- [ ] **Step 4: Mono the amounts**

Every scheduled-payment amount rendered in a row gets `font-mono tabular-nums` on its className.

- [ ] **Step 5: Status chips**

Each scheduled payment's status text becomes a chip per the Global Constraints recipe (scheduled/pending → warning tint, completed → positive, cancelled/failed → destructive), keeping the status label text. If status is currently plain text, wrap it in a `<span>` with the chip classes; do not change how status is derived.

- [ ] **Step 6: Verify**

Run: `./node_modules/.bin/jest` → all suites pass (if a test queried a removed react-icons node or plain-text status, update the selector to match the new markup — never weaken an assertion or change behavior; note any such change in the report).
Run: `npm run build` → succeeds.

- [ ] **Step 7: Commit**

```bash
git add frontend/src/pages/ViewScheduledPayments.tsx
git commit -m "feat(design): glass scheduled-payments chrome, mono amounts, status chips, lucide"
```

---

### Task M4: RequestListPage — glass outer card, mono amounts, status chips

**Files:**
- Modify: `frontend/src/pages/RequestListPage.tsx`

- [ ] **Step 1: Read the file**

Read `frontend/src/pages/RequestListPage.tsx` in full. Note the outer container (`bg-card rounded-2xl p-6 gap-4 shadow-lg`, ~line 91), the per-request cards (`bg-card border border-border rounded-xl p-4`, ~line 103), the amount (`data-testid="requester-amount"`, ~line 112: `{r.amount.toLocaleString()} {r.currency}`), and any request status.

- [ ] **Step 2: Glass the outer container; keep request rows solid**

The outer container (line ~91, the framing card) → replace `bg-card ... shadow-lg` with `glass`, keep layout. The per-request cards (line ~103) are dense repeated data — leave them solid `bg-card border border-border` (they may keep their hover shadow).

- [ ] **Step 3: Mono the amount**

On the `data-testid="requester-amount"` element (line ~112), add `font-mono tabular-nums` to its className. Do not change the value or `data-testid`.

- [ ] **Step 4: Status chips**

If a request renders a status (pending/accepted/declined etc.), convert it to a chip per the Global Constraints recipe, keeping the label text. If there is no status shown, note that in the report and skip.

- [ ] **Step 5: Verify**

Run: `./node_modules/.bin/jest src/pages/__tests__/Request.test.tsx` (if present) then `./node_modules/.bin/jest` → all pass.
Run: `npm run build` → succeeds.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/RequestListPage.tsx
git commit -m "feat(design): glass request-list card, mono amounts, status chips"
```

---

### Task M5: Cluster verification (live)

**Files:** none (verification only)

- [ ] **Step 1: Full suite + build**

From `frontend/`: `./node_modules/.bin/jest` → all suites pass. `npm run build` → succeeds.

- [ ] **Step 2: No dead react-icons in the two files that had them**

Run: `grep -rn "react-icons" frontend/src/pages/CurrencyConversionPage.tsx frontend/src/pages/ViewScheduledPayments.tsx`
Expected: no output.

- [ ] **Step 3: Live both-theme smoke**

Start `npm run dev`. To reach these authenticated pages without a backend, in the browser set a fake session then visit each route:
```js
sessionStorage.setItem('auth-store', JSON.stringify({state:{token:'smoke',userId:'smoke',isAuthenticated:true,isVerified:true,isLocked:false},version:0}));
```
Visit `/splitbill`, `/currency-conversion` (confirm exact paths in `src/Router.tsx`), the scheduled-payments route, and the request-list route. Data calls will error (no backend) — that's fine. In light AND dark confirm: framing cards read as glass over the aurora; payment/request ROWS stay solid and legible; any amounts shown are monospaced; status chips are tinted with visible label text; lucide icons render; no horizontal scroll.

- [ ] **Step 4: design-sync untouched**

Run: `git status .design-sync` → clean.

---

## Self-Review

- **Spec coverage:** glass-on-chrome + solid dense data (all tasks, explicit per page), mono money (M2,M3,M4), status chips (M3,M4), lucide swaps (M2,M3), aurora inherited via Layout, glow inherited via Button. No mono/chip work claimed where a page has none (M1, and the "note it in the report" escapes in M2/M4).
- **Placeholders:** none — exact icon-swap map, exact chip recipe, exact anchor line hints; per-page transforms are read-then-apply against the file (same altitude as the reviewed Dashboard task), not vague directives.
- **Scope:** shared `transaction/*` and `SplitBill/*` children explicitly excluded (own follow-up), so the cluster stays 4 page files.
- **Consistency:** one glass recipe, one chip recipe, one mono rule, one icon map reused across all tasks; matches the conventions already shipped in the foundation + auth clusters.
