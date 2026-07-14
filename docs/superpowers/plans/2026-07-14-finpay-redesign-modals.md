# FinPay "Neon Ledger" Redesign — Modals Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development. Steps use checkbox (`- [ ]`) syntax.

**Goal:** Apply the Neon Ledger glass treatment to the modal dialogs in `frontend/src/components/modal/*`, and migrate their react-icons to lucide.

**Architecture:** Modals are overlays — chrome — and DESIGN.md names them a glass target. Each modal has a dialog PANEL (currently `bg-card`) sitting over a dimming backdrop. Glass the panel; migrate icons. Restyle only the modal files.

**Tech Stack:** React 19, Tailwind v4, `lucide-react`, existing `.glass` utility. npm. Spec: `DESIGN.md`.

## Global Constraints

- Styling + icon swaps only. No change to logic, state, handlers, props, `data-testid`, or any non-modal file.
- Glass the modal dialog PANEL: replace the panel's raw `bg-card [border ...] [shadow-*]` with `glass`, keep layout classes (width, padding, rounded, flex/grid, gap). Do NOT touch the backdrop/overlay element (the `fixed inset-0 bg-black/..` dimmer stays). If a modal panel has NO dimming backdrop behind it, still glass it but note the absence in the report (glass may show the page through — acceptable, just flag it).
- No emoji. Icon swap map (lucide): `LiaTimesSolid`→`X`, `FaTimes`→`X`, `FiX`→`X`, `FiSearch`→`Search`, `FaExclamationTriangle`→`TriangleAlert`. Keep each icon's `onClick`/size/position; where a react-icon used `size={N}`, give lucide `className="h-{n} w-{n}"`. Remove every react-icons import made unused.
- Preserve semantic status colors already on success/error modal content (positive/destructive) — do not recolor them.
- Body copy stays `text-foreground`/`text-muted-foreground`.
- Existing tests stay green. From `frontend/`: `./node_modules/.bin/jest` (real result = `Test Suites:`/`Tests:` line; ignore trailing `ℹ tests 0` artifact) and `npm run build`.
- `.design-sync/` untouched.

Each task: read the file(s) first, apply, verify (jest + build), commit with the given message. If a test references changed markup, update only the SELECTOR (never weaken/behavior) and disclose it. Report to `.superpowers/sdd/<id>-report.md`. Return only: status, commit short-hash, one-line test+build summary, concerns.

---

### Task MO1: Glass the six icon-free modals (batch)

