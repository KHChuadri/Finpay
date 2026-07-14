# Handoff: Finpay — Linear-inspired redesign (Dashboard, Auth, Modals, Components)

## Overview
A darker, quieter, production-grade redesign of Finpay's core surfaces, inspired by Linear but kept a touch warmer and friendlier. It replaces the current stacked-photo dashboard, floating auth card, and over-decorated modals with a real app shell, a restrained typographic system, and the Finpay green demoted from a fill color to a **functional accent** (primary action, positive value, active/selected state).

Each surface below ships **3 alternative directions** (e.g. `1a`, `1b`, `1c`). These are options to choose between, not screens to build all of — pick one per surface (or mix, as noted) and implement that.

## About the Design Files
The single file in this bundle — `Finpay Redesign.dc.html` — is a **design reference created in HTML**. It is a prototype showing intended look, layout, and behavior. It is **not production code to copy directly** (it uses inline styles, a small preview scaffold, and a canvas viewer for presentation).

The task is to **recreate these designs inside the existing Finpay frontend** (`frontend/`) — React 19 + TypeScript + Vite + Tailwind v4 — using its established patterns: the CSS-variable token system in `src/index.css`, the `cn()` helper (`src/lib/utils.ts`), and the existing primitives in `src/components/ui/` (`Button.tsx`, `Input.tsx`, `Label.tsx`, `Card.tsx`). Do **not** introduce a new styling approach; extend the current one.

Good news: the redesign was built on the app's **existing dark-mode tokens**, so most values below already exist as CSS variables. Where a value is new, it's called out.

## Fidelity
**High-fidelity.** Final colors, typography, spacing, radii, and interaction states are specified. Recreate the UI faithfully using the codebase's Tailwind tokens and `ui/` components. Exact hex values are given so you can confirm/extend the token set, but prefer the semantic Tailwind classes (`bg-card`, `border-border`, `text-muted-foreground`, etc.) over hardcoded hex.

---

## Design Tokens

The redesign renders in **dark mode**. These map onto the existing variables in `src/index.css` under `.dark` — reuse them. A few tuned values are marked **(new/tuned)**; decide whether to update the token or keep the current one.

### Colors (dark theme)
| Role | Redesign hex | Existing `.dark` var | Tailwind class |
|---|---|---|---|
| App background | `#0B0C0E` | `--background: #0B0D11` (close; **tuned** slightly warmer/darker) | `bg-background` |
| Panel (sidebar/nav/table header) | `#0E0F12` | — (**new**, sits between bg and card) | — add `--panel` |
| Card surface | `#141518` | `--card: #12151B` (close; **tuned**) | `bg-card` |
| Elevated / hover-fill | `#191A1E` / `#1E1F24` | `--secondary/--muted: #1E232C`, hover | `bg-secondary` |
| Border (hairline) | `#24262C` | `--border: #1E232C` (**tuned** slightly lighter) | `border-border` |
| Border strong | `#31343B` | `--border-strong: #262D38` (**tuned**) | `border-border-strong` |
| Text primary | `#ECEDEE` | `--foreground: #E7EBF2` | `text-foreground` |
| Text muted | `#9A9FA8` | `--muted-foreground: #9AA4B2` | `text-muted-foreground` |
| Text subtle | `#666B74` | `--subtle: #616B7A` | `text-subtle` |
| **Accent green** | `#4CC38A` | `--primary` is `#B6FF3B` (lime) → **change**: the redesign uses a softer emerald `#4CC38A`, not the neon lime. Recommend retuning `--primary`/`--ring` in dark mode to `#4CC38A`. | `bg-primary`, `text-primary`, `ring-ring` |
| Accent green (hover) | `#57D197` | — | — |
| Accent green (border) | `#3DAE79` | — | — |
| Green tint bg | `rgba(76,195,138,.13)` | — (**new**, for badges/selected rows) | — |
| Green tint border | `rgba(76,195,138,.34)` | — (**new**) | — |
| Primary-foreground (on green) | `#08130C` | `--primary-foreground: #0B0D11` | `text-primary-foreground` |
| Destructive | `#EE6A60` | `--destructive: #F87171` (**tuned** softer) | `text-destructive` |
| Destructive tint bg / border | `rgba(238,106,96,.12)` / `rgba(238,106,96,.32)` | — (**new**) | — |
| Warning / amber | `#E0A24E` | `--warning: #F59E0B` (**tuned**) | `text-warning` |

