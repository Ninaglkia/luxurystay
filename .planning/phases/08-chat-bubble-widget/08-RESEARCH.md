# Phase 08: Chat Bubble Widget - Research

**Researched:** 2026-03-03
**Domain:** Next.js App Router lazy loading, floating UI, framer-motion AnimatePresence, mobile viewport
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| UI-01 | Bubble flottante in basso a destra visibile su tutte le pagine | Fixed-position Tailwind classes (`fixed bottom-6 right-6 z-50`); placed in `layout.tsx` body |
| UI-02 | La bubble si apre in una finestra di chat overlay | `AnimatePresence` + `motion.div` sliding panel wrapping `ChatWidget` from Phase 7 |
| UI-03 | La bubble è lazy-loaded (non impatta il caricamento iniziale della pagina) | `next/dynamic` with `ssr: false` inside a `'use client'` wrapper; bubble absent from initial HTML |
| UI-04 | La chat nella bubble è responsive e funziona su mobile | `dvh` units, `max-h-[dvh]`, `safe-area-inset-bottom` env var; tested on iOS Safari |
| UI-05 | User può minimizzare/chiudere la bubble e riaprirla senza perdere la conversazione | `ChatWidget` persists messages in `sessionStorage`; `isOpen` state lives in `ChatBubbleWrapper` |
</phase_requirements>

---

## Summary

Phase 8 wraps the existing `ChatWidget` component (built in Phase 7) in a floating chat bubble that appears on every page of the app. The core engineering work is threefold: (1) lazy-loading the widget so it has zero impact on first contentful paint, (2) wiring the open/close toggle with an animated overlay, and (3) ensuring the overlay is fully usable on mobile where the virtual keyboard shrinks the viewport.

The existing project already has `framer-motion` (v12) installed and uses `AnimatePresence` in `add-property-flow.tsx`, making it the natural choice for the entry/exit animation on the overlay panel. The `ChatWidget` already persists messages to `sessionStorage`, so conversation persistence (UI-05) is already solved — the bubble wrapper only needs to manage the `isOpen` boolean.

The critical architectural constraint is that `layout.tsx` is currently a Server Component. Adding `next/dynamic` with `ssr: false` requires it to live inside a `'use client'` wrapper component, not directly in `layout.tsx` itself (the official docs explicitly state `ssr: false` is not allowed in Server Components). The correct pattern is: create a `ChatBubbleWrapper` client component that uses `next/dynamic` internally, then import that wrapper into `layout.tsx` — keeping the layout itself a Server Component.

**Primary recommendation:** Create a `ChatBubbleWrapper` ('use client') that uses `next/dynamic(() => import('./chat-bubble'), { ssr: false })` and place it inside `layout.tsx`'s `<body>` after `{children}`. The `ChatBubble` component manages open/close state and renders `ChatWidget` inside an `AnimatePresence`-driven overlay.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `next/dynamic` | bundled with Next.js 16.1.6 | Lazy-load the bubble component | Official Next.js API; splits chat JS out of initial bundle |
| `framer-motion` | ^12.34.3 (already installed) | Animate overlay open/close | Already used in project; `AnimatePresence` handles mount/unmount transitions cleanly |
| Tailwind CSS | ^4 (already installed) | Styling, responsive layout | Already project standard; `fixed`, `bottom-6`, `right-6`, `z-50`, `h-dvh` utilities |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `sessionStorage` (browser native) | N/A | Conversation persistence | Already implemented in `ChatWidget`; no additional library needed |
| CSS `env(safe-area-inset-bottom)` | CSS standard | iPhone notch/home bar clearance | Applied to bubble button bottom offset on mobile |
| `dvh` viewport unit | CSS standard (Tailwind `h-dvh`) | Overlay height that accounts for virtual keyboard | Use instead of `vh` or `100vh` on mobile to avoid keyboard overlap |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `next/dynamic` with `ssr: false` | `React.lazy` + `Suspense` | `React.lazy` also works in App Router client components but `next/dynamic` is the idiomatic Next.js API and integrates with webpack chunk naming |
| `framer-motion` `AnimatePresence` | CSS transitions / `useState` with `transition` | AnimatePresence handles unmount animations — without it the exit animation is skipped when `isOpen` becomes false |
| Tailwind `h-dvh` | JS `visualViewport` listener | `dvh` is the 2025 CSS standard; no JavaScript needed; supported in iOS Safari 15.4+ and all modern browsers |