**Files:** Modify these six (identical transform — glass the dialog panel's `bg-card`):
- `frontend/src/components/modal/FailedRequestModal.tsx`
- `frontend/src/components/modal/FailedTransferModal.tsx`
- `frontend/src/components/modal/ScheduledPayment.tsx`
- `frontend/src/components/modal/SuccessfulRequestModal.tsx`
- `frontend/src/components/modal/SuccessfulTopupModal.tsx`
- `frontend/src/components/modal/SuccessfulTransferModal.tsx`

None of these import react-icons — this task is glass-only.

- [ ] **Step 1:** Read all six files.
- [ ] **Step 2:** In each, find the dialog PANEL element (the `bg-card` container that is the modal card, NOT the `fixed inset-0` backdrop). Replace its `bg-card` (and any `border border-border`/`shadow-*` on the same element) with `glass`, keeping all layout classes. Do not touch the backdrop, the status icon, or any text/color.
- [ ] **Step 3:** Verify: `./node_modules/.bin/jest` → all pass; `npm run build` → succeeds.
- [ ] **Step 4:** Commit `feat(design): glass success/failure/scheduled modals`. Report id: `mo-1` (list each file + the panel line changed, note any modal lacking a backdrop).

---

### Task MO2: ConfirmationModal — glass + lucide

**Files:** Modify `frontend/src/components/modal/ConfirmationModal.tsx` (`FaExclamationTriangle`, `FaTimes`)

- [ ] Read the file.
- [ ] Swap `import { FaExclamationTriangle, FaTimes } from 'react-icons/fa';` → `import { TriangleAlert, X } from 'lucide-react';`; swap `FaExclamationTriangle`→`TriangleAlert`, `FaTimes`→`X`, preserving onClick/size/position classes; remove the import.
- [ ] Glass the dialog panel (`bg-card` → `glass`, keep layout).
- [ ] Verify, commit `feat(design): glass ConfirmationModal, lucide icons`. Report id: `mo-2`.

---

### Task MO3: AddCurrencyModal — glass + lucide

**Files:** Modify `frontend/src/components/modal/AddCurrencyModal.tsx` (`FiSearch`, `FiX`)

- [ ] Read the file.
- [ ] Swap `import { FiSearch, FiX } from 'react-icons/fi';` → `import { Search, X } from 'lucide-react';`; swap `FiSearch`→`Search`, `FiX`→`X`, preserving onClick/size/position; remove the import.
- [ ] Glass the dialog panel (`bg-card` → `glass`, keep layout). If the modal has a dense currency-results list on `bg-card`, keep that list solid and glass only the panel frame; note the call.
- [ ] Verify, commit `feat(design): glass AddCurrencyModal, lucide icons`. Report id: `mo-3`.

---

### Task MO4: HistoryFilterModal — glass + lucide

**Files:** Modify `frontend/src/components/modal/HistoryFilterModal.tsx` (`FaTimes`)

- [ ] Read the file.
- [ ] Swap `import { FaTimes } from "react-icons/fa";` → `import { X } from "lucide-react";`; swap `FaTimes`→`X`, preserving onClick/size/position; remove the import.
- [ ] Glass the dialog panel (`bg-card` → `glass`, keep layout). It is a filter form — keep any dense option list solid if present.
- [ ] Verify, commit `feat(design): glass HistoryFilterModal, lucide X`. Report id: `mo-4`.

---

### Task MO5: authenticationModal — glass + lucide

**Files:** Modify `frontend/src/components/modal/authenticationModal.tsx` (`LiaTimesSolid`, ~258 lines)

- [ ] Read the full file.
- [ ] Swap `import { LiaTimesSolid } from 'react-icons/lia';` → `import { X } from 'lucide-react';`; swap every `LiaTimesSolid`→`X`, preserving onClick/size/position; remove the import.
- [ ] Glass the dialog panel (`bg-card` → `glass`, keep layout). This is an OTP/auth modal — keep any code-input grid legible (it stays on the glass panel; do not add a solid sub-card unless one already exists).
- [ ] Verify, commit `feat(design): glass authenticationModal, lucide X`. Report id: `mo-5`.

---

### Task MO6: Cluster verification (live)

**Files:** none.

- [ ] `./node_modules/.bin/jest` → all suites pass; `npm run build` → succeeds.
- [ ] `grep -rn "react-icons" frontend/src/components/modal/` → no output.
- [ ] Live smoke (fake session, both themes): trigger a couple of modals in the running app (e.g. the History filter modal, a confirmation) and confirm in light + dark: the dialog reads as a frosted glass panel over the dimmed backdrop, text/buttons stay legible, lucide close icons render, status colors intact, no clipping. If a modal is hard to trigger without a backend, at minimum confirm the app builds and the modal file renders (mount) via its parent.
- [ ] `git status .design-sync` → clean.

---

## Self-Review
- Coverage: glass on every modal panel (MO1-MO5), lucide swaps on the 4 icon modals (MO2-MO5). MO1 is glass-only (no icons).
- Placeholders: none — exact icon map, exact per-file transform.
- Scope: only `src/components/modal/*`; backdrops and children untouched.
- Consistency: same glass recipe + icon map as prior clusters. Batching MO1 is justified — six identical trivial glass swaps a reviewer would accept/reject together.
