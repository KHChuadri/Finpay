# FinPay "Neon Ledger" Redesign — Misc Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply the Neon Ledger system to the remaining top-level pages: History, Notification, ProfilePage, AdminPage, LandingPage.

**Architecture:** Built on the shipped foundation + prior clusters. All render inside `Layout` (aurora + glass nav present). Restyle only the page files; do not touch child components.

**Tech Stack:** React 19, Tailwind v4, `lucide-react`, existing `.glass` utility + tokens. npm. Spec: `DESIGN.md`.

## Global Constraints

- Styling + icon swaps only. No change to data/hooks/state/handlers/effects/`data-testid`/child components.
- **Glass = chrome only.** Framing/summary/form cards → `.glass`. Dense data (history rows, notification list rows, tables) STAYS solid `bg-card`/`border border-border`. When unsure, keep solid.
- Glass recipe: replace a framing container's raw `bg-card [border ...] [shadow-*]` classes with `glass`, keep layout classes. (Note: this works on raw `<div className="bg-card ...">`. The `Card` primitive hardcodes `bg-card` internally and CANNOT be glassed by adding a className — if a container is a `<Card>`, leave it solid and note it; a Card glass variant is a separate foundation follow-up.)
- Currency amounts → `font-mono tabular-nums` (value/format unchanged).
- **Status chips** only where a real status/type is rendered as text: `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` + tint (pending/in-progress → `bg-warning/15 text-warning`; completed/success → `bg-positive/15 text-positive`; failed/cancelled → `bg-destructive/15 text-destructive`). Keep the label. Do NOT invent a status.
- No emoji. Icon swap map (lucide): `FaSearch`→`Search`, `FaFilter`→`Filter`, `IoMdRefresh`→`RefreshCw`, `PiHandWithdraw`→`HandCoins`, `MdAddTask`→`ListPlus`, `FiEdit2`→`Pencil`, `FiSun`→`Sun`, `FiMoon`→`Moon`, `FiAlertCircle`→`CircleAlert`. Keep each icon's `onClick`/size/position; where a react-icon used `size={N}`, give lucide `className="h-{n} w-{n}"`. Remove every react-icons import made unused.
- Body/label copy stays `text-foreground`/`text-muted-foreground`, never lime.
- Existing tests stay green. From `frontend/`: `./node_modules/.bin/jest` (real result = `Test Suites:`/`Tests:` line; ignore trailing `ℹ tests 0` artifact) and `npm run build`.
- `.design-sync/` untouched.

Each task: **read the full page file first**, apply transforms, verify (jest + build), commit with the given message. If a test references changed markup, update only the SELECTOR (never weaken/behavior) and disclose it. Write a report to `.superpowers/sdd/<id>-report.md`. Return only: status, commit short-hash, one-line test+build summary, concerns.

---

### Task MI1: History — glass chrome, mono amounts, lucide, status chips

**Files:** Modify `frontend/src/pages/History.tsx` (~268 lines, 4 raw `bg-card`, `FaSearch`/`FaFilter`, `formatCurrency`)

- [ ] Read the file. This mirrors the already-shipped GroupHistory treatment.
- [ ] Swap `import { FaSearch, FaFilter } from "react-icons/fa";` → `import { Search, Filter } from "lucide-react";`; swap usages; remove the import.
- [ ] Glass the search bar + filter control + any framing/empty-state card. Keep transaction ROWS solid.
- [ ] Add `font-mono tabular-nums` to every `formatCurrency(...)` amount (e.g. the `${amountSign} ${formatCurrency(...)}` at ~line 237).
- [ ] If a transaction renders a status/type as text, make a chip per the recipe (keep label); else skip and note it.
- [ ] Verify, commit `feat(design): glass History chrome, mono amounts, lucide, status chips`. Report id: `mi-1`.

---

### Task MI2: Notification — glass framing + lucide refresh

**Files:** Modify `frontend/src/pages/Notification.tsx` (~66 lines, 1 raw `bg-card`, `IoMdRefresh`)

