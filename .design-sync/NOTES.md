# design-sync notes — Finpay UI

Synced surface: `frontend/src/components/ui` (8 primitives) → Claude Design project `Finpay UI`.

## Repo shape / build quirks

- **Not a component library — it's an app SPA.** No library `dist` entry, so the
  converter runs in **synth-entry mode** (builds an entry from `src/`).
- `pkg: ".."` is deliberate: it makes `PKG_DIR = join(node_modules, "..") = frontend/`
  so `cssEntry` (bounded to the package) and the `@/` tsconfig alias resolve, while
  `--node-modules frontend/node_modules` still resolves React. Don't "fix" it.
- Run from repo root with `--node-modules frontend/node_modules`.
- `command.tsx` / `dropdown-menu.tsx` (shadcn radix/cmdk primitives) live in the same
  `ui/` dir. They ride into the bundle (extra `window.FinpayUI` exports) but are NOT
  scoped as components — `componentSrcMap` pins only the 8 custom primitives. Interaction/
  portal-heavy; add them as authored components later only if wanted.

## CSS / tokens

- Tailwind v4, semantic CSS-var tokens defined in `src/index.css` (`:root` + `.dark`).
- **`cssEntry` = `frontend/dist/ds-styles.css`**, a copy of the compiled app CSS.
  `buildCmd` regenerates it: `vite build` then `cp dist/assets/index-*.css dist/ds-styles.css`
  (dist is gitignored; the hashed filename churns every build, hence the stable copy).
- **Purge gap (known limitation):** the compiled CSS is tree-shaken to what the *app*
  uses, so token utilities the app never used don't ship (`text-card-foreground`,
  `bg-ring` were absent). Every token still exists as a `var(--*)`. conventions.md tells
  the design agent to fall back to the var. To ship *all* utilities you'd need a Tailwind
  safelist / complete build — not done (kept the ship-what-they-built approach).
- The stale `dist/assets/index-BtDAh88u.css` (Jul 8) predated Button's destructive
  variant → missing classes. A fresh `vite build` fixed it. Always rebuild CSS before syncing.
- Inter loads via a remote Google Fonts `@import` (survives a fresh vite build; the stale
  one had dropped it). `[FONT_REMOTE]` is expected and fine.

## Previews

- `.d.ts` props are hand-written in `cfg.dtsPropsFor` (synth mode can't extract real
  types — default was `[key: string]: unknown`). Keep them in sync if a component's props change.
- `ProgressBar` and `CountUp` animate from 0 via rAF. Their preview `.tsx` files shim
  `window.matchMedia('(prefers-reduced-motion: reduce)') → true` so static capture shows
  the resting/final state. If you edit those previews, keep the shim.
- `PageContainer` is full-width → `cfg.overrides.PageContainer.cardMode = "column"`.

## Feature components (curated presentational set, 20)

Added on top of the 8 ui primitives: transaction (PaymentReceipt, RecipientInfo,
ExchangeRate), landing (RequestMoney, SendMoney), admin (ErrorModal, SuccessModal),
dashboard (FlyoutLink, ListGroup), SplitBill (ManageMembers, LeaveGroupModal),
profile (BankDetails, PersonalDetails), modal (Confirmation, Successful/Failed
Transfer & Request, SuccessfulTopup, HistoryFilter). Data/flow-bound components
(anything using useQuery/axios/API_URL, admin/SplitBill Group* flows, CurrencyWallet,
the *ASR transaction forms) were intentionally NOT synced — poor static previews.

Key mechanics:
- **Feature components are all `export default`** → synth-entry `export *` drops them.
  `.design-sync/ds-exports.ts` re-exports each as named (`export { default as X }`),
  wired via `cfg.extraEntries`. Add a new feature component here + in componentSrcMap.
- **`cfg.provider = DsRouter`** (a MemoryRouter re-exported from the bundle in
  ds-exports.ts). Router-bound components (useNavigate) crash without it, and a
  preview-local `MemoryRouter` does NOT work — the bundled component uses the
  bundle's react-router instance, so the provider must be a bundle export.
- **Store seeding uses the bundle's store via the global**: PaymentReceipt and
  SuccessfulTransferModal read the transaction store; a preview-local store import
  is a different instance. ds-exports.ts exports `useTransactionStore` +
  `scheduledPaymentStore`, and those previews call
  `window.FinpayUI.useTransactionStore.setState({...})`. Same rule for any future
  store-driven preview.
- **Modals are full-screen `fixed inset-0` overlays** → `cfg.overrides.<Name>` =
  `{cardMode:"single", viewport:"WxH"}`. Tall content still clips slightly at the
  top under centering — cosmetic, the substance renders.
- `[EXPORT_COLLISION]` on ds-exports.ts is benign here (the 20 names live only in
  the barrel; bindings resolve — verified 28 fn on window.FinpayUI).

## Known render warns (triaged benign — re-syncs should expect these)

- `[RENDER_THIN]` on all 10 modal components (ConfirmationModal, ErrorModal,
  SuccessModal, LeaveGroupModal, SuccessfulTransferModal, SuccessfulRequestModal,
  SuccessfulTopupModal, FailedTransferModal, FailedRequestModal, HistoryFilterModal):
  their `fixed inset-0` root measures 0px height. They render correctly (confirmed
  from screenshots). Not a defect.

## Re-sync risks (watch-list)

- **CSS completeness rides on the app's usage.** If UI components gain classes the app
  doesn't render, they'll be missing from the synced CSS until the app uses them (or a
  safelist is added). Re-check the render sheets after any component style change.
- `dtsPropsFor` bodies are hand-maintained — they drift from source silently. Diff against
  the `ui/` sources on re-sync.
- `[FONT_REMOTE]` Inter depends on Google Fonts being reachable at design time.
- Re-sync: `buildCmd` must run first (regenerates `dist/ds-styles.css`), then the driver.
