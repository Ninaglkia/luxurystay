# Phase 2: Security Hardening - Context

**Gathered:** 2026-03-03
**Status:** Ready for planning

<domain>
## Phase Boundary

Proteggere l'endpoint `/api/chat` con rate limiting, difesa prompt injection e confine dati per utenti anonimi. Copre SEC-02, SEC-03, SEC-05. Non include access control (Phase 3) né UI (Phase 8+).

</domain>

<decisions>
## Implementation Decisions

### Rate Limiting
- 15 richieste/minuto per utenti anonimi
- 30 richieste/minuto per utenti loggati (doppio)
- Risposta: HTTP 429 standard — il frontend (Phase 8) gestirà la visualizzazione
- Implementazione: nel middleware (intercetta prima dell'endpoint, più efficiente)

### Prompt Injection Protection
- Difesa a più livelli: validazione input + istruzioni difensive nel system prompt
- Risposta gentile di rifiuto — il bot non esegue ma risponde educatamente
- Logging: console.warn con IP e messaggio — visibile nei log Vercel

### Confine Dati Anonimi
- Invito a fare login quando anonimo chiede info booking/pagamenti — con link alla pagina login
- Enforcement a entrambi i livelli: system prompt differenziato + codice non inietta dati sensibili per anonimi
- Solo booking, pagamenti e dati personali sono sensibili — prezzi, disponibilità e servizi delle proprietà sono pubblici (come il sito)

### Claude's Discretion
- Scelta dello storage per rate limiting (Upstash Redis, in-memory Map, ecc.)
- Pattern esatti per rilevamento prompt injection
- Formato preciso delle istruzioni difensive nel system prompt
- Strategia di logging (livello di dettaglio)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/middleware.ts`: Middleware Supabase esistente — già chiama `getUser()`, può essere esteso per rate limiting e rilevamento auth tier
- `src/app/api/chat/route.ts`: Endpoint attuale senza protezioni — punto di integrazione per validazione input e system prompt differenziato

### Established Patterns
- Middleware matcher: `/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)$).*)` — cattura tutte le route non-statiche
- Supabase auth: `supabase.auth.getUser()` già disponibile nel middleware — riutilizzabile per determinare auth tier
- maxOutputTokens: 500 già impostato per controllo costi

### Integration Points
- Il middleware è il punto naturale per rate limiting (pre-route)
- Il route handler `/api/chat` è dove aggiungere validazione input e system prompt differenziato
- L'oggetto `user` dal middleware può essere passato al route handler per determinare il tier

</code_context>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches per security best practices su Next.js + Vercel.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-security-hardening*
*Context gathered: 2026-03-03*
