# FinPay "Neon Ledger" Redesign — Auth Cluster

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Apply the Neon Ledger system to the four auth pages — Login, Register, ForgotPassword, ResetPassword — so the form cards become glass on the aurora and icons come from lucide.

**Architecture:** Built on the foundation branch (tokens, `.glass`, `.glow-primary`, `AuroraBackground`, glass nav in `Layout` already shipped). Login/Register/ForgotPassword render inside `Layout`, so the aurora + glass nav are already present; their form cards just switch from solid `bg-card` to `.glass`. ResetPassword does NOT use `Layout`, so it gets its own `AuroraBackground` and a transparent root. Submit buttons already use the `Button` primitive, so the neon glow is inherited — no button work needed.

**Tech Stack:** React 19, Tailwind v4, `lucide-react`, existing `.glass` utility. Package manager: npm. Spec: `DESIGN.md` at repo root.

## Global Constraints

- Styling + icon swaps only. Do NOT change form logic, validation, hooks, state, handlers, effects, `data-testid`/`data-*`, or the `Input`/`Label`/`Button` primitives.
- Glass card = replace the wrapper's `bg-card border border-border ... shadow-xl` classes with the single utility `glass`, KEEPING all layout classes (`flex flex-col rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 gap-4` etc.). Glass is chrome — a floating auth card qualifies.
- No emoji. Password-visibility toggles use lucide `Eye` (visible) / `EyeOff` (hidden). Close/dismiss controls use lucide `X`. Remove every react-icons import that a swap makes unused.
- Currency is not present on these pages; no mono work here.
- All existing tests in `frontend/` must stay green. Run from `frontend/`: `./node_modules/.bin/jest` (the real result is the `Test Suites:`/`Tests:` summary line — a trailing `ℹ tests 0` node:test line is an artifact, ignore it) and `npm run build`.
- Keep `.design-sync/` untouched.
- Preserve each form's existing width/sizing classes so layout does not shift.

---

### Task 1: Login form → glass card + lucide eye toggle

**Files:**
- Modify: `frontend/src/components/LoginForm.tsx`

**Interfaces:**
- Consumes: `.glass` utility; lucide `Eye`/`EyeOff`.

- [ ] **Step 1: Read the file**

Read `frontend/src/components/LoginForm.tsx` in full.

- [ ] **Step 2: Swap the eye icons for lucide**

Replace the two imports at the top:

```tsx
import { FaEyeSlash } from "react-icons/fa";
import { IoEyeSharp } from "react-icons/io5";
```

with:

```tsx
import { Eye, EyeOff } from "lucide-react";
```

Then in the password `<label>`, replace the toggle block:

```tsx
          {showPassword == false ? (
            <FaEyeSlash
              className="absolute right-2 bottom-2.5"
              onClick={() => setShowPassword(!showPassword)}
            />
          ) : (
            <IoEyeSharp
              className="absolute right-2 bottom-2.5"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
```

with (note: hidden password shows the `EyeOff` "reveal" affordance, matching the prior FaEyeSlash placement):

```tsx
          {showPassword == false ? (
            <EyeOff
              className="absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            />
          ) : (
            <Eye
              className="absolute right-2 bottom-2.5 h-5 w-5 cursor-pointer text-muted-foreground"
              onClick={() => setShowPassword(!showPassword)}
            />
          )}
```

- [ ] **Step 3: Glass the form card**

Find the outer wrapper `div` (the `return (` root, currently starting `className="flex flex-col bg-card border border-border rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 shadow-xl transition ease-in-out"`). Replace `bg-card border border-border` and `shadow-xl` with `glass`, keeping everything else:

```tsx
    <div className="glass flex flex-col rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 transition ease-in-out">
```

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/jest src/pages/__tests__/Login.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: succeeds (a failed build here usually means a leftover `FaEyeSlash`/`IoEyeSharp` reference — remove it).

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/LoginForm.tsx
git commit -m "feat(design): glass login card + lucide password toggle"
```

---

### Task 2: Register form → glass card + lucide eye toggle

**Files:**
- Modify: `frontend/src/components/RegisterForm.tsx`

- [ ] **Step 1: Read the file**

Read `frontend/src/components/RegisterForm.tsx` in full. It uses the same wrapper pattern and the same `FaEyeSlash`/`IoEyeSharp` toggle idiom as LoginForm (there may be more than one password field — apply the swap to every occurrence).

- [ ] **Step 2: Swap the eye icons for lucide**

Replace the imports:

```tsx
import { FaEyeSlash } from 'react-icons/fa';
import { IoEyeSharp } from 'react-icons/io5';
```

with:

```tsx
import { Eye, EyeOff } from 'lucide-react';
```

For EVERY password toggle in the file, replace `<FaEyeSlash ... />` with `<EyeOff ... />` and `<IoEyeSharp ... />` with `<Eye ... />`, preserving each element's existing `onClick` and position classes and appending `h-5 w-5 cursor-pointer text-muted-foreground` to the className (matching Task 1). Do not change the show/hide state logic.

- [ ] **Step 3: Glass the form card**

Find the root wrapper `div` (`className='flex flex-col bg-card border border-border rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 shadow-xl transition ease-in-out'`). Replace `bg-card border border-border` and `shadow-xl` with `glass`, keeping all layout classes:

```tsx
    <div className='glass flex flex-col rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 justify-start gap-4 transition ease-in-out'>
```

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/jest src/pages/__tests__/Register.test.tsx`
Expected: PASS.
Run: `npm run build`
Expected: succeeds. If it fails on a leftover react-icons reference, remove it.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/components/RegisterForm.tsx
git commit -m "feat(design): glass register card + lucide password toggle"
```

---

### Task 3: ForgotPassword → glass card + fix aurora occlusion

**Files:**
- Modify: `frontend/src/pages/ForgotPassword.tsx`

**Interfaces:**
- Consumes: `.glass`; relies on `Layout`'s `AuroraBackground`.

- [ ] **Step 1: Read the file**

Read `frontend/src/pages/ForgotPassword.tsx` in full. It renders `<Layout>` wrapping an inner `<div className="bg-background min-h-screen ...">` (which occludes the aurora, same bug fixed on the Dashboard) and then the form card.

- [ ] **Step 2: Remove the occluding background**

Change the inner wrapper from:

```tsx
      <div className="bg-background min-h-screen flex justify-center items-center w-full">
```

to (drop `bg-background`; `body` supplies the page background, so the aurora shows through):

```tsx
      <div className="min-h-screen flex justify-center items-center w-full">
```

- [ ] **Step 3: Glass the form card**

Change the form card wrapper from:

```tsx
        <div className='flex flex-col bg-card border border-border rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 gap-4 shadow-xl transition ease-in-out'>
```

to:

```tsx
        <div className='glass flex flex-col rounded-2xl p-4 w-3/4 md:w-1/2 lg:w-1/4 gap-4 transition ease-in-out'>
