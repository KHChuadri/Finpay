# FinPay "Neon Ledger" Redesign — Wallets Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply the Neon Ledger system to the two wallet pages — MultiWallet and CurrencyWalletPage.

**Architecture:** Built on the foundation + auth + money-movement work. Both pages render inside `Layout` (aurora + glass nav present). Restyle only the page files; do not touch child components. Mirrors the already-shipped Dashboard treatment (glass summary, mono balance, lucide feature-colored action icons).

**Tech Stack:** React 19, Tailwind v4, `lucide-react`, existing `.glass` utility + tokens. npm. Spec: `DESIGN.md`.

## Global Constraints

- Styling + icon swaps only. No change to data fetching, hooks, state, handlers, effects, `data-testid`, or any child component.
- Glass = chrome only (framing/summary cards). Circular action buttons and dense content stay solid `bg-card`.
- Glass recipe: replace a framing container's `bg-card [border ...] [shadow-*]` with `glass`, keep layout classes.
- Wallet balance and any currency amount → `font-mono tabular-nums` (value/format unchanged).
- No emoji. Icon swap map (lucide): `FaArrowUp`→`ArrowUp`, `FaArrowDown`→`ArrowDown`, `FaArrowRightArrowLeft`→`ArrowLeftRight`, `FaPeopleArrows`→`Users`, `FaTimes`→`X`. Keep each icon's `onClick`/size/position classes; remove every react-icons import made unused.
- Feature-color action icons consistent with Dashboard: convert/currency → `text-play-cyan`; deposit/up & withdraw/down → keep neutral or `text-foreground`; split/people → `text-primary`. Keep circular buttons on solid `bg-card`.
- Body/label copy stays `text-foreground`/`text-muted-foreground`, never lime.
- Existing tests stay green. From `frontend/`: `./node_modules/.bin/jest` (real result = `Test Suites:`/`Tests:` line; ignore trailing `ℹ tests 0` artifact) and `npm run build`.
- `.design-sync/` untouched.

---

### Task W1: MultiWallet — glass framing

**Files:** Modify `frontend/src/pages/MultiWallet.tsx`

- [ ] **Step 1:** Read `frontend/src/pages/MultiWallet.tsx` in full (it is ~18 lines and wraps a wallet component).
- [ ] **Step 2:** The framing block `<div className="bg-card p-4 shadow w-fit">` is chrome — replace `bg-card` and `shadow` with `glass`, keeping `p-4 w-fit`. If that block is purely a passthrough wrapper around a child that renders its own card, note it in the report and glass only the outermost framing element (do not double-glass).
- [ ] **Step 3:** Verify: `./node_modules/.bin/jest` → all pass; `npm run build` → succeeds.
- [ ] **Step 4:** Commit:
```bash
git add frontend/src/pages/MultiWallet.tsx
git commit -m "feat(design): glass MultiWallet framing"
```

---

### Task W2: CurrencyWalletPage — glass summary, mono balance, lucide feature icons

**Files:** Modify `frontend/src/pages/CurrencyWalletPage.tsx`

- [ ] **Step 1:** Read `frontend/src/pages/CurrencyWalletPage.tsx` in full. Locate: the wallet balance display, the circular action buttons (`bg-card rounded-full w-16 h-16 ...`, ~line 205), and every react-icons usage.
- [ ] **Step 2: Swap icons.** Replace:
```tsx
import { FaArrowUp, FaArrowDown, FaPeopleArrows, FaTimes } from "react-icons/fa";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
```
with:
```tsx
import { ArrowUp, ArrowDown, Users, X, ArrowLeftRight } from "lucide-react";
```
Then swap every usage: `FaArrowUp`→`ArrowUp`, `FaArrowDown`→`ArrowDown`, `FaPeopleArrows`→`Users`, `FaTimes`→`X`, `FaArrowRightArrowLeft`→`ArrowLeftRight`. Preserve each element's `onClick`/size/position classes (add `h-5 w-5` only where an icon had no size). Remove both react-icons imports.
- [ ] **Step 3: Mono the balance.** Add `font-mono tabular-nums` to the wallet balance amount's className (value/currency text unchanged).
- [ ] **Step 4: Feature-color the action icons.** convert (`ArrowLeftRight`) → add `text-play-cyan`; split/people (`Users`) → add `text-primary`; up/down keep `text-foreground`. Keep the circular action buttons on solid `bg-card` (do NOT glass them).
- [ ] **Step 5: Glass the summary card (if present).** If the page has a framing balance/summary container on `bg-card` (not a circular button, not a dense list), glass it (`bg-card ... shadow-*` → `glass`, keep layout). If there is no such framing container, note it in the report and skip.
- [ ] **Step 6: Verify.** `./node_modules/.bin/jest` (update only a selector if markup moved — never weaken/behavior) → all pass; `npm run build` → succeeds (a failure usually means a leftover react-icons reference).
- [ ] **Step 7: Commit:**
```bash
git add frontend/src/pages/CurrencyWalletPage.tsx
git commit -m "feat(design): glass currency-wallet summary, mono balance, lucide feature icons"
```

---

### Task W3: Cluster verification (live)

**Files:** none.

- [ ] **Step 1:** `./node_modules/.bin/jest` → all suites pass; `npm run build` → succeeds.
- [ ] **Step 2:** `grep -rn "react-icons" frontend/src/pages/CurrencyWalletPage.tsx` → no output.
- [ ] **Step 3:** Live smoke (fake session, both themes): start `npm run dev`, set `sessionStorage['auth-store']` = `{"state":{"token":"smoke","userId":"smoke","isAuthenticated":true,"isVerified":true,"isLocked":false},"version":0}`, visit `/multiwallet` and a currency-wallet route (confirm paths in `src/Router.tsx`). Confirm in light + dark: framing cards read as glass on the aurora, balance is monospaced, action icons are lucide with feature colors, circular buttons stay solid, no horizontal scroll. Data will error without a backend — fine.
- [ ] **Step 4:** `git status .design-sync` → clean.

---

## Self-Review
- Coverage: glass framing (W1, W2), mono balance (W2), lucide + feature colors (W2), aurora/glow inherited. No mono/chip claimed where absent (W1).
- Placeholders: none — exact icon map, exact anchors, read-then-apply per page.
- Scope: 2 page files only; children excluded.
- Consistency: same glass/mono/icon conventions as prior clusters; action-icon colors match Dashboard.
