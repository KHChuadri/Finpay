# FinPay Design System — "Neon Ledger"

Source of truth for the UI redesign. Extends the existing token system in
`frontend/src/index.css` (shadcn-style CSS variables + Tailwind v4). This is an
extension, not a rewrite — most tokens already exist.

## Memorable thing

A money app that feels like a tool built by people who ship. Linear's precision,
PostHog's energy, glass where it earns its place. Curated for younger users.

## Principles

1. **Glass on the frame, solid on the money.** Translucent + `backdrop-blur`
   surfaces are for chrome only (nav, sidebar, modals, floating summary cards).
   Data-dense surfaces — payment tables, schedule lists, amounts — stay on solid
   surfaces for readability and contrast.
2. **Dark-first.** Dark is the primary visual world. Light mode is retained via
   existing tokens but is secondary.
3. **Numbers are monospaced.** Every currency amount uses the mono face with
   `font-variant-numeric: tabular-nums`. Reads as financial tooling; columns align.
4. **One bold accent, quiet around it.** Lime is the primary pop. Violet/cyan are
   for feature color-coding and ambient aurora, not for filling large areas.
5. **Restraint is the point.** Motion is 150ms and purposeful. No decorative
   blobs beyond the single ambient aurora backdrop.

## Color tokens (dark)

Existing tokens in `index.css` `.dark` already cover base/surface/lime — keep them.
Additions for this direction:

| Token | Hex | Use |
|---|---|---|
| `--background` | `#0B0D11` | base (exists) |
| `--card` / surface | `#12151B` | solid surfaces (exists) |
| surface-2 | `#171B22` | raised solid rows |
| `--primary` (lime) | `#B6FF3B` | primary actions, sparklines, key amounts (exists) |
| `--play-violet` | `#7C6BFF` | recurring/schedule feature coding, aurora |
| `--play-cyan` | `#3BE8FF` | convert/wallet feature coding, aurora |
| `--glass` | `rgba(20,24,31,0.55)` | glass surface fill |
| `--glass-line` | `rgba(255,255,255,0.08)` | glass border |
| `--positive` | `#57C98A` | good state (exists) |
| `--warning` | `#F5B547` | pending state |
| `--destructive` | `#F87171` | failed/critical (exists) |

Add `--play-violet`, `--play-cyan`, `--glass`, `--glass-line`, `--surface-2` to
`:root .dark` (and sensible light-mode equivalents) in `index.css`.

## Glass recipe

```css
background: var(--glass);
backdrop-filter: blur(16px) saturate(135%);
-webkit-backdrop-filter: blur(16px) saturate(135%);
border: 1px solid var(--glass-line);
box-shadow: 0 12px 40px rgba(0,0,0,0.35);
```

Apply to: top nav, sidebar, modals (`@radix-ui/react-dialog`), balance/summary cards.
Never apply to: table rows, form fields, dense list bodies.

## Ambient backdrop

One fixed aurora layer behind content: two large blurred radial gradients
(violet top-left, cyan right), `filter: blur(90px)`, `opacity ~0.5`, masked so it
fades at top/bottom. Optional faint dot-grid overlay. `pointer-events: none`,
`z-index: 0`. Respect `prefers-reduced-motion` (no animation on it).

## Typography

- **UI / body:** Inter (already imported). Headings `tracking-tight`.
- **Money / data:** mono face, `tabular-nums`. Use JetBrains Mono or Geist Mono
  (self-host or add to the existing Google Fonts import). Applies to amounts,
  balances, rates, keycaps, code-like chips (`⌘K`, currency codes).
- **Display option (open):** a display face (Space Grotesk / Clash) for large hero
  headings — decision pending. Inter-only is the current default.
- Scale: Display ~52 / Heading 20 / Body 15 / Caption 13 / Mono-amount 14-15.

## Icons

Use `lucide-react` (already a dependency). No emoji anywhere in the UI.
Feature-coding map:

| Feature | lucide component |
|---|---|
| Recurring / scheduled | `Repeat` |
| Currency convert / wallet | `ArrowLeftRight` |
| Split / group | `Users` |

Icon chip: 32px rounded square, tinted background at ~12-14% of the feature color,
icon stroke in the full feature color.

## Motion

- Transitions 150ms ease. Hover on primary button: soft neon glow
  (`box-shadow: 0 0 24px rgba(182,255,59,0.45)`) + `translateY(-1px)`.
- Use `motion` (already installed) for view transitions and list reveals; keep
  subtle. Honor `prefers-reduced-motion: reduce`.

## Component patterns

- **Nav:** sticky glass bar, brand + lime/cyan gradient mark, muted links that
  brighten on hover, `⌘K` command hint (wire to `cmdk`, already installed), primary
  Send button.
- **Balance card:** glass, mono balance with muted currency symbol, lime delta,
  lime area-fill sparkline with emphasized endpoint dot.
- **Schedule/upcoming list:** solid panel, header + count chip, rows =
  feature icon chip / name+subtitle / mono amount + status chip.
- **Status chips:** pill, tinted bg at ~14%, colored text. `pending`=warning,
  `paid`=positive, `failed`=destructive.
- **Buttons:** `primary` = lime bg / near-black text / glow-on-hover;
  `ghost` = translucent white fill + `--line` border.

## Accessibility

- Lime `#B6FF3B` on `#0B0D11` is fine for large text, accents, amounts, and
  button fills (dark text on lime). Do NOT use lime for small body copy — body
  stays `#E7EBF2`.
- Every interactive element keeps a visible keyboard focus ring (`--ring`).
- Status is never encoded by color alone — always paired with a text label.

## Scope

Redesign is a token + component-styling pass over existing pages in
`frontend/src/pages` and `frontend/src/components`. It does not change routing,
data, or app logic.
