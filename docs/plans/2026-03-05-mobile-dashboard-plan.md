# Mobile-First Dashboard Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the current desktop-oriented dashboard with a mobile-first app-style interface with bottom tab nav, dual Guest/Host mode, real messaging, and AI concierge.

**Architecture:** 4 main tab pages under `/dashboard` with a unified bottom nav (mobile) / compact sidebar (desktop). Mode context switches tabs and content. New `conversations` + `messages` Supabase tables with RLS and Realtime for guest-host messaging. AI chatbot pinned as special contact.

**Tech Stack:** Next.js 16 App Router, React 19, Tailwind CSS 4, Supabase (auth, DB, Realtime), Framer Motion, shadcn/ui

---

## Task 1: Database Migration — conversations + messages tables

**Files:**
- Create: `supabase/migrations/20260305_conversations_messages.sql`

**Step 1: Create migration file**

```sql
-- conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id) ON DELETE SET NULL,
  guest_id UUID NOT NULL,
  host_id UUID NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_conversations_guest ON conversations(guest_id);
CREATE INDEX idx_conversations_host ON conversations(host_id);
CREATE INDEX idx_conversations_last_msg ON conversations(last_message_at DESC);
CREATE INDEX idx_messages_conversation ON messages(conversation_id, created_at);
CREATE INDEX idx_messages_sender ON messages(sender_id);

-- RLS
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Conversation policies: user must be guest or host
CREATE POLICY "Users can view own conversations"
  ON conversations FOR SELECT
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Users can create conversations"
  ON conversations FOR INSERT
  WITH CHECK (auth.uid() = guest_id OR auth.uid() = host_id);

CREATE POLICY "Users can update own conversations"
  ON conversations FOR UPDATE
  USING (auth.uid() = guest_id OR auth.uid() = host_id);

-- Message policies: user must be participant in conversation
CREATE POLICY "Users can view messages in own conversations"
  ON messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.guest_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can send messages in own conversations"
  ON messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id
    AND EXISTS (
      SELECT 1 FROM conversations c
      WHERE c.id = conversation_id
      AND (c.guest_id = auth.uid() OR c.host_id = auth.uid())
    )
  );

CREATE POLICY "Users can update own messages"
  ON messages FOR UPDATE
  USING (auth.uid() = sender_id);

-- Enable Realtime on messages
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
```

**Step 2: Run migration against Supabase**

Run: `npx supabase db push` or apply via Supabase dashboard SQL editor.

**Step 3: Commit**

```bash
git add supabase/migrations/20260305_conversations_messages.sql
git commit -m "feat: add conversations and messages tables with RLS and Realtime"
```

---

## Task 2: Redesign Navigation — Bottom Tab Bar + Compact Sidebar

**Files:**
- Modify: `src/app/dashboard/components/mobile-nav.tsx` (full rewrite)
- Modify: `src/app/dashboard/components/sidebar.tsx` (full rewrite to compact)
- Modify: `src/app/dashboard/layout.tsx` (remove Header, simplify layout)
- Delete: `src/app/dashboard/components/header.tsx` (no longer needed)

**Step 1: Rewrite mobile-nav.tsx**

New bottom tab bar with 4 tabs per mode (no mode toggle pill at top — moved to profile page). Unread badge on Messaggi. Icons change filled/outlined based on active state.

Guest tabs: Esplora (`/`), Soggiorni (`/dashboard`), Messaggi (`/dashboard/messages`), Profilo (`/dashboard/profile`)
Host tabs: Prenotazioni (`/dashboard`), Messaggi (`/dashboard/messages`), Proprietà (`/dashboard/properties`), Profilo (`/dashboard/profile`)

Tab bar: fixed bottom, white bg, border-t, h-16, safe-area-pb. No floating mode toggle.

**Step 2: Rewrite sidebar.tsx to compact sidebar**

Compact sidebar (w-20) with centered icons + tiny labels below. Same tabs as mobile. Logo at top (just icon/initials). No user profile block — that's in the profile page now.

**Step 3: Update layout.tsx**

- Remove `<Header>` component import and usage
- Remove `<Footer>` from layout
- Adjust main padding: `pb-20` mobile for bottom nav, `lg:pl-20` for compact sidebar
- Content centered with `max-w-2xl mx-auto` on desktop for app feel

**Step 4: Delete header.tsx**

No longer needed — the header info (logo, user) is in the nav and profile page.

**Step 5: Commit**

```bash
git add -A src/app/dashboard/components/mobile-nav.tsx src/app/dashboard/components/sidebar.tsx src/app/dashboard/layout.tsx
git rm src/app/dashboard/components/header.tsx
git commit -m "feat: redesign nav to bottom tab bar (mobile) + compact sidebar (desktop)"
```

---