**Installation:**
```bash
# No new packages needed — all dependencies already in the project
# framer-motion ^12.34.3 is already installed
# next/dynamic is bundled with next 16.1.6
```

---

## Architecture Patterns

### Recommended Project Structure
```
src/app/
├── layout.tsx                          # Server Component — imports ChatBubbleWrapper
└── components/
    ├── chat-bubble-wrapper.tsx         # 'use client' — uses next/dynamic with ssr:false
    ├── chat-bubble.tsx                 # 'use client' — FAB button + overlay + AnimatePresence
    ├── chat-widget.tsx                 # Already exists (Phase 7) — unchanged
    ├── chat-messages.tsx               # Already exists (Phase 7) — unchanged
    ├── chat-input.tsx                  # Already exists (Phase 7) — unchanged
    └── chat-chips.tsx                  # Already exists (Phase 7) — unchanged
```

### Pattern 1: Two-Layer Lazy Loading (Server Layout + Client Wrapper)

**What:** `layout.tsx` stays a Server Component. It imports `ChatBubbleWrapper`, which is a `'use client'` component. Inside that wrapper, `next/dynamic` with `ssr: false` dynamically imports `ChatBubble`. This two-layer approach is required because `ssr: false` cannot be used in Server Components.

**When to use:** Any time you need to lazy-load a purely-browser widget from a Server Component layout.

**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading (official Next.js docs)

// src/app/components/chat-bubble-wrapper.tsx
'use client'

import dynamic from 'next/dynamic'

const ChatBubble = dynamic(() => import('./chat-bubble'), {
  ssr: false,
  loading: () => null, // render nothing while loading — no layout shift
})

export default function ChatBubbleWrapper() {
  return <ChatBubble />
}
```

```typescript
// src/app/layout.tsx — stays a Server Component (no 'use client')
import ChatBubbleWrapper from './components/chat-bubble-wrapper'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="it">
      <body className={...}>
        {children}
        <ChatBubbleWrapper />
        {/* existing service worker script */}
      </body>
    </html>
  )
}
```

### Pattern 2: AnimatePresence Overlay (Slide Up from Bottom)

**What:** `ChatBubble` manages `isOpen` state. `AnimatePresence` keeps the overlay in the DOM while the exit animation runs. The panel slides in from `y: '100%'` and exits back down.

**When to use:** When a panel needs smooth enter/exit transitions and should unmount from the DOM when closed (to avoid trapping focus or creating invisible inputs).

**Example:**
```typescript
// Source: framer-motion already imported from "framer-motion" in project
// Pattern confirmed by add-property-flow.tsx usage in this codebase

// src/app/components/chat-bubble.tsx
'use client'

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import ChatWidget from './chat-widget'

