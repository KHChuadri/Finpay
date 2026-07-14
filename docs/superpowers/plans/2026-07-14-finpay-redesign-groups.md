# FinPay "Neon Ledger" Redesign — Groups Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply the Neon Ledger system to the six group pages: GroupPage, CreateGroup, ManageGroup, GroupHistory, GroupInvite, ChallengesList.

**Architecture:** Built on the shipped foundation + prior clusters. All six render inside `Layout` (aurora + glass nav present). Restyle only the page files; do not touch child components. Same conventions as the Dashboard / money-movement clusters.

**Tech Stack:** React 19, Tailwind v4, `lucide-react`, existing `.glass` utility + tokens. npm. Spec: `DESIGN.md`.

## Global Constraints

- Styling + icon swaps only. No change to data fetching, hooks, state, handlers, effects, `data-testid`, or any child component.
- **Glass = chrome only.** Framing/summary/form cards → `.glass`. Dense data (history rows, member lists, challenge rows, tables) STAYS solid `bg-card`/`bg-surface-2` with `border border-border`. When unsure, keep solid.
- Glass recipe: replace a framing container's `bg-card [border ...] [shadow-*]` with `glass`, keep layout classes.
- Currency amounts, balances, and monetary goals → `font-mono tabular-nums` (value/format unchanged).
- **Status chips** (only where a real status/state is rendered): `inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium` + tint — active/in-progress/pending → `bg-warning/15 text-warning`; completed/done/success → `bg-positive/15 text-positive`; failed/expired/cancelled → `bg-destructive/15 text-destructive`. Keep the label text. Do NOT invent a status where none exists.
- No emoji. Icon swap map (lucide): `FiSearch`→`Search`, `FaSearch`→`Search`, `FaFilter`→`Filter`, `FaTrophy`→`Trophy`, `FaCalendarAlt`→`Calendar`, `FaCoins`→`Coins`, `FaPlay`→`Play`, `FaCheckCircle`→`CheckCircle2`, `FaClock`→`Clock`. Keep each icon's `onClick`/size/position classes (`h-5 w-5` only where it had no size); remove every react-icons import made unused. Note: some react-icons accept `size={N}` — replace with `className="h-N w-N"` equivalent or keep a matching size class.
- Body/label copy stays `text-foreground`/`text-muted-foreground`, never lime.
- Existing tests stay green. From `frontend/`: `./node_modules/.bin/jest` (real result = `Test Suites:`/`Tests:` line; ignore trailing `ℹ tests 0` artifact) and `npm run build`.
- `.design-sync/` untouched.

Each task below: **read the full page file first**, then apply the transforms. Verify with jest + build, then commit with the given message. If a test references changed markup, update only the SELECTOR (never weaken an assertion or change behavior) and disclose it in the report. Write a report to `.superpowers/sdd/<id>-report.md` (repo-root relative). Return only: status, commit short-hash, one-line test+build summary, concerns.

---

### Task G1: GroupPage — glass framing + mono balance

**Files:** Modify `frontend/src/pages/GroupPage.tsx` (~338 lines, 4 `bg-card` blocks, no react-icons)

- [ ] Read the file. Identify which of the 4 `bg-card` blocks are framing/summary chrome (→ glass) vs dense member/content lists (→ stay solid).
- [ ] Glass the framing/summary containers only; leave dense lists solid.
- [ ] Add `font-mono tabular-nums` to the group wallet balance amount (~line 200 area, the "Balance" display).
- [ ] Verify (`./node_modules/.bin/jest`, `npm run build`), commit: `feat(design): glass GroupPage framing, mono group balance`. Report id: `gr-1`.

---

### Task G2: CreateGroup — glass form card + lucide search

**Files:** Modify `frontend/src/pages/CreateGroup.tsx` (~171 lines, 2 `bg-card`, `FiSearch`)

- [ ] Read the file.
- [ ] Replace `import { FiSearch } from "react-icons/fi";` with `import { Search } from "lucide-react";`; swap every `<FiSearch .../>`→`<Search .../>` keeping onClick/size classes; remove the react-icons import.
- [ ] Glass the form/framing card(s) (`bg-card ...` → `glass`, keep layout). If a `bg-card` block is a dense member-search results list, keep it solid.
- [ ] Verify, commit: `feat(design): glass CreateGroup form, lucide search`. Report id: `gr-2`.

---

### Task G3: ManageGroup — glass framing

**Files:** Modify `frontend/src/pages/ManageGroup.tsx` (~137 lines, 2 `bg-card`, no react-icons)

- [ ] Read the file.
- [ ] Glass the framing/summary container(s); keep dense member lists solid.
- [ ] Verify, commit: `feat(design): glass ManageGroup framing`. Report id: `gr-3`.