## Task 3: Dashboard Home — Soggiorni (Guest) / Prenotazioni (Host)

**Files:**
- Modify: `src/app/dashboard/page.tsx` (full rewrite)

**Step 1: Rewrite dashboard/page.tsx**

Replace current stats-heavy dashboard with booking list view.

**Guest mode — "I miei soggiorni":**
- Title "I miei soggiorni" (large, bold)
- Horizontal scroll filter chips: `Tutti`, `In arrivo`, `In corso`, `Completati`, `Cancellati`
- Booking cards: compact horizontal layout
  - Left: property photo thumbnail (w-20 h-20 rounded-xl)
  - Center: property title (bold), dates (check-in – check-out), price
  - Right: status badge (colored pill)
  - Tap navigates to `/dashboard/bookings/[id]`
- Empty state: illustration + "Esplora alloggi" CTA

**Host mode — "Prenotazioni":**
- Title "Prenotazioni" (large, bold)
- Filter chips: `Tutti`, `In attesa`, `Confermati`, `Completati`, `Cancellati`
- Booking cards:
  - Left: guest avatar (circular, initials fallback)
  - Center: property name, guest name (colored link), dates
  - Right: amount + status badge
  - Status badge at top-left of card (like screenshot: "Rifiutato", "Scaduto")
  - Date boxes: "Inizio [date]" → "Fine [date]" (like screenshot)
- Pending bookings show Accept/Reject buttons

Reuse existing data fetching logic from current page.tsx and host-dashboard.tsx but with new UI.