- [ ] Read the file.
- [ ] Swap `import { IoMdRefresh } from "react-icons/io";` → `import { RefreshCw } from "lucide-react";`; swap usage; remove the import.
- [ ] Glass the framing container if it is chrome; keep a dense notification list body solid. (If the single `bg-card` is the list body itself, keep it solid and note it — no framing card to glass.)
- [ ] Verify, commit `feat(design): glass Notification framing, lucide refresh`. Report id: `mi-2`.

---

### Task MI3: ProfilePage — glass profile cards + lucide

**Files:** Modify `frontend/src/pages/ProfilePage.tsx` (~777 lines, 2 raw `bg-card`, `FiEdit2`/`FiSun`/`FiMoon`/`FiAlertCircle`)

- [ ] Read the full file (large; take care — most of it is form fields, only ~2 framing `bg-card` blocks).
- [ ] Swap `import { FiEdit2, FiSun, FiMoon, FiAlertCircle } from "react-icons/fi";` → `import { Pencil, Sun, Moon, CircleAlert } from "lucide-react";`. Swap: `FiEdit2`→`Pencil`, `FiSun`→`Sun`, `FiMoon`→`Moon`, `FiAlertCircle`→`CircleAlert`, preserving onClick/size/position (the Sun/Moon are the dark-mode toggle — keep their behavior). Remove the import.
- [ ] Glass the profile framing/summary card(s) (raw `bg-card` → `glass`, keep layout). Keep dense field groups/lists solid.
- [ ] Verify, commit `feat(design): glass ProfilePage cards, lucide icons`. Report id: `mi-3`.

---

### Task MI4: AdminPage — glass framing + lucide

**Files:** Modify `frontend/src/pages/AdminPage.tsx` (~205 lines, 1 raw `bg-card`, `PiHandWithdraw`/`MdAddTask`)

- [ ] Read the file.
- [ ] Swap `import { PiHandWithdraw } from "react-icons/pi";` and `import { MdAddTask } from "react-icons/md";` → `import { HandCoins, ListPlus } from "lucide-react";`. Swap `PiHandWithdraw`→`HandCoins`, `MdAddTask`→`ListPlus`, preserving onClick/size. Remove both imports.
- [ ] Glass the framing container if it is chrome; keep dense admin tables/lists solid.
- [ ] Verify, commit `feat(design): glass AdminPage framing, lucide icons`. Report id: `mi-4`.

---

### Task MI5: LandingPage — glass cards

**Files:** Modify `frontend/src/pages/LandingPage.tsx` (~134 lines, 2 raw `bg-card`, no react-icons)

This is the public marketing page. Keep it clean and on-system.

- [ ] Read the file.
- [ ] Glass the 2 framing/feature `bg-card` blocks (raw `bg-card ...` → `glass`, keep layout). If either is dense repeated content, keep it solid and note it.
- [ ] Verify, commit `feat(design): glass LandingPage cards`. Report id: `mi-5`.

---

### Task MI6: Cluster verification (live)

**Files:** none.

- [ ] `./node_modules/.bin/jest` → all suites pass; `npm run build` → succeeds.
- [ ] `grep -rn "react-icons" frontend/src/pages/History.tsx frontend/src/pages/Notification.tsx frontend/src/pages/ProfilePage.tsx frontend/src/pages/AdminPage.tsx` → no output.
- [ ] Live smoke (fake session, both themes): visit `/` (Landing), the history, notification, profile, and admin routes (confirm paths in `src/Router.tsx`). Confirm light + dark: framing cards glass on the aurora; dense rows solid; history amounts monospaced; lucide icons render; profile Sun/Moon toggle still switches theme; no horizontal scroll. Data errors without a backend — fine.
- [ ] `git status .design-sync` → clean.

---

## Self-Review
- Coverage: glass framing (all), mono amounts (MI1), lucide swaps (MI1-MI4), chips only where real (MI1). No mono/chip claimed where absent (MI2-MI5).
- Placeholders: none — exact icon map, exact anchors, read-then-apply.
- Scope: 5 page files; children excluded; Card-primitive limitation noted.
- Consistency: same conventions as prior clusters.