> **Key brand decision:** dark mode currently uses neon lime `#B6FF3B` as `--primary`. The redesign deliberately swaps this for a softer emerald `#4CC38A` and uses it sparingly. This is the single most important token change — apply it to `--primary`, `--sidebar-primary`, and `--ring` in `.dark`.

### Typography
- **Sans:** `Inter` (already the app font via `--font-sans`). Weights used: 400, 450, 500, 600, 700. Global `letter-spacing: -0.01em`; headings tighter (`-0.02em` to `-0.035em`). Keep the existing `font-feature-settings: 'cv11','ss01'`.
- **Mono (new):** `JetBrains Mono` for **all monetary values, codes, keyboard hints, and OTP digits**, with `font-feature-settings: 'tnum'` (tabular figures) and `letter-spacing: -0.02em`. Add a `--font-mono` token and a `.num` utility. Load via Google Fonts alongside Inter.
- Scale used: hero balance 38–44px/600; section titles 13–16px/600; body 12.5–14px/400; labels/meta 10.5–12px; mono badges/kbd 10px.

### Spacing / radius / elevation
- Radius: cards/modals `14–16px`, buttons/inputs/list-rows `9–11px`, pills `20px`, small tokens `5–7px`. (App `--radius` is `0.625rem` ≈ 10px — consistent.)
- Borders are **1px hairlines**; depth comes from borders + layered surfaces, **not** heavy shadows. Modals use one soft shadow: `0 30px 70px -25px rgba(0,0,0,.8)`. Cards use `0 20px 50px -30px rgba(0,0,0,.8)` at most.
- Focus ring: `1px solid #4CC38A` border + `0 0 0 3px rgba(76,195,138,.13)` glow. Error focus uses the destructive equivalents.

---

## Screens / Views

### 1 · Dashboard (`src/pages/Dashboard.tsx`, `src/components/Layout.tsx`, `src/components/dashboard/*`)
Replaces the current stacked full-width photo sections + oversized circular action buttons. **Photos (`request.jpg`, `transaction.png`) are dropped.** Three directions:

- **`1a` Sidebar workspace (recommended default).** Full app shell.
  - **Left sidebar, 236px**, `bg-panel`, right hairline border. Contents top→bottom: workspace switcher (28px green rounded-square "F" logo mark + "Finpay" + chevron); a **Search button** (`Search … ⌘K`); nav list (Home active, Wallets, Transactions, Requests w/ count badge `3`, Groups) — active item has `bg-card2` fill + green icon, others muted with hover fill; a `WALLETS` mono section label + mini wallet rows (2-letter country chip + code + right-aligned mono balance); pinned to bottom, a user card (gradient avatar "JD", name, green "Verified" dot, kebab).
  - **Main area:** 56px top bar (page title "Home" left; bell icon-button + green "New transfer" button right). Scrolling content, 22px padding, 18px gap:
    1. **Balance hero** card (`linear-gradient(180deg, card, panel)`, hairline border, 14px radius, 22px pad): "Total balance" label, `$12,480.50` at 38px/600 mono + "AUD", a green `+2.4%` pill (`bg` green-tint, green-tint border) + "vs last month". On the right, **4 compact quick actions** (Send / Deposit / Withdraw / Convert) as 44px rounded-square icon buttons with labels beneath — hover turns border + icon green. (These replace the old 80px circles.)
    2. **Wallets grid**, `repeat(3,1fr)`, 12px gap: wallet cards (country chip + code + change pill; 20px mono balance; currency name; 22px sparkline `<svg><polyline>`, green if up else subtle). Last cell = dashed "Add wallet" tile, hover green.
    3. **Recent activity table**: header row in `bg-panel` with mono uppercase column labels (`DESCRIPTION / TYPE / DATE / AMOUNT`, grid `1fr 110px 120px 130px`); rows with a 30px rounded-square type icon (green tint for incoming), description + subline, a neutral type pill, date, right-aligned mono amount (green `+`, plain `−`).