---

### Task G4: GroupHistory — glass chrome, mono amounts, lucide, status chips

**Files:** Modify `frontend/src/pages/GroupHistory.tsx` (~265 lines, 4 `bg-card`, `FaSearch`/`FaFilter`, `formatCurrency`)

- [ ] Read the file.
- [ ] Replace `import { FaSearch, FaFilter } from "react-icons/fa";` with `import { Search, Filter } from "lucide-react";`; swap usages; remove the react-icons import.
- [ ] Glass the search bar + filter control + any framing/empty-state card (chrome). Keep the history ROWS/list body solid.
- [ ] Add `font-mono tabular-nums` to every rendered `formatCurrency(...)` amount.
- [ ] If a history entry renders a status/type, convert it to a chip per the recipe (keep label). If none, skip and note it.
- [ ] Verify, commit: `feat(design): glass GroupHistory chrome, mono amounts, lucide, status chips`. Report id: `gr-4`.

---

### Task G5: GroupInvite — glass form card

**Files:** Modify `frontend/src/pages/GroupInvite.tsx` (~102 lines, 1 `bg-card`, no react-icons)

- [ ] Read the file.
- [ ] Glass the framing/form card (`bg-card ...` → `glass`, keep layout).
- [ ] Verify, commit: `feat(design): glass GroupInvite form`. Report id: `gr-5`.

---

### Task G6: ChallengesList — glass framing, mono goals, lucide feature icons, status chips

**Files:** Modify `frontend/src/pages/ChallengesList.tsx` (~448 lines, 2 `bg-card`, many react-icons, `ProgressBar`, `progress`/`amountToGoal`)

- [ ] Read the full file (it is the largest; take care).
- [ ] Replace `import { FaSearch, FaTrophy, FaCalendarAlt, FaCoins, FaPlay, FaCheckCircle, FaClock } from 'react-icons/fa';` with `import { Search, Trophy, Calendar, Coins, Play, CheckCircle2, Clock } from 'lucide-react';`. Swap every usage per the map (`FaCheckCircle`→`CheckCircle2`). Preserve each icon's `onClick`/size/position; where a react-icon used `size={N}`, give the lucide icon an equivalent `className` size (e.g. `size={16}` → `h-4 w-4`). Remove the react-icons import.
- [ ] Feature-color the meaning-bearing icons where it reads naturally: `Trophy`/`Coins` → `text-primary` (reward), `CheckCircle2` → `text-positive` (done), `Clock` → `text-warning` (time/pending). Do not recolor the plain `Search` control.
- [ ] Add `font-mono tabular-nums` to monetary goal/amount figures (`amountToGoal` and any coin/amount total). Do NOT edit the `ProgressBar` child component; only style values written in this page.
- [ ] If a challenge renders a real state (active / completed / expired), convert it to a status chip per the recipe (keep label). If the state is already conveyed only by an icon (CheckCircle/Clock), leave the icon and do not add a redundant chip — note the call in the report.
- [ ] Glass the top framing/search container(s); keep the challenge cards/rows and the progress rows solid.
- [ ] Verify, commit: `feat(design): glass ChallengesList framing, mono goals, lucide feature icons`. Report id: `gr-6`.

---

### Task G7: Cluster verification (live)

**Files:** none.

- [ ] `./node_modules/.bin/jest` → all suites pass; `npm run build` → succeeds.
- [ ] `grep -rn "react-icons" frontend/src/pages/CreateGroup.tsx frontend/src/pages/GroupHistory.tsx frontend/src/pages/ChallengesList.tsx` → no output.
- [ ] Live smoke (fake session, both themes): start `npm run dev`, set `sessionStorage['auth-store']` = `{"state":{"token":"smoke","userId":"smoke","isAuthenticated":true,"isVerified":true,"isLocked":false},"version":0}`, visit the group routes (confirm paths in `src/Router.tsx` — e.g. groups list, a group page, ChallengesList). Confirm in light + dark: framing/summary cards read as glass on the aurora; dense lists/rows stay solid; balances/goals are monospaced; lucide feature icons render with their colors; status chips (where present) have visible labels; no horizontal scroll. Data errors without a backend — fine.
- [ ] `git status .design-sync` → clean.

---

## Self-Review
- Coverage: glass framing (all), mono balances/goals (G1,G4,G6), lucide swaps (G2,G4,G6), status chips only where real (G4,G6). No mono/chip claimed where absent (G3,G5 pure glass).
- Placeholders: none — exact icon map, exact anchors, read-then-apply per page.
- Scope: 6 page files only; children (incl. ProgressBar) excluded.
- Consistency: one glass/mono/chip/icon convention reused from prior clusters.