```

- [ ] **Step 4: Verify**

Run: `./node_modules/.bin/jest` (full suite — this page has no dedicated test; confirm nothing regressed)
Expected: `Test Suites:` all passed.
Run: `npm run build`
Expected: succeeds.

- [ ] **Step 5: Commit**

```bash
git add frontend/src/pages/ForgotPassword.tsx
git commit -m "feat(design): glass forgot-password card, unblock aurora"
```

---

### Task 4: ResetPassword → aurora + glass card + lucide icons

**Files:**
- Modify: `frontend/src/pages/ResetPassword.tsx`

**Interfaces:**
- Consumes: `AuroraBackground` (from `@/components/ui/AuroraBackground`), `.glass`, lucide `Eye`/`EyeOff`/`X`.

ResetPassword does not use `Layout`, so it must render its own aurora and a transparent root. Read the full file first — it has two password fields (password + confirmation) and close/dismiss icons on an expired-link notice.

- [ ] **Step 1: Read the file**

Read `frontend/src/pages/ResetPassword.tsx` in full. Note its current root wrapper element and every icon usage (`FaEyeSlash`, `IoEyeSharp`, `FaTimes`, `IoMdClose`).

- [ ] **Step 2: Swap imports**

Replace:

```tsx
import { IoEyeSharp } from "react-icons/io5";
import { FaEyeSlash, FaTimes } from "react-icons/fa";
import { IoMdClose } from "react-icons/io";
```

with:

```tsx
import { Eye, EyeOff, X } from "lucide-react";
```

Add the aurora import alongside the existing UI imports:

```tsx
import { AuroraBackground } from "@/components/ui/AuroraBackground";
```

- [ ] **Step 3: Swap icon usages**

- Every `<FaEyeSlash ... />` → `<EyeOff ... />`, every `<IoEyeSharp ... />` → `<Eye ... />` (both password + confirmation fields), preserving `onClick`/position classes and appending `h-5 w-5 cursor-pointer text-muted-foreground`.
- Every `<FaTimes ... />` and `<IoMdClose ... />` → `<X ... />`, preserving existing `onClick` and className.

- [ ] **Step 4: Add aurora + transparent root + glass card**

Locate the outermost returned element (the page root `div`). If it carries `bg-background`, remove that class so the aurora shows. Insert `<AuroraBackground />` as the first child of that root. Then find the form/content card wrapper (the `bg-card border border-border ... shadow-xl` block, mirroring the other three pages) and replace `bg-card border border-border` and `shadow-xl` with `glass`, keeping layout classes. If the root is not `position`-establishing, ensure content sits above the `-z-10` aurora — the aurora uses `-z-10` and a transparent root is sufficient (same pattern as `Layout`); do not add extra z-index unless a live check shows content behind the aurora.

- [ ] **Step 5: Verify**

Run: `./node_modules/.bin/jest` (full suite; confirm no regression — ResetPassword logic is unchanged)
Expected: all suites pass.
Run: `npm run build`
Expected: succeeds. Remove any leftover react-icons reference if it fails.

- [ ] **Step 6: Commit**

```bash
git add frontend/src/pages/ResetPassword.tsx
git commit -m "feat(design): reset-password aurora + glass card + lucide icons"
```

---

### Task 5: Auth cluster verification (live)

**Files:** none (verification only)

- [ ] **Step 1: Full suite + build**

From `frontend/`: `./node_modules/.bin/jest` → all suites pass. `npm run build` → succeeds.

- [ ] **Step 2: Confirm no dead react-icons imports remain in the four auth files**

Run: `grep -rn "react-icons" frontend/src/components/LoginForm.tsx frontend/src/components/RegisterForm.tsx frontend/src/pages/ForgotPassword.tsx frontend/src/pages/ResetPassword.tsx`
Expected: no output (all swapped).

- [ ] **Step 3: Live both-theme smoke**

Start `npm run dev`. Visit `/login`, `/register`, `/forgotpassword`, and a `/resetpassword/<anything>` route. In light AND dark confirm: form cards read as frosted glass floating over the visible aurora, password eye toggles show lucide icons and still toggle visibility, primary submit buttons glow on hover, no horizontal scroll, focus rings visible. (Auth API calls will error without a backend — that's fine; the visual system is the target.)

- [ ] **Step 4: Confirm design-sync untouched**

Run: `git status .design-sync` → clean.

---

## Self-Review

- **Spec coverage:** glass on auth cards (T1-T4), lucide icons replacing react-icons (T1,T2,T4), aurora visible on all four pages (T3 fixes occlusion, T4 adds aurora to the Layout-less page), glow inherited from the `Button` primitive (no task needed), a11y focus rings preserved (constraints + T5). No mono work — no currency on these pages.
- **Placeholders:** none — exact files, exact class strings, exact import swaps. T4's root-element edit is described against the file read at execution because the exact root markup is read in Step 1.
- **Consistency:** the same `glass` swap recipe and the same lucide icon mapping (`Eye`/`EyeOff`/`X`) across all four files; `AuroraBackground` import path matches the one Layout uses.
