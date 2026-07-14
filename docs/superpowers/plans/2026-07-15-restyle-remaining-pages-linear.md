# Restyle Remaining Pages to Linear — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the ~26 pages/modals that still reference the dropped Neon-Ledger `.glass` utility (plus `AuroraBackground` and `play-*` accents) so they match the Linear-inspired design system now on `main` — solid token surfaces, functional emerald accent, mono figures.

**Architecture:** These files survived the merge that replaced the glass redesign with the Linear one, but they still use `.glass` (a translucent-panel utility that no longer exists → currently transparent/degraded) and a few `play-*`/aurora accents. This is a mechanical restyle: apply one shared **Restyle Recipe** (below) that swaps each glass/neon reference for its Linear token equivalent, reusing the existing `ui/` primitives (`Card`, `Button`, `Input`, `Pill`), the tokens in `src/index.css`, `cn()`, and the modal surface convention already established by the redesigned modals (`authenticationModal`/`ConfirmationModal`/`AddCurrencyModal`). No new tokens, no new styling approach.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind v4 (CSS-var tokens), `cn()`, `react-icons` + `lucide-react`, Jest + React Testing Library.

## Global Constraints

- **Reuse the established Linear system.** Prefer semantic token classes (`bg-card`, `bg-panel`, `bg-card2`, `bg-hover`, `border-border`, `border-border-strong`, `text-foreground`, `text-muted-foreground`, `text-subtle`, `text-primary`, `bg-green-tint`, `border-green-tint-border`, `bg-destructive-tint`) over hex. No new tokens; no new utilities.
- **Emerald `#4CC38A` (`--primary`) is functional-only** — primary action, positive value, active/selected. Never a large decorative fill.
- **Money / codes / OTP → `.num`** (mono tabular). main already applied mono to many amounts — keep those.
- **Modals** share ONE surface: scrim `bg-[rgba(6,7,9,.5)] backdrop-blur-sm` + `animate-in fade-in duration-200`; panel `bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)]` + `animate-in zoom-in-95 duration-200`. Match the redesigned `ConfirmationModal.tsx`/`AddCurrencyModal.tsx` exactly.
- **Reuse `cn()`; reuse `ui/` primitives; do not fork them.** Preserve every existing `data-testid`, `aria-label`, route handler, and asserted copy. This is a visual restyle — no logic changes.
- **Verify each task:** `npx tsc --noEmit` clean, `npx vite build` clean, and the task's jest file(s) green. Full baseline is **84/84** (17 suites) — no task may reduce it.

## The Restyle Recipe (apply everywhere — this is the DRY core)

For each occurrence, judge the element the class sits on and replace:

| Current (glass/neon) | Linear replacement | When |
|---|---|---|
| `glass` on a large panel / card / section / empty-state box | `bg-card border border-border` (keep the element's existing `p-*`/`rounded-*`) — or swap the wrapper to the `Card` primitive (`@/components/ui/Card`) when it's a plain card | Panels, cards, empty states |
| `glass` on a **modal dialog surface** | `bg-[#17181C] border border-border-strong rounded-[16px] shadow-[0_30px_70px_-25px_rgba(0,0,0,.8)]` and ensure the scrim is `bg-[rgba(6,7,9,.5)] backdrop-blur-sm` (add if missing) | Modal container divs |
| `glass` on an **input / search field** | `bg-card2 border border-border-strong` (matches the `Input` primitive) — or replace the raw input with the `Input` primitive | Text/search inputs |
| `glass` on a **pill / chip / filter button** | `bg-card2 border border-border-strong hover:bg-hover` (matches `Button variant="secondary"`) | Small buttons/chips |
| `<AuroraBackground />` + its import | Delete both; the page sits on `bg-background` | ResetPassword only |
| `text-play-violet` / `text-play-cyan` / `from-play-*` / `to-play-*` / `bg-surface-2` | `text-muted-foreground` (decorative text) / `text-primary` (if it was an accent CTA) / `bg-card2` (surface-2) | Stray neon accents |
| any `glow`/`neon` utility (none currently found in `.tsx`, but if encountered) | remove it | — |

Rules while applying:
- **Keep** all sibling layout classes (`p-*`, `rounded-*`, `flex`, `gap-*`, `w-*`, etc.) — only replace the glass/neon token.
- **Keep** main's mono amounts (`.num`) and status chips; if a status chip uses ad-hoc colors, prefer the `Pill` primitive with `tone` (`positive`/`warning`/`destructive`/`neutral`) — optional, only where trivially swappable.
- **Preserve** every `data-testid`, `aria-label`, and visible text string exactly.

**Reference the recipe from each task — do not restate it.** Each task below lists only its files + exact `glass` line numbers + any file-specific note.

## File Structure (files touched, grouped by task)

- T1 modals: `components/modal/{SuccessfulTransferModal,SuccessfulRequestModal,SuccessfulTopupModal,FailedTransferModal,FailedRequestModal,ScheduledPayment,HistoryFilterModal}.tsx`
- T2 history: `pages/History.tsx`, `pages/GroupHistory.tsx`
- T3 groups: `pages/{GroupPage,ManageGroup,CreateGroup,GroupInvite,SplitBill}.tsx`
- T4 wallets/money: `pages/{MultiWallet,CurrencyWalletPage,CurrencyConversionPage}.tsx`
- T5 misc: `pages/{ProfilePage,Notification,ChallengesList,AdminPage,RequestListPage,ViewScheduledPayments}.tsx`
- T6 auth/entry: `pages/{ForgotPassword,ResetPassword,LandingPage}.tsx`
- T7 cleanup: `src/index.css`, `components/ui/AuroraBackground.tsx`, `components/ui/__tests__/aurora.test.tsx` (only if unreferenced after T1–T6)

---

## Task 1: Restyle the remaining modals to the Linear modal surface

**Files (glass at these lines):**
- `src/components/modal/SuccessfulTransferModal.tsx:25`
- `src/components/modal/SuccessfulRequestModal.tsx:29`
- `src/components/modal/SuccessfulTopupModal.tsx:20`
- `src/components/modal/FailedTransferModal.tsx:15`
- `src/components/modal/FailedRequestModal.tsx:17`
- `src/components/modal/ScheduledPayment.tsx:36`
- `src/components/modal/HistoryFilterModal.tsx:110`

**Note:** Each of these has ONE `glass` on its dialog surface. Apply the **modal** row of the recipe: swap `glass` → the `#17181C` surface tokens, and verify each file's scrim is `bg-[rgba(6,7,9,.5)] backdrop-blur-sm` (add if a different/absent scrim). Keep every testid/aria-label (e.g. HistoryFilterModal is exercised by History.test). Success modals use green accents only on the confirmation check/icon — keep functional. Read each file, don't assume identical structure.

- [ ] **Step 1:** Apply the recipe to all 7 modal files (surface + scrim). Preserve testids/handlers/copy.
- [ ] **Step 2:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 3:** Run the suites that render these modals: `npx jest src/pages/__tests__/History.test.tsx src/pages/__tests__/Transfer.test.tsx src/pages/__tests__/Request.test.tsx` — all green.
- [ ] **Step 4:** Commit: `style(modals): Linear surface for success/failure/scheduled/filter modals`

---

## Task 2: History + GroupHistory

**Files (glass lines):**
- `src/pages/History.tsx:159` (search input), `:166` (filter button/chip), `:181` (empty-state panel)
- `src/pages/GroupHistory.tsx:159`, `:166`, `:181` (same three contexts — this page mirrors History)

**Note:** Apply the **input**, **pill/button**, and **panel** recipe rows respectively. `History.tsx:159` is a rounded-full search input → `bg-card2 border border-border-strong` (keep `rounded-full`). `:166` is a filter button → secondary style. `:181` is an empty-state card → `bg-card border border-border`. Keep main's mono amounts + status chips + the `history-header`/`history-timeline`/`history-filters-button`/`search-email-input` testids.

- [ ] **Step 1:** Apply recipe to both files (3 contexts each).
- [ ] **Step 2:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 3:** `npx jest src/pages/__tests__/History.test.tsx` — green (GroupHistory has no test suite; covered by build).
- [ ] **Step 4:** Commit: `style(history): Linear chrome for History + GroupHistory`

---

## Task 3: Groups cluster

**Files (glass lines):**
- `src/pages/GroupPage.tsx:194`, `:228` (two panels)
- `src/pages/ManageGroup.tsx:113` (panel)
- `src/pages/CreateGroup.tsx:66` (form card)
- `src/pages/GroupInvite.tsx:60` (form card)
- `src/pages/SplitBill.tsx:42` (hub surface)

**Note:** All are panels/cards/forms → `bg-card border border-border` (or `Card`). `Groups.test` navigates to `/groups` (GroupPage) and SplitBill — keep any testids/copy those assert. `SplitBill.tsx` also uses `request.jpg`/`mock_history.jpg` images (leave the images; only restyle the `glass` surface).

- [ ] **Step 1:** Apply the panel recipe to all 5 files.
- [ ] **Step 2:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 3:** `npx jest src/pages/__tests__/Groups.test.tsx` — green.
- [ ] **Step 4:** Commit: `style(groups): Linear surfaces for group pages + SplitBill`

---

## Task 4: Wallets / money-movement pages

**Files (glass lines):**
- `src/pages/MultiWallet.tsx:8` (has a test)
- `src/pages/CurrencyWalletPage.tsx` (glass at the summary card; also renders the redesigned `ConfirmationModal` — leave that modal alone)
- `src/pages/CurrencyConversionPage.tsx:76`

**Note:** Panels/summary cards → `bg-card border border-border`; keep mono balances (`.num`). `CurrencyWalletPage` consumes `ConfirmationModal` (already Linear) — do not touch the modal, only the page's own `glass` surface. `MultiWallet.test` asserts wallet content — preserve testids/copy.

- [ ] **Step 1:** Apply the panel recipe to all 3 files.
- [ ] **Step 2:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 3:** `npx jest src/pages/__tests__/MultiWallet.test.tsx` — green.
- [ ] **Step 4:** Commit: `style(wallets): Linear surfaces for wallet + conversion pages`

---

## Task 5: Misc pages

**Files (glass lines):**
- `src/pages/ProfilePage.tsx:456`, `:742` (has a test)
- `src/pages/Notification.tsx:41`
- `src/pages/ChallengesList.tsx:355`, `:363`
- `src/pages/AdminPage.tsx:91`
- `src/pages/RequestListPage.tsx` (glass surface; also has the `new-request-button` added earlier — keep it)
- `src/pages/ViewScheduledPayments.tsx:208`, `:215`, `:230`

**Note:** All panels/cards → `bg-card border border-border`. `ChallengesList` may also have `play-*` accents on tab icons — map per recipe (`text-muted-foreground`/`text-primary`). `ProfilePage.test` and the admin/notification flows assert testids/copy — preserve. `AdminPage` inherits the user sidebar (known, out of scope here) — only restyle its `glass` surface.

- [ ] **Step 1:** Apply the panel recipe (+ `play-*` mapping where present) to all 6 files.
- [ ] **Step 2:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 3:** `npx jest src/pages/__tests__/ProfilePage.test.tsx` — green.
- [ ] **Step 4:** Commit: `style(misc): Linear surfaces for profile/notification/challenges/admin/requests/scheduled`

---

## Task 6: Auth / entry pages (remove aurora)

**Files (glass lines):**
- `src/pages/ForgotPassword.tsx:72` (card)
- `src/pages/ResetPassword.tsx:81` (card) + `import { AuroraBackground }` (line 8) and `<AuroraBackground />` (line 80) — **remove both**; page sits on `bg-background`
- `src/pages/LandingPage.tsx:124` (card/section)

**Note:** These three surfaces are the last aurora/glass holdouts on entry pages, which should match the redesigned Login/Register (`bg-background`, `bg-card border border-border` cards). All three have tests — preserve testids/copy (e.g. LandingPage's login/register nav, ForgotPassword's cooldown/submit).

- [ ] **Step 1:** Apply the card recipe to all 3; delete the `AuroraBackground` import + usage in ResetPassword.
- [ ] **Step 2:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 3:** `npx jest src/pages/__tests__/ForgotPassword.test.tsx src/pages/__tests__/ResetPassword.test.tsx src/pages/__tests__/LandingPage.test.tsx` — all green.
- [ ] **Step 4:** Commit: `style(auth): Linear cards for forgot/reset/landing; drop AuroraBackground`

---

## Task 7: Cleanup dead glass/aurora artifacts

**Files:**
- `src/components/ui/AuroraBackground.tsx`, `src/components/ui/__tests__/aurora.test.tsx`
- `src/index.css`

**Note:** After T1–T6, verify nothing references the neon-ledger leftovers, then remove them. This is guarded — only delete what grep proves unused.

- [ ] **Step 1: Confirm AuroraBackground is unreferenced.** Run: `grep -rn "AuroraBackground" src --include=*.tsx | grep -v "ui/AuroraBackground.tsx"`. Expected: only `aurora.test.tsx`. If so, delete `src/components/ui/AuroraBackground.tsx` and `src/components/ui/__tests__/aurora.test.tsx`. If any page still imports it, STOP and restyle that page first.
- [ ] **Step 2: Confirm neon tokens are unreferenced.** Run: `grep -rnE "glass|play-violet|play-cyan|surface-2" src --include=*.tsx`. Expected: no matches. Then remove the now-dead vars from `src/index.css`: `--glass`, `--glass-line`, `--glass-shadow` (`:root`), `--surface-2`, `--play-violet`, `--play-cyan` (both `:root` and `@theme inline` `--color-surface-2`/`--color-play-violet`/`--color-play-cyan`). Leave everything else untouched.
- [ ] **Step 3:** `npx tsc --noEmit && npx vite build` — clean.
- [ ] **Step 4:** `npx jest` full suite — expected 16 suites / 83 tests (aurora.test.tsx removed). No other suite may drop.
- [ ] **Step 5:** Commit: `chore(cleanup): remove unused AuroraBackground + neon-ledger tokens`

---

## Final verification

- [ ] `grep -rn "glass\|AuroraBackground\|play-violet\|play-cyan\|surface-2" src --include=*.tsx` → **zero** matches.
- [ ] `npx tsc --noEmit && npx vite build` — clean.
- [ ] `npx jest` — all suites green (83 tests after aurora removal).
- [ ] `/run` the app and click through History, Groups, Profile, a success modal, ResetPassword — surfaces are solid Linear cards, emerald used only as accent, no transparent/borderless panels, no aurora backdrop.

## Self-review notes

- **Coverage:** all 33 `.glass` occurrences (7 modals in T1; History/GroupHistory in T2; 5 group files in T3; 3 wallet files in T4; 6 misc files in T5; 3 auth files in T6) + the sole `AuroraBackground` usage (T6) + `play-*`/`surface-2` accents (mapped in-task, dead tokens removed in T7). Nothing left unassigned.
- **No placeholders:** the Restyle Recipe carries the exact class replacements; each task carries exact file:line targets.
- **Consistency:** every task pulls from the same recipe + the same modal-surface constant, so the result reads as one system.
- **Risk:** purely visual, className-level; logic/testids/copy preserved, so the jest suites are the safety net at each step.