**Step 2: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: redesign dashboard home with booking list view for guest and host"
```

---

## Task 4: Messages List Page

**Files:**
- Modify: `src/app/dashboard/messages/page.tsx` (full rewrite)
- Create: `src/lib/conversations.ts` (helper functions)

**Step 1: Create conversations helper**

`src/lib/conversations.ts` — functions for:
- `getConversations(userId)` — fetch all conversations with last message preview, other party name/avatar, unread count
- `getOrCreateConversation(guestId, hostId, propertyId)` — find existing or create new
- `markAsRead(conversationId, userId)` — mark all messages as read

**Step 2: Rewrite messages/page.tsx**

- Title "Messaggi" (large, bold)
- Filter chips: `Tutti`, `Alloggi`, `Supporto`
- Pinned row at top: "Assistenza LuxuryStay" with LuxuryStay logo avatar, subtitle "Chiedi al concierge AI", always present
  - Tap navigates to `/dashboard/messages/ai`
- Below: real conversations from Supabase
  - Each row: avatar (circular) + name + last message preview (truncated, gray) + date (relative) + unread count badge
  - Tap navigates to `/dashboard/messages/[conversationId]`
- Empty state (no conversations): just the AI assistant row + "Nessuna conversazione"
- Subscribe to Supabase Realtime for new messages (update list live)

**Step 3: Commit**

```bash
git add src/lib/conversations.ts src/app/dashboard/messages/page.tsx
git commit -m "feat: add messages list with AI concierge pinned contact and real conversations"
```

---

## Task 5: Chat Page — Single Conversation + AI Chat

**Files:**
- Create: `src/app/dashboard/messages/[id]/page.tsx`
- Create: `src/app/dashboard/messages/ai/page.tsx`

**Step 1: Create AI chat page**

`src/app/dashboard/messages/ai/page.tsx` — wraps existing ChatWidget in a full-page layout with:
- Back arrow → `/dashboard/messages`
- Header: LuxuryStay logo avatar + "Assistenza LuxuryStay" + "Online" status
- Full-height ChatWidget below

**Step 2: Create conversation chat page**

`src/app/dashboard/messages/[id]/page.tsx`:
- Back arrow → `/dashboard/messages`
- Header: other party avatar + name + property name subtitle
- Message list: scrollable, grouped by date
  - Sent messages: right-aligned, primary bg
  - Received messages: left-aligned, neutral bg
  - Timestamps below each message
- Input bar at bottom: text input + send button
- Supabase Realtime subscription for live messages
- Mark messages as read on mount
- Auto-scroll to bottom on new messages

**Step 3: Commit**

```bash
git add src/app/dashboard/messages/ai/page.tsx src/app/dashboard/messages/\[id\]/page.tsx
git commit -m "feat: add chat pages for AI concierge and real conversations"
```

---

## Task 6: Properties Page (Host)

**Files:**
- Create: `src/app/dashboard/properties/page.tsx`

**Step 1: Create properties page**

- Title "Proprietà" with count badge
- Vertical card list:
  - Large photo (aspect-[16/9] rounded-xl)
  - Below photo: title (bold) + category chip + price/night + status badge (Attiva/In pausa)
  - Tap → `/dashboard/property/[id]` (existing route)
- FAB bottom-right: floating "+" button → `/dashboard/add-property`
  - Position: fixed, bottom-24 (above tab bar), right-4
  - Style: primary color, rounded-full, w-14 h-14, shadow-lg
- Empty state: house icon + "Pubblica il tuo primo immobile" + CTA button

Reuse property fetching logic from existing host-dashboard.tsx.

**Step 2: Commit**

```bash
git add src/app/dashboard/properties/page.tsx
git commit -m "feat: add properties list page for host mode with FAB"
```

---

## Task 7: Profile Page

**Files:**
- Create: `src/app/dashboard/profile/page.tsx`
- Modify: `src/app/dashboard/components/profile-dashboard.tsx` (adapt to new design)

**Step 1: Create profile page (server component)**

`src/app/dashboard/profile/page.tsx` — similar to current settings/page.tsx but routes to new ProfileView component.

**Step 2: Redesign profile view**

New design (white bg, like screenshot):
- Top: large avatar (w-20 h-20 rounded-full) + full name + email
- Menu list (white bg cards with icon + label + chevron right):
  - Modifica profilo → inline expand or navigate to edit
  - Account → show account info
  - I miei documenti → placeholder
  - Feedback → placeholder
  - Aiuto → placeholder
  - Legale → `/termini`
  - Informativa sulla privacy → `/privacy`
- Divider
- Mode switch card (colored border, like screenshot):
  - Guest mode active: "Modalità Ospite" title (primary color) + toggle ON
    - Description: "Passa alla modalità Host per gestire le tue proprietà e guadagnare"
  - Host mode active: "Modalità Host" title (primary color) + toggle ON
    - Description: "Passa alla modalità Ospite per prenotare soggiorni"
  - Toggle switches mode via useMode()
- Footer: "Versione app 1.0.0" left + "Esci" right (red text)

**Step 3: Commit**

```bash
git add src/app/dashboard/profile/page.tsx src/app/dashboard/components/profile-dashboard.tsx
git commit -m "feat: add profile page with menu list and mode switch card"
```

---

## Task 8: Cleanup + Route Redirects

**Files:**
- Modify: `src/app/dashboard/settings/page.tsx` (redirect to /dashboard/profile)
- Remove old unused components if safe

**Step 1: Add redirect from /settings to /profile**

```typescript
import { redirect } from "next/navigation";
export default function SettingsPage() {
  redirect("/dashboard/profile");
}
```

**Step 2: Verify all routes work**

- `/dashboard` → Soggiorni (guest) / Prenotazioni (host)
- `/dashboard/messages` → Conversation list
- `/dashboard/messages/ai` → AI chat
- `/dashboard/messages/[id]` → Conversation chat
- `/dashboard/properties` → Property list (host)
- `/dashboard/profile` → Profile + settings
- `/dashboard/bookings/[id]` → Booking detail (existing, keep)
- `/dashboard/add-property` → Add property (existing, keep)
- `/dashboard/settings` → Redirect to profile

**Step 3: Commit**

```bash
git add -A
git commit -m "chore: add settings→profile redirect and cleanup old routes"
```

---

## Task 9: Integration Test + Polish

**Step 1: Manual testing checklist**

- [ ] Guest mode: bottom nav shows Esplora, Soggiorni, Messaggi, Profilo
- [ ] Host mode: bottom nav shows Prenotazioni, Messaggi, Proprietà, Profilo
- [ ] Desktop: compact sidebar instead of bottom nav
- [ ] Soggiorni page loads bookings with filters
- [ ] Prenotazioni page loads host bookings with filters
- [ ] Messages page shows AI assistant pinned + real conversations
- [ ] AI chat page works (existing ChatWidget)
- [ ] Properties page shows host properties with FAB
- [ ] Profile page shows user info + mode toggle
- [ ] Mode toggle switches between Guest/Host
- [ ] Navigation active states correct
- [ ] Mobile safe areas (bottom nav doesn't overlap content)
- [ ] Responsive at all breakpoints (375px, 768px, 1024px, 1440px)

**Step 2: Fix any issues found**

**Step 3: Final commit**

```bash
git add -A
git commit -m "fix: polish dashboard UI and fix responsive issues"
```

---

## Dependency Graph

```
Task 1 (DB migration) ──┐
                         ├── Task 4 (Messages list) ── Task 5 (Chat pages)
Task 2 (Navigation) ────┤
                         ├── Task 3 (Dashboard home)
                         ├── Task 6 (Properties page)
                         └── Task 7 (Profile page)
                                                        Task 8 (Cleanup)
                                                        Task 9 (Polish)
```

Tasks 1 and 2 are independent and can run in parallel.
Tasks 3, 4, 6, 7 depend on Task 2 (navigation) and can run in parallel.
Task 5 depends on Tasks 1 and 4.
Tasks 8 and 9 are sequential, after all others.
