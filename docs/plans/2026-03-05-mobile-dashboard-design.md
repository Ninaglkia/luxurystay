# Mobile-First Dashboard Redesign

## Summary

Replace current desktop-oriented dashboard with mobile-first app-style interface inspired by car-sharing app UX. Adapted for luxury vacation rentals (villas, houses). Dual-mode Guest/Host with bottom tab navigation on mobile, compact sidebar on desktop.

## Pages

| Route | Guest | Host | Description |
|-------|-------|------|-------------|
| `/dashboard` | Soggiorni | Prenotazioni | Bookings with filter chips and status badges |
| `/dashboard/messages` | Messaggi | Messaggi | Conversation list + AI concierge as pinned contact |
| `/dashboard/messages/[id]` | Chat | Chat | Single conversation thread |
| `/dashboard/properties` | - | Proprietà | Host property list with FAB "Aggiungi" |
| `/dashboard/profile` | Profilo | Profilo | Settings menu + mode toggle card |

## Bottom Tab Bar

Fixed bottom on mobile (<1024px), compact left sidebar on desktop (>=1024px).

**Guest tabs:** Esplora - Soggiorni - Messaggi - Profilo
**Host tabs:** Prenotazioni - Messaggi - Proprietà - Profilo

Unread message badge on Messaggi tab.

## Soggiorni / Prenotazioni

### Guest - "I miei soggiorni"
- Filter chips (horizontal scroll): In arrivo, In corso, Completati, Cancellati, Tutti
- Card: property thumbnail + property name + check-in/out dates + total price + status badge

### Host - "Prenotazioni"
- Filter chips: Tutti, In attesa, Confermati, Completati, Cancellati
- Card: guest avatar + property name + guest name + dates + amount + status badge (colored)
- Badge color: green=confirmed, yellow=pending, red=cancelled, gray=completed

## Messaggi

- Pinned top row: "Assistenza LuxuryStay" with app logo avatar (AI chatbot)
- Below: real conversations sorted by last_message_at DESC
- Each row: avatar + name + message preview (truncated) + date + unread badge
- Filter chips: Tutti, Alloggi, Supporto
- Tap opens `/dashboard/messages/[id]`

### New Supabase Tables

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id UUID REFERENCES properties(id),
  guest_id UUID REFERENCES auth.users(id) NOT NULL,
  host_id UUID REFERENCES auth.users(id) NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) NOT NULL,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS policies: users can only read/write their own conversations
-- Realtime enabled on messages table
```

## Proprietà (Host only)

- Header: "Proprietà" with count
- Vertical list: large photo (16:9) + title + category + price/night + status badge
- FAB bottom-right: "+ Aggiungi" -> `/dashboard/add-property`
- Tap card -> `/dashboard/property/[id]`

## Profilo

- Large avatar + full name + email
- Menu items: Modifica profilo, Account, I miei documenti, Feedback, Aiuto, Legale, Privacy
- Mode switch card at bottom with toggle:
  - Guest: "Passa alla modalità Host per gestire le tue proprietà e guadagnare"
  - Host: "Passa alla modalità Guest per prenotare soggiorni"
- Footer: app version + "Esci" button

## Desktop (>=1024px)

- Bottom bar becomes compact left sidebar (icons + labels, vertical)
- Content centered with max-width 640px (app feel)
- Same components, just repositioned navigation

## Visual Style

- Keep existing LuxuryStay colors (dark blue primary, OKLCH system)
- White background, clean cards with subtle shadows
- Large bold titles
- Rounded corners on cards and chips
- Status badges with semantic colors
- Smooth transitions with Framer Motion (already in stack)

## Tech Stack (existing)

- Next.js 16 App Router
- React 19
- Tailwind CSS 4
- Supabase (auth, database, realtime)
- Framer Motion
- shadcn/ui components
