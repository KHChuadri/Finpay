# FinPay UI Redesign — Minimal Dark

**Date:** 2026-07-08
**Scope:** Frontend visual redesign, pass 1
**Status:** Approved (design), pending implementation plan

## Goal

Give FinPay a cohesive, dark, quietly-gamified identity. Move theming off scattered
`darkMode ? ... : ...` JS ternaries and onto CSS tokens. Reskin the highest-impact
screens; the rest inherit the tokens later.

## Direction

**Minimal Dark.** Near-black canvas, hairline borders, flat cards. One accent
(`#B6FF3B` lime) used only where it means something: progress, positive, primary
action. The game layer — level, streak, EXP, progress — stays but reads as calm
data, not arcade noise. No gradients, no glow.

Reference mockup: neon-arcade-mockup.html (approved v2, "minimal-dark").

## Decisions (locked)

| Question | Decision |
|---|---|
| Aesthetic | Minimal Dark, single lime accent |
| Scope | Token system + reusable primitives + reskin 4 pages |
| Light mode | Keep the toggle. Dark is flagship; light is a designed variant. |
| Theming mechanism | Toggle drives a `.dark` class + CSS tokens, not JS ternaries |
| Terracotta `#C6412A` | Retired |
| Motion | Restrained: number count-up + bar fill + hover border. No confetti. |

## Design tokens

Reuse the existing shadcn token names in `frontend/src/index.css` so shadcn UI
components (`command`, `dropdown-menu`) inherit automatically. Change values; add a
few named tokens. Accent value shifts between themes for contrast (pure lime is
illegible on white).

### Dark (`.dark` — flagship)
```
--background        #0B0D11
--card              #12151B
--border            #1E232C
--border-strong     #262D38   (new)
--foreground        #E7EBF2
--muted-foreground  #9AA4B2
--subtle            #616B7A   (new: faint mono labels)
--primary           #B6FF3B   (accent)
--primary-foreground #0B0D11
--positive          #57C98A   (new: semantic good — deltas, completed)
--destructive       (keep existing red)
```

### Light (variant)
```
--background        #F6F7F9
--card              #FFFFFF
--border            #E4E7EC
--border-strong     #D3D8DF
--foreground        #14171C
--muted-foreground  #5A6270
--subtle            #8A93A0
--primary           #4B9A1E   (darkened lime, legible on white)
--primary-foreground #FFFFFF
--positive          #2E9E63
```

Type: no webfonts (CSP-free). System sans for display/body; system monospace
(`ui-monospace`) for labels, numbers, EXP, level, category chips — the mono is a
deliberate part of the identity. `tabular-nums` on all aligned figures.

## Theming mechanism

Current: `useDarkModeStore` holds a boolean; every page hardcodes
`darkMode ? "bg-gray-900" : "bg-white"`. ~19 pages do this.

New:
- `useDarkModeStore` toggle **also** adds/removes `dark` on
  `document.documentElement` (and keeps the boolean, persisted).
- Migrated pages (the 4 below + `Layout`) use token classes
  (`bg-background`, `text-foreground`, `border-border`, `bg-primary`, etc.) and
  **stop reading `darkMode`**.
- **Non-migrated pages keep working**: they still read the boolean; the store keeps
  it in sync with the class. No big-bang. Do NOT delete the store.
- Logo swap in `Layout` (`Finpay.png` / `FinpayDarkMode.png`) keeps reading the
  boolean — one small exception, fine.

## Reusable primitives

New, in `frontend/src/components/ui/`. Keep minimal — no speculative props.

1. **Card** — flat, `bg-card`, `border-border`, rounded. Optional `completed` state
   (`border-strong`).
2. **Button** — variants: `primary` (accent bg, dark text), `ghost` (hairline
   border, neutral). Press feedback via CSS active.
3. **ProgressBar** — 4px track, accent fill, animated width. Props: `value`, `max`.
   Respects `prefers-reduced-motion`.
4. **Pill** — mono, hairline border, neutral text. Used for Level, category chips,
   streak, EXP.
5. **CountUp** — small helper for the balance number; falls back to final value
   under reduced motion. Uses `motion` (already a dependency).

## Pages to reskin (pass 1)

1. **Layout** (shell) — background, nav, footer on tokens. Drives everything below.
2. **Dashboard** — balance card w/ count-up, 4 quick-action ghost buttons, wallet
   list, level pill + streak in header.
3. **ChallengesList** — challenge cards use Card + ProgressBar + Pill; category
   chips and status become quiet mono; retire the blue/green/orange status washes.
4. **Login** — token-based form, primary button.
5. **LandingPage** — hero + CTA on the new identity.

Out of scope this pass: the other ~14 pages/components. They keep the boolean path
and get migrated later, screen by screen, inheriting the same tokens.

## Motion

- Balance count-up on Dashboard mount.
- Progress bar fills from 0 to value on mount / update.
- Hover: border color transition on cards and ghost buttons; active press nudge.
- All gated by `prefers-reduced-motion`.
- No confetti, no particles, no animated gradients.

## Success criteria

- Existing frontend tests still pass (`data-testid`s and copy preserved on the 4
  pages; adjust tests only where markup genuinely changed).
- Toggling the theme flips the whole app via the `.dark` class; migrated pages have
  zero `darkMode ?` ternaries.
- The 4 pages match the approved Minimal Dark mockup in both themes.
- No hardcoded `#C6412A` / gray-scale ternaries remain on migrated pages.

## Risks / notes

- Light variant was not shown in the mockup (dark-only pitch). Build it from the
  tokens above and eyeball contrast before finishing.
- MUI components (`@mui/material`, date pickers) don't read these tokens. Any MUI on
  the 4 pages needs its own dark styling or `sx` — check during implementation.
- Tests assert specific classes/text in places; expect some test churn on the 4
  pages.
