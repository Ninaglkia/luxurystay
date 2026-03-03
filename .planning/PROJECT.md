# LuxuryStay — AI Concierge Chatbot

## What This Is

Un chatbot AI integrato nella piattaforma LuxuryStay che funge da concierge digitale per gli ospiti. Il chatbot è collegato ai dati reali delle proprietà su Supabase e fornisce assistenza su informazioni proprietà, supporto prenotazioni e raccomandazioni locali. Disponibile come bubble flottante su tutte le pagine e come pagina dedicata `/chat`.

## Core Value

Gli ospiti ricevono risposte immediate e contestuali alle loro domande, con accesso ai dati reali delle proprietà (prezzi, disponibilità, regole), riducendo il carico di lavoro manuale del supporto clienti.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Autenticazione utenti con Supabase (email/password, Google OAuth) — existing
- ✓ Listing proprietà con dettagli, foto e mappa — existing
- ✓ Sistema di booking con pagamento Stripe (deposito/saldo) — existing
- ✓ Dashboard dual-mode (guest/host) — existing
- ✓ PWA con manifest e service worker — existing
- ✓ Mappa interattiva con Mapbox — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] AI chatbot con risposte contestuali basate sui dati delle proprietà
- [ ] Bubble widget flottante presente su tutte le pagine
- [ ] Pagina dedicata `/chat` per conversazioni a schermo intero
- [ ] Accesso differenziato: risposte base per anonimi, accesso completo per utenti loggati
- [ ] Integrazione con Supabase per dati reali (proprietà, prezzi, disponibilità)
- [ ] Supporto booking: aiuto con prenotazioni, pagamenti, cancellazioni
- [ ] Funzione concierge: raccomandazioni ristoranti, trasporti, esperienze locali
- [ ] Info proprietà: check-in, servizi, regole della casa, posizione
- [ ] Cronologia chat per sessione (non persistente)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Live chat con operatore umano — focus su AI automatica per v1
- Persistenza cronologia chat su database — non richiesta, solo sessione
- Notifiche push dal chatbot — non necessarie per v1
- Chatbot multilingua — italiano prima, altre lingue in futuro
- Training custom del modello AI — uso API standard con context injection

## Context

- **Stack esistente:** Next.js 16, React 19, TypeScript, Supabase, Stripe, Tailwind CSS 4, Mapbox
- **Architettura:** App Router con Server Components, API routes, middleware auth Supabase SSR
- **Database:** Supabase PostgreSQL con tabelle proprietà, bookings, profili utente
- **Deploy:** Vercel (configurato)
- **Il chatbot è un'aggiunta** al sistema esistente, non una riscrittura. Si integra con le API e i dati già presenti.

## Constraints

- **Tech stack**: Deve usare lo stack esistente (Next.js, Supabase, Tailwind) — consistenza
- **AI Provider**: Da scegliere il migliore per rapporto qualità/prezzo (OpenAI o Anthropic)
- **Performance**: Il chatbot non deve rallentare il caricamento delle pagine — lazy loading
- **Costi**: Le chiamate AI devono essere ottimizzate per contenere i costi (caching, token limits)
- **Sicurezza**: Gli utenti anonimi non devono poter accedere a dati sensibili (booking, pagamenti)

## Key Decisions

<!-- Decisions that constrain future work. Add throughout project lifecycle. -->

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| AI chatbot (no umano) | Scalabile, disponibile 24/7, costi inferiori | — Pending |
| Dati reali da Supabase | Risposte accurate e contestuali | — Pending |
| Bubble + pagina dedicata | Accessibilità massima senza compromettere UX | — Pending |
| Accesso differenziato anon/auth | Sicurezza dati sensibili + onboarding visitatori | — Pending |
| Cronologia solo sessione | Semplicità implementativa, nessun storage aggiuntivo | — Pending |

---
*Last updated: 2026-03-03 after initialization*
