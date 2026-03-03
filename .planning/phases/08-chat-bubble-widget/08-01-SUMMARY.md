---
phase: 08-chat-bubble-widget
plan: 01
subsystem: ui
tags: [framer-motion, next-dynamic, lazy-loading, fab, chat-bubble]

requires:
  - phase: 07-chat-persona-and-ux-behaviors
    provides: ChatWidget component with useChat, chips, messages, input, session persistence
provides:
  - Floating chat bubble FAB visible on all pages
  - AnimatePresence overlay rendering ChatWidget on demand
  - Lazy-loaded ChatBubbleWrapper using next/dynamic ssr:false
  - Root layout wiring for global availability
affects: [09-dedicated-chat-page]

tech-stack:
  added: []
  patterns: [next-dynamic-ssr-false-wrapper, fab-with-animatepresence, dvh-mobile-keyboard-safety]

key-files:
  created:
    - src/app/components/chat-bubble.tsx
    - src/app/components/chat-bubble-wrapper.tsx
  modified:
    - src/app/layout.tsx

key-decisions:
  - "Inline SVG icons for FAB — no icon library dependency for two simple shapes"
  - "dvh units for overlay height — adapts to iOS keyboard without JS resize listeners"
  - "env(safe-area-inset-bottom) in style prop — ensures bubble sits above iPhone home bar"

patterns-established:
  - "Client wrapper shim pattern: thin 'use client' component holds next/dynamic call so Server Component layout can use ssr:false"
  - "AnimatePresence with keyed motion.div for conditional mount/unmount with exit animations"

requirements-completed: [UI-01, UI-02, UI-03, UI-04, UI-05]

duration: 1 min
completed: 2026-03-03
---

# Phase 08 Plan 01: Chat Bubble Widget Summary

**Lazy-loaded floating chat FAB with spring-animated overlay wrapping ChatWidget, wired into root layout via next/dynamic ssr:false wrapper**

## Performance

- **Duration:** 1 min
- **Started:** 2026-03-03T13:58:43Z
- **Completed:** 2026-03-03T13:59:56Z
- **Tasks:** 3 (2 auto + 1 checkpoint auto-approved)
- **Files modified:** 3

## Accomplishments
- Floating action button (FAB) visible in bottom-right corner on every page with safe-area-inset support
- AnimatePresence spring animation for chat overlay panel (slide up from bottom-right, slide down on close)
- ChatWidget lazy-loaded via next/dynamic with ssr:false — zero impact on first contentful paint
- Mobile-safe overlay using 80dvh to keep input visible when virtual keyboard opens
- usePathname guard hides bubble on /chat route to avoid overlap with dedicated chat page

## Task Commits

Each task was committed atomically:

1. **Task 1: Create ChatBubble component (FAB button + AnimatePresence overlay)** - `d8db44a` (feat)
2. **Task 2: Create ChatBubbleWrapper shim + wire into layout.tsx** - `d2f5a15` (feat)
3. **Task 3: Human verify (auto-approved)** - No commit (checkpoint)

## Files Created/Modified
- `src/app/components/chat-bubble.tsx` - FAB button with toggle icons + AnimatePresence overlay wrapping ChatWidget
- `src/app/components/chat-bubble-wrapper.tsx` - Thin 'use client' shim with next/dynamic ssr:false and loading:()=>null
- `src/app/layout.tsx` - Added ChatBubbleWrapper import and JSX after {children}

## Decisions Made
- Used inline SVG paths for chat bubble and close icons instead of adding an icon library — keeps bundle small for two simple shapes
- Used dvh (dynamic viewport height) for overlay panel height — automatically adapts when iOS keyboard opens without JavaScript resize listeners
- Used env(safe-area-inset-bottom) in CSS to position bubble and overlay above the iPhone home bar indicator
- ChatBubbleWrapper follows the "client wrapper shim" pattern — a thin 'use client' boundary that holds the next/dynamic call so the Server Component layout.tsx can remain a Server Component

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Phase 08 complete — chat bubble widget is globally available on all pages
- Phase 09 (Dedicated Chat Page) can proceed; the /chat route guard in ChatBubble is already in place to hide the bubble on that page

---
*Phase: 08-chat-bubble-widget*
*Completed: 2026-03-03*