- **`1b` ⌘K-forward, single column (720px).** Slim top bar (logo, inline nav, bell + avatar). Balance + wallet chips + a simple activity list — shown **dimmed/blurred behind an open command palette**. The palette is the hero interaction: 520px centered dialog, search input with a live caret, `ACTIONS` group (Send a transfer highlighted with green-tint selected row + `↵`, Deposit, Convert), `RECENT RECIPIENTS` group. Treat the palette as a real global `⌘K` component.

- **`1c` Two-pane workspace.** 64px **icon-only** left rail + main column + a **300px docked activity feed** on the right (`bg-panel`, "Activity" header with "3 today" pill, grouped TODAY/YESTERDAY rows). Main: greeting header + wide search/`⌘K` field; big 44px balance; 2-col wallet cards with larger sparklines; dashed "Add another wallet" full-width button.

### 2 · Login & Register (`src/pages/Login.tsx`, `Register.tsx`, `src/components/LoginForm.tsx`, `RegisterForm.tsx`)
Replaces the lone `w-3/4 md:w-1/2 lg:w-1/4` floating card.

- **`2a` Login, split brand panel (900×560).** Left 360px gradient panel (`linear-gradient(165deg,#101512,#0B0C0E)`): logo top, and bottom a 26px/600 headline "Money that moves at your pace.", supporting paragraph, two feature pills. Right: centered 320px form — "Welcome back", a **passkey** button first, an "or" divider, Email field (with mail icon, prefilled example), Password field shown in **focus state** (green ring) with eye toggle + "Forgot?" link, green "Sign in" button, "Create an account" footer.
- **`2b` Register, focused single column (440×640).** Logo, "Create your account" / "Free forever. No card required.", paired **First/Last name** row, Email, Password (focus ring, eye toggle), then a **live password-strength meter**: 4 segment bars (3 green + 1 muted = "good") and a requirement checklist (`8+ characters`, `Upper & lowercase`, `Number` met in green with checks; `One symbol` unmet in subtle). Full-width "Create account", Terms/Privacy microcopy. This replaces the current wall-of-text regex error string.
- **`2c` Minimal, keyboard-first (440×560).** Centered 300px card on a **dotted radial-grid background**; 44px green logo tile, "Sign in to Finpay", email + password fields, a green "Continue" button with an inline `↵` key hint, and "Create account · Reset password" split links.

### 3 · Two-factor / OTP modal (`src/components/modal/authenticationModal.tsx`)
Replaces the big lock illustration + heavy shadow. All are centered dialogs on a `rgba(6,7,9,.5)` + blur scrim, 16px radius, `#17181C` surface, `--border-strong` border.

- **`3a` Quiet centred (376px).** Small green-tint **lock badge** (not a big illustration) + close button; "Verify it's you" / "Enter the 6-digit code we sent to j•••@acme.io"; **6 segmented inputs** (filled = green ring; active = blinking caret; empty = plain); green "Verify code"; "Resend in 24s".
- **`3b` Device context (390px).** Header band with mail icon + "Two-factor authentication" + "Sent to … · check spam". Codes **grouped 3 + 3** with a separator dash. "Verify & continue" + "Resend code" / "Use another method".
- **`3c` Single-field, autofill (360px).** A **countdown ring** (SVG progress circle, "24" inside), "Enter your code", one wide mono field with big letter-spacing + caret ("417|"), a "Paste supported" hint, green "Verify".

Behavior to preserve from current impl: auto-advance on digit entry, backspace-to-previous, arrow-key nav, full-string paste, auto-submit on 6th digit, resend timer/disabled state, verifying spinner.

### 4 · Confirmation / destructive modal (`src/components/modal/ConfirmationModal.tsx`)
Replaces the red-triangle + 2xl-bold "Close Balance" dialog. Same scrim/surface as §3.

