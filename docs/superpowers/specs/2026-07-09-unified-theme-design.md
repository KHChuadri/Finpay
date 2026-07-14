# Unified Theme — Monochrome + Single Accent

**Date:** 2026-07-09
**Scope:** `frontend/` (React 19 + Tailwind v4 + Vite)
**Goal:** One consistent theme across every page and component, correct in both light and dark mode.

## Problem

72 of 105 `.tsx` files hardcode colors (`bg-white`, `bg-[#C6412A]`, `border-[#fea293]`, `text-gray-800`) instead of the semantic tokens already defined in `src/index.css`. Result: dark mode breaks (white cards on black background — see Registration page), and buttons/borders are visually inconsistent (red, orange, blue, salmon).

The tokens are sound. The components ignore them.

## Aesthetic direction

**Monochrome + single accent** (Linear / Vercel language). The UI is near-grayscale. Color carries meaning, never decoration:

| Token | Role | Appears on |
|-------|------|-----------|
| `primary` (green `#4B9A1E` light / lime `#B6FF3B` dark) | the ONE accent | primary buttons, active/selected states, focus ring |
| `positive` (`#2E9E63` / `#57C98A`) | money in / success | positive amounts (`+$`), success states |
| `destructive` (red) | danger only | delete actions, error text, error borders |
| `foreground` / `muted-foreground` / `subtle` | text hierarchy | all other text |
| `background` / `card` / `muted` / `secondary` | surfaces | all surfaces |
| `border` / `border-strong` / `input` | lines | all borders |

Rule of thumb: if a color is not `primary`, `positive`, or `destructive` conveying real meaning, it must be a neutral token.

## Changes

### 1. Tokens (`src/index.css`) — minimal

Existing neutral + primary + positive tokens stay. Add only:

- `--destructive-foreground: #FFFFFF;` (both modes) so destructive buttons have correct text color.
- Give `--destructive` an explicit hex in both `:root` and `.dark` (currently oklch — keep or convert; must be legible on `card`).
- Register `--color-destructive-foreground` in the `@theme inline` block.

No palette/hue changes beyond the above. Inter font, radius scale, and all other tokens already landed in a prior change and stay.

### 2. New shared primitives (`src/components/ui/`)

Existing `Button.tsx` and `Card.tsx` stay and are extended. Add three files:

**`Input.tsx`**
- Base: `bg-card border border-input rounded-lg px-3 py-2 text-foreground placeholder:text-subtle transition-colors`
- Focus: `focus:outline-none focus:ring-2 focus:ring-ring/40 focus:border-ring`
- Error prop → swaps border/ring to `destructive`.
- Forwards all native `input` props + `ref`.

**`Label.tsx`**
- `text-sm font-medium text-foreground`
- `required?: boolean` → appends `*` in `text-destructive`.
- Associates via `htmlFor`.

**`PageContainer.tsx`**
- `mx-auto w-full max-w-6xl px-6 py-8` (matches nav/footer width from `Layout`).
- Optional `size="narrow"` → `max-w-md` for auth/form pages.

**`Button.tsx` (extend)**
- Add `destructive` variant: `bg-destructive text-destructive-foreground hover:opacity-90`.
- Keep `primary` and `ghost`. `ghost` = neutral outline (used for "Back", secondary actions).

### 3. Migration — all 72 hardcoded-color files

Mechanical mapping applied consistently:

| Hardcoded | Token |
|-----------|-------|
| `bg-white` | `bg-card` |
| `bg-gray-50` / `bg-gray-100` | `bg-muted` |
| `bg-gray-800` / `bg-black` | `bg-background` or `bg-card` (by context) |
| `text-gray-800` / `text-gray-900` / `text-black` | `text-foreground` |
| `text-gray-500` / `text-gray-600` | `text-muted-foreground` |
| `text-gray-400` | `text-subtle` |
| `text-white` on colored button | `text-primary-foreground` / `text-destructive-foreground` |
| `border-gray-200/300` / `border-[#…]` | `border-border` (or `border-input` on inputs) |
| `bg-[#C6412A]` / `bg-red-*` / `bg-blue-*` on action buttons | `bg-primary` (or `bg-destructive` if the action truly destroys data) |
| `text-red-500` / red error blocks | `text-destructive` (semantic — stays red) |
| raw `<input>` | `<Input>` |
| raw label markup | `<Label>` |
| positive money amounts | `text-positive` |

Semantics preserved: error messages stay red (`destructive`), positive amounts stay green (`positive`). Only decorative/structural colors move to neutrals.

Buttons currently colored red for non-destructive actions (e.g. "Back") become `ghost`. `destructive` variant is reserved for delete/remove/withdraw-all type actions.

### 4. Out of scope

- No layout restructuring beyond wrapping pages in `PageContainer` for width consistency.
- No new features, no copy changes, no logic changes.
- No font/palette hue change beyond the `destructive-foreground` token addition.

## Success criteria

1. `grep -rE "bg-white|text-gray-|border-\[#|bg-\[#|text-white" frontend/src --include="*.tsx"` returns only intentional, justified matches (target: ~0).
2. Every page renders correctly in **both** light and dark mode — no white-on-black, no orphan red/orange/blue chrome.
3. `npx tsc --noEmit` passes.
4. Existing tests pass (`npm test`).
5. Visual verification: screenshot Login, Register, Dashboard, a transaction flow, Profile, and one admin page in **dark mode** — all consistent.

## Risks

- Some files use hardcoded colors for genuine semantic reasons (charts, country flags, status pills). These are inspected, not blindly swapped.
- Context-dependent grays (`bg-gray-800` could be a surface or an overlay) need per-use judgment, not pure find-replace.