export default function ChatBubble() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      {/* Floating action button */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        aria-label={isOpen ? 'Chiudi chat' : 'Apri chat'}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full
                   bg-neutral-900 text-white shadow-lg
                   flex items-center justify-center
                   hover:bg-neutral-700 transition-colors
                   focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-neutral-900"
        style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
      >
        {/* Chat icon or X icon */}
      </button>

      {/* Animated overlay panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="chat-overlay"
            initial={{ opacity: 0, y: '100%' }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-24 right-6 z-40
                       w-[calc(100vw-3rem)] max-w-sm
                       h-[min(600px,80dvh)]
                       rounded-2xl shadow-2xl overflow-hidden"
          >
            <ChatWidget />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
```

### Pattern 3: Hiding Bubble on Specific Pages

**What:** If the bubble should be hidden on `/chat` (Phase 9's dedicated page), the `ChatBubble` client component can use `usePathname` to self-suppress. This avoids making `layout.tsx` a client component.

**When to use:** When a layout element should not appear on specific routes.

**Example:**
```typescript
// Inside ChatBubble component
'use client'
import { usePathname } from 'next/navigation'

export default function ChatBubble() {
  const pathname = usePathname()

  // Hide on the dedicated chat page — full-screen chat doesn't need the bubble
  if (pathname === '/chat') return null

  // ... rest of component
}
```

### Anti-Patterns to Avoid

- **Adding `'use client'` directly to `layout.tsx`:** This converts the entire layout subtree to client-side rendering, breaking Server Component benefits for all pages. Never do this just to use `useState` or `next/dynamic`.
- **Using `ssr: false` directly in a Server Component:** Next.js will throw a build error. The `ssr: false` option only works inside `'use client'` components.
- **Using `100vh` for overlay height on mobile:** On iOS Safari, `100vh` equals the layout viewport height, which does not shrink when the keyboard appears. The chat input gets hidden behind the keyboard. Use `80dvh` or `h-dvh` instead.
- **Placing `ChatWidget` outside `AnimatePresence`:** If the widget is always mounted, the `useChat` hook and `sessionStorage` are initialized immediately on page load, negating the lazy-load benefit. Mount `ChatWidget` only when the bubble is first opened.
- **Forgetting `key` prop on the `motion.div` inside `AnimatePresence`:** Without a stable `key`, `AnimatePresence` cannot detect when the child appears/disappears and exit animations will not fire.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Enter/exit animation on unmount | Custom CSS transition + `setTimeout` before unmount | `framer-motion AnimatePresence` | React removes components immediately; `AnimatePresence` holds them in DOM until animation completes — impossible to replicate cleanly with CSS alone |
| Code splitting the chat widget | Manual webpack dynamic import config | `next/dynamic` | Handles chunk naming, Suspense integration, and SSR boundary automatically |
| Mobile keyboard viewport adjustment | `window.visualViewport` JS listener | `dvh` CSS unit | Zero JS, supported iOS Safari 15.4+; simpler and more reliable |
| Conversation persistence | Custom event bus or context between sessions | Existing `sessionStorage` in `ChatWidget` | Already implemented in Phase 7; just don't destroy the component unnecessarily |

**Key insight:** The hardest part of this phase — overlay animations with unmount transitions — is fully handled by `framer-motion`. The persistence problem is already solved by Phase 7. This phase is primarily assembly work: wire existing pieces together with the correct lazy-loading boundary.

---

## Common Pitfalls

### Pitfall 1: ssr: false in Server Component Causes Build Error
**What goes wrong:** Developer puts `next/dynamic(() => import('./chat-bubble'), { ssr: false })` directly in `layout.tsx`, which is a Server Component. Next.js throws: `ssr: false is not allowed with next/dynamic in Server Components`.
**Why it happens:** `ssr: false` disables server-side prerendering, which is a client-side concern and cannot be expressed in Server Components.
**How to avoid:** Create a `'use client'` wrapper (`chat-bubble-wrapper.tsx`) that performs the dynamic import with `ssr: false`. Import this wrapper from `layout.tsx`.
**Warning signs:** Build error mentioning `ssr: false` + `Server Components`.

### Pitfall 2: Chat Overlay Input Hidden Behind Mobile Keyboard
**What goes wrong:** On iOS Safari, the chat input at the bottom of the overlay is obscured by the virtual keyboard when the user taps into the text field. The overlay does not shrink.
**Why it happens:** Fixed elements are positioned relative to the layout viewport, which iOS does not resize when the keyboard opens. `100vh` / `100%` does not account for the keyboard.
**How to avoid:** Use `h-[min(600px,80dvh)]` for the overlay height and `max-h-dvh` as a safeguard. `dvh` (dynamic viewport height) shrinks with the keyboard on iOS 15.4+ and Android.
**Warning signs:** QA on a real iPhone shows input invisible when keyboard opens.

### Pitfall 3: Exit Animation Skipped
**What goes wrong:** Closing the bubble makes the panel disappear instantly with no slide-out animation.
**Why it happens:** The `motion.div` is a direct child of `AnimatePresence` but is missing the `key` prop. Without a stable `key`, `AnimatePresence` cannot track when the child leaves.
**How to avoid:** Always add `key="chat-overlay"` (or any stable string) to the `motion.div` that is the immediate child of `AnimatePresence`.
**Warning signs:** Open animation works; close animation is instant (no transition).

### Pitfall 4: ChatWidget Mounts on Page Load (Defeats Lazy Loading)
**What goes wrong:** Lighthouse reports the chat JS bundle is in the initial page load. The widget does not appear in the initial HTML but is still in the initial JavaScript bundle.
**Why it happens:** `ChatWidget` is always rendered (even when the overlay is closed), so `next/dynamic` cannot defer it — the component is needed immediately.
**How to avoid:** Only render `<ChatWidget />` inside the `AnimatePresence` conditional block (`{isOpen && <motion.div>...<ChatWidget /></motion.div>}`). On first open, the widget chunk is fetched and `sessionStorage` is read. The `messages` array in `ChatWidget` uses `loadFromSession` as initial state, so history is restored on first open.
**Warning signs:** Chrome DevTools network tab shows `chat-widget.js` chunk loading on initial page load before the bubble is clicked.

### Pitfall 5: Z-index Conflict with Existing Modals
**What goes wrong:** The chat overlay appears behind the cancel-booking modal or other overlays.
**Why it happens:** `cancel-booking-modal.tsx` uses `z-50`. The chat overlay and FAB button need consistent z-index layers.
**How to avoid:** FAB button at `z-50`, overlay at `z-40` (below the FAB, which controls it). If another modal needs to be on top, ensure it uses `z-50` or higher. Document z-index conventions.
**Warning signs:** Chat overlay obscures or is obscured by other modals.

---

## Code Examples

Verified patterns from official sources and project inspection:

### Correct next/dynamic Pattern (from official Next.js 16.1.6 docs)
```typescript
// Source: https://nextjs.org/docs/app/guides/lazy-loading
// chat-bubble-wrapper.tsx
'use client'

import dynamic from 'next/dynamic'

// ssr: false works here because this file is 'use client'
const ChatBubble = dynamic(() => import('./chat-bubble'), {
  ssr: false,
  loading: () => null,
})

export default function ChatBubbleWrapper() {
  return <ChatBubble />
}
```

### framer-motion import (project convention — confirmed in add-property-flow.tsx)
```typescript
// Source: project file src/app/dashboard/components/add-property-flow.tsx
import { motion, AnimatePresence } from 'framer-motion'
```

### AnimatePresence with conditional render (framer-motion pattern)
```typescript
// Source: framer-motion project usage in add-property-flow.tsx + official docs pattern
<AnimatePresence>
  {isOpen && (
    <motion.div
      key="chat-overlay"
      initial={{ opacity: 0, y: '100%' }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: '100%' }}
      transition={{ type: 'spring', damping: 30, stiffness: 300 }}
    >
      <ChatWidget />
    </motion.div>
  )}
</AnimatePresence>
```

### Mobile-safe overlay height (CSS standard)
```css
/* Use Tailwind class: h-[min(600px,80dvh)] */
/* dvh = dynamic viewport height, shrinks when keyboard opens on iOS Safari 15.4+ */
/* Avoids input being hidden behind virtual keyboard */
```

### Safe area inset for iPhone home bar (CSS standard)
```typescript
// Inline style on the FAB button to avoid overlap with iPhone home indicator
style={{ bottom: 'max(1.5rem, env(safe-area-inset-bottom, 1.5rem))' }}
```

### Layout placement (adding bubble to existing layout.tsx)
```typescript
// src/app/layout.tsx — stays Server Component
import ChatBubbleWrapper from './components/chat-bubble-wrapper'

// Inside <body>:
<body className={...}>
  {children}
  <ChatBubbleWrapper />
  <script dangerouslySetInnerHTML={{ __html: `...` }} />
</body>
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `100vh` for mobile overlay | `dvh` (dynamic viewport height) | CSS spec, Tailwind v3.3+ | Keyboard no longer hides input on iOS Safari |
| `framer-motion` package | `motion/react` (rebranded) | 2024 rebranding | Project still uses `framer-motion` which works; do NOT migrate in this phase |
| `React.lazy` only | `next/dynamic` in Next.js | Since Next.js 9 | Next.js-specific features (chunk naming, SSR control) |
| Mounting widget always | Mount only on first open | Best practice | Bundle size stays out of initial load; lazy-load is genuine |

**Deprecated/outdated:**
- `100vh` on mobile: Do not use for panels that contain inputs. Use `dvh` or `min(Npx, 80dvh)`.
- `framer-motion` → `motion/react` rebranding: The project uses `framer-motion` which still works. Do not migrate in this phase — it would be a separate refactor with no functional benefit here.

---

## Open Questions

1. **Should the bubble be hidden on `/chat` page (Phase 9)?**
   - What we know: Phase 9 adds a full-screen `/chat` page; showing the bubble there would create a redundant nested experience.
   - What's unclear: Phase 9 is not yet planned; the requirement could handle it with `usePathname` in Phase 9.
   - Recommendation: Add `if (pathname === '/chat') return null` in `ChatBubble` as a forward-compatible defensive measure. Zero cost now, prevents a future bug.

2. **Should `propertyId` be passed to the bubble's `ChatWidget`?**
   - What we know: `ChatWidget` accepts an optional `propertyId` prop that scopes the `sessionStorage` key and passes context to the API. The bubble is global (not page-specific).
   - What's unclear: On a property detail page, the bubble could inherit the `propertyId`; on other pages it would be `undefined`.
   - Recommendation: For Phase 8, pass no `propertyId` (general chat). Property-aware bubbles are a Phase 9+ concern. This keeps Phase 8 scope tight.

3. **Icon for the FAB button: Lucide, heroicons, or SVG inline?**
   - What we know: The project uses inline SVG in `cancel-booking-modal.tsx` (no icon library installed).
   - What's unclear: Whether a chat icon (speech bubble) or sparkle icon (AI) better matches the luxury brand.
   - Recommendation: Use inline SVG for the chat icon to avoid adding a new dependency. A simple speech-bubble SVG is 3 lines of markup.

---

## Sources

### Primary (HIGH confidence)
- [Next.js 16.1.6 official docs — Lazy Loading guide](https://nextjs.org/docs/app/guides/lazy-loading) — `next/dynamic` API, `ssr: false` constraint in Server Components, loading fallback pattern
- [Next.js 16.1.6 official docs — layout.js file convention](https://nextjs.org/docs/app/api-reference/file-conventions/layout) — Server Component default, how to nest Client Components inside
- Project source `src/app/dashboard/components/add-property-flow.tsx` — confirms `import { motion, AnimatePresence } from 'framer-motion'` is the project's import convention
- Project source `src/app/components/chat-widget.tsx` — confirms `sessionStorage` persistence is already implemented; `ChatWidget` accepts optional `propertyId`

### Secondary (MEDIUM confidence)
- [WebSearch: dvh CSS unit for mobile keyboard](https://www.franciscomoretti.com/blog/fix-mobile-keyboard-overlap-with-visualviewport) — `dvh` as the 2025 standard for keyboard-aware viewport; cross-referenced with MDN and iOS Safari support data
- [WebSearch: framer-motion v12 / motion/react import difference](https://motion.dev/docs/react-upgrade-guide) — confirmed `framer-motion` package still works; project should not migrate in this phase
- [WebSearch: usePathname pattern to hide elements on specific routes](https://nextjs.org/docs/app/api-reference/functions/use-pathname) — official Next.js hook; confirmed as correct approach for route-conditional rendering inside Client Components

### Tertiary (LOW confidence)
- Multiple WebSearch results for `safe-area-inset-bottom` CSS env var — standard Safari/PWA behavior; not verified via official MDN link but well-documented pattern consistent with the project's existing PWA manifest

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — Next.js and framer-motion versions confirmed from `package.json`; APIs verified from official docs
- Architecture: HIGH — Two-layer pattern (Server layout + client wrapper + dynamic import) verified from Next.js official docs; no ambiguity
- Pitfalls: HIGH — `ssr: false` in Server Component is a documented build error (official docs); mobile keyboard/dvh is a well-known CSS issue with a clear modern solution; exit animation key requirement is documented framer-motion behavior
- Mobile viewport: MEDIUM — `dvh` is the correct modern approach (confirmed from multiple sources); iOS Safari 15.4+ support is well-documented, but actual behavior on very old iOS should be manually verified

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (Next.js and framer-motion APIs are stable; 30-day horizon appropriate)