- **`4a` Calm confirm (376px).** Neutral by default — a small **destructive-tint trash badge**, "Close AUD wallet?", consequence paragraph, and a **summary row** showing "Balance moving to USD · $9,240.50". Footer: neutral "Cancel" + destructive-fill "Close wallet". Destructive color appears **only** on the primary action.
- **`4b` Type-to-confirm (376px).** For irreversible actions: "Delete account", consequence text, a `Type DELETE to confirm` field (mono, caret), and a **disabled** destructive button until the text matches.
- **`4c` Inline banner (non-modal).** Slides in bottom of the page for low-stakes reversible actions: trash badge + "Cancel 'Gym → FitCo'?" + subline, with "Keep" (ghost) and "Cancel it" (destructive) buttons. Pair with a 5s undo toast.

### 5 · Add currency / wallet modal (`src/components/modal/AddCurrencyModal.tsx`, `src/components/transaction/Currencies.tsx`)
Replaces the current search-over-divided-list. Same scrim/surface as §3.

- **`5a` Searchable list (388px, recommended).** Sticky header (title + close) + search field ("Search currency or country…"). Scroll body with a `POPULAR` group and `ALL CURRENCIES` group; each row = 2-letter country chip + name + code + a **radio dot** (filled green + check when selected; selected row gets green-tint fill/border). Footer: "Add USD wallet" reflecting the selection. Keep the existing filter logic (matches label/code/countryCode) and `react-country-flag` (swap the placeholder 2-letter chips for real flags).
- **`5b` Currency tiles (388px).** 2-col grid of selectable tiles (flag chip + code + name; selected = green ring + corner check). Best for a short supported set.
- **`5c` Command-menu combobox (392px).** Reuses the `⌘K` visual language: filter input with caret ("doll|"), result rows with the **matched substring bolded green**, selected row highlighted with `↵`, footer with `↑↓ Navigate · ↵ Add · N results`. Arrow-key + enter driven.

### 6 · Core components (`src/components/ui/*`)
Retune the existing primitives — don't fork them.
- **Buttons** (`Button.tsx`): keep the `primary | ghost | destructive` variants; add `secondary`. Primary = green fill + `--greend` border + `#08130C` text, hover `#57D197`. Secondary = `card2` fill + strong border, hover green border. Ghost = transparent, hover `bg-hover`. Destructive = **tint** style (`redbg`/`redbd`/`red` text), not solid red, except on confirm dialogs. Sizes sm/md/lg (30/36/42px), disabled at 45% opacity, loading = spinner + label.
- **Inputs** (`Input.tsx`): 38px, `card2` fill, strong hairline border, 9px radius; focus = green ring; error = destructive ring + inline message with a small alert icon; leading-icon variant.
- **Wallet card / badges / controls:** wallet card as in §1; type pills (neutral `card2` + border) and status pills (green Verified / amber Pending / red Locked, each with a leading dot); a 34×20 toggle (green on / muted off); `⌘ K` keyboard-key tokens (mono, `card2`, hairline border).

---

## Interactions & Behavior
- **Navigation:** sidebar/rail items route via `react-router` (`useNavigate`) — reuse the existing routes (`/dashboard`, `/transfer/recipient`, `/deposit`, `/withdraw`, `/conversion`, `/history`, `/request/list`, `/groups`, `/profile`, `/notification`).
- **Quick actions** map to the current handlers in `Dashboard.tsx` (Send→`/transfer/recipient`, Deposit→`/deposit`, Withdraw→`/withdraw`, Convert→`handleConvertNavigation`).
- **Command palette (`1b`, and `5c` pattern):** open on `⌘K`/`Ctrl+K`; `↑↓` to move, `↵` to run, `Esc` to close; filter as you type. New component — suggest `src/components/CommandPalette.tsx` using the existing `command.tsx` (cmdk) already in `ui/`.
- **Hover/active/focus:** every interactive element has an explicit hover (border→strong or green, or `bg-hover` fill); buttons keep the existing `active:translate-y-px`; focus states use the green ring described in tokens.
- **Transitions:** `transition-colors` on hover; modal enter = fade + `zoom-in-95` ~200ms (match the current `animate-in` usage in `authenticationModal.tsx`); `4c` banner = slide-in from bottom.
- **Number animation:** keep `CountUp` (`ui/CountUp.tsx`) on the balance hero.
- **Idle-timeout warning** banner from `Layout.tsx` stays; restyle to the new token set.

