# Finpay UI — conventions

React components compiled from Finpay's own source. Import from `window.FinpayUI.*`
(the bundle is already loaded). A payments-app kit: green/lime primary, neutral
surfaces, light + dark themes.

## Setup — no provider needed

There is **no provider or context to wrap**. Components are styled entirely by
Tailwind utility classes resolved against CSS custom properties in `styles.css`.
Two things must be true on the page (both already are, via `styles.css`):

- The token variables are defined on `:root` (light) and `.dark` (dark).
- **Dark mode** = add `class="dark"` to any ancestor (e.g. `<html class="dark">`).
  Light is the default. There is no theme prop — theming is this class toggle.

## Styling idiom — Tailwind v4 semantic tokens

Style with utility classes named after **semantic tokens**, never raw hex. Every
component takes `className` (merged via `tailwind-merge`, so your overrides win).
Use these same tokens for your own layout so it matches the components.

| Purpose | Utilities (prefix `bg-` / `text-` / `border-`) |
|---|---|
| Page / base | `bg-background`, `text-foreground` |
| Surfaces | `bg-card`, `bg-muted`, `bg-secondary`, `bg-accent` |
| Text hierarchy | `text-foreground`, `text-muted-foreground`, `text-subtle` |
| Brand action | `bg-primary`, `text-primary-foreground` |
| Semantic | `text-positive`, `text-destructive` / `bg-destructive` / `text-destructive-foreground`, `text-warning` / `bg-warning` |
| Borders | `border-border`, `border-border-strong`, `border-input` |
| Focus ring | `ring-ring` |
| Radius / font | `rounded-lg`, `rounded-xl`, `font-sans` (Inter) |

**Important — the shipped `_ds_bundle.css` is Finpay's compiled app CSS, so it
contains only the token utilities the app actually uses.** The families above are
verified present. If you need a token combination that isn't in the stylesheet
(e.g. `text-card-foreground`), the variable always exists — use it directly:
`style={{ color: 'var(--card-foreground)' }}`. Defined tokens include
`--background --foreground --card --card-foreground --primary --primary-foreground
--secondary --muted --muted-foreground --subtle --accent --positive --destructive
--destructive-foreground --warning --border --border-strong --input --ring`.

## Where the truth lives

- `styles.css` → `@import "./_ds_bundle.css"` — the compiled tokens + utilities. Read it before styling.
- `components/general/<Name>/<Name>.d.ts` — the prop contract for each component.
- `components/general/<Name>/<Name>.prompt.md` — per-component usage.

## Components

`Button` (variant: primary | ghost | destructive), `Card` (emphasis?),
`Input` (error?), `Label` (required?, renders a `<span>` — wrap it with the input
in a `<label>`), `Pill` (mono tag), `ProgressBar` (value, max), `PageContainer`
(size: default | narrow, centers + caps width), `CountUp` (animated number).

## Idiomatic snippet

```tsx
const { Card, Label, Input, Button } = window.FinpayUI;

<Card className="w-80 space-y-4">
  <h2 className="text-lg font-semibold text-foreground">Send money</h2>
  <label className="flex flex-col gap-1.5">
    <Label required>Recipient</Label>
    <Input placeholder="jordan@finpay.com" />
  </label>
  <label className="flex flex-col gap-1.5">
    <Label>Amount</Label>
    <Input placeholder="0.00" />
  </label>
  <Button className="w-full">Send</Button>
</Card>
```