## State Management
No new global stores required — reuse existing Zustand stores (`authStore`, `transactionStore`, `otpStore`, `darkModeStore`, etc.). New **local** UI state only:
- Command palette: `open`, `query`, `activeIndex`.
- OTP modal: existing `otp[]`, `isSubmitting`, resend timer (already in `otpStore`).
- Type-to-confirm (`4b`): `confirmText` gating the destructive button.
- Add-currency: existing `searchTerm`, `selectedCurrency`.
- These redesigns are **dark-mode**; verify against `darkModeStore`. If light mode must be supported, derive light equivalents of the new tokens (`--panel`, tint colors) too.

## Assets
- **Logo:** existing `public/Finpay.png` / `public/FinpayDarkMode.png`. The mocks use a text/monogram "F" tile as a placeholder — swap in the real logo. Keep the dark-mode logo in dark surfaces.
- **Flags:** use the existing `react-country-flag` (already a dependency) / `FlagGetter.tsx`; the 2-letter colored chips in the mocks are placeholders.
- **Icons:** the mocks use simple inline SVGs. In-app, prefer the icon libraries already imported (`react-icons`, `lucide-react`) with equivalent glyphs (send, arrow-up/down, swap, plus, search, bell, lock, mail, eye, trash, check, chevrons, kebab).
- **Fonts:** add **JetBrains Mono** (Google Fonts) next to the existing Inter import in `index.css`.
- **Photos removed:** `public/request.jpg`, `public/transaction.png`, `src/assets/mock_history.jpg` are no longer used by the dashboard.

## Screenshots
Rendered PNGs of each direction are in `screenshots/` for quick visual reference (the HTML file is the source of truth for exact values):
- `1a-dashboard-sidebar.png`, `1b-dashboard-command-palette.png`, `1c-dashboard-two-pane.png`
- `2a-login-split.png`, `2b-register.png`, `2c-login-minimal.png`
- `3-otp-modals.png`, `4-confirmation-modals.png`, `5-add-currency-modals.png`, `6-core-components.png`

## Files
- **Design reference (this bundle):** `Finpay Redesign.dc.html` — open in a browser to see all 18 directions on a pan/zoom canvas. Each option has a visible id badge (`1a`…`6b`). `screenshots/` holds static PNGs of each.
- **Target files to modify in `frontend/`:**
  - `src/index.css` — retune `.dark` tokens (esp. `--primary` → `#4CC38A`), add `--panel`, tint colors, `--font-mono`, `.num` utility.
  - `src/components/Layout.tsx` — new app-shell (sidebar/rail + top bar) for `1a`/`1c`.
  - `src/pages/Dashboard.tsx` + `src/components/dashboard/{CurrencyWallet,HeaderButtons,ListGroup,FlyoutLink}.tsx` — dashboard rebuild.
  - `src/pages/{Login,Register}.tsx` + `src/components/{LoginForm,RegisterForm}.tsx` — auth rebuild.
  - `src/components/modal/{authenticationModal,ConfirmationModal,AddCurrencyModal}.tsx` — modal rebuild.
  - `src/components/ui/{Button,Input,Label,Card,Pill}.tsx` — primitive retune; add a `CommandPalette` using `ui/command.tsx`.

## Recommended defaults (if you must pick one per surface)
Dashboard **`1a`** (+ optionally `1c`'s docked feed and the `1b` palette as a global `⌘K`) · Auth **`2a`** (login) + **`2b`** (register) · OTP **`3a`** · Confirmation **`4a`** (with `4b` reserved for account deletion) · Add currency **`5a`**.
