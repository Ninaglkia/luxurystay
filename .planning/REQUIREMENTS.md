# Requirements: LuxuryStay AI Concierge

**Defined:** 2026-03-03
**Core Value:** Gli ospiti ricevono risposte immediate e contestuali alle loro domande, con accesso ai dati reali delle proprietà

## v1 Requirements

### Security & Infrastructure

- [ ] **SEC-01**: API key AI mai esposta lato client — tutte le chiamate AI passano per server-side API route
- [ ] **SEC-02**: Rate limiting per utenti anonimi per prevenire abuso e costi esplosivi
- [ ] **SEC-03**: Protezione anti prompt-injection nel system prompt (no dati sensibili nel prompt, input sanitization)
- [ ] **SEC-04**: Edge runtime con streaming per rispettare timeout Vercel e garantire risposte fluide
- [ ] **SEC-05**: Utenti anonimi non possono accedere a dati di booking, pagamenti o info personali

### AI Chat — Property FAQ

- [ ] **FAQ-01**: User può chiedere info su check-in/check-out e ricevere dati reali dalla proprietà
- [ ] **FAQ-02**: User può chiedere servizi disponibili (WiFi, parcheggio, piscina, ecc.) con dati da Supabase
- [ ] **FAQ-03**: User può chiedere regole della casa e ricevere risposte accurate dalla proprietà specifica
- [ ] **FAQ-04**: User può chiedere la posizione e indicazioni per raggiungere la proprietà
- [ ] **FAQ-05**: Il chatbot risponde SOLO con dati reali da Supabase, mai inventando informazioni

### AI Chat — Booking Support

- [ ] **BOOK-01**: User loggato può chiedere lo stato della propria prenotazione
- [ ] **BOOK-02**: User loggato può chiedere info su pagamenti (deposito versato, saldo rimanente)
- [ ] **BOOK-03**: User può chiedere la politica di cancellazione della proprietà
- [ ] **BOOK-04**: User può chiedere come modificare o cancellare una prenotazione (con link alle azioni)
- [ ] **BOOK-05**: User può chiedere aiuto nel processo di prenotazione (disponibilità, prezzi)

### AI Chat — Concierge

- [ ] **CONC-01**: User può chiedere raccomandazioni di ristoranti vicini alla proprietà
- [ ] **CONC-02**: User può chiedere info su trasporti (come arrivare, taxi, noleggio auto)
- [ ] **CONC-03**: User può chiedere esperienze locali e attività (spiagge, escursioni, musei)
- [ ] **CONC-04**: Il chatbot fornisce suggerimenti contestuali basati sulla posizione della proprietà

### AI Chat — Persona & UX

- [ ] **UX-01**: Il chatbot ha una persona luxury coerente con il brand LuxuryStay
- [ ] **UX-02**: Il chatbot mostra suggested chips/quick replies per guidare la conversazione
- [ ] **UX-03**: Il chatbot ha un fallback graceful quando non può rispondere (suggerisce contatto diretto)
- [ ] **UX-04**: Le risposte sono in streaming (appaiono progressivamente, non tutto insieme)
- [ ] **UX-05**: La cronologia chat persiste durante la sessione del browser

### UI — Chat Widget

- [ ] **UI-01**: Bubble flottante in basso a destra visibile su tutte le pagine
- [ ] **UI-02**: La bubble si apre in una finestra di chat overlay
- [ ] **UI-03**: La bubble è lazy-loaded (non impatta il caricamento iniziale della pagina)
- [ ] **UI-04**: La chat nella bubble è responsive e funziona su mobile
- [ ] **UI-05**: User può minimizzare/chiudere la bubble e riaprirla senza perdere la conversazione

### UI — Chat Page

- [ ] **PAGE-01**: Pagina dedicata `/chat` con interfaccia full-screen
- [ ] **PAGE-02**: La pagina `/chat` è accessibile sia da utenti loggati che anonimi
- [ ] **PAGE-03**: Layout ottimizzato per conversazioni lunghe con auto-scroll
- [ ] **PAGE-04**: Input area con supporto per invio con Enter e pulsante send

### Access Control

- [ ] **AUTH-01**: Utenti anonimi ricevono risposte base (info proprietà generali, concierge)
- [ ] **AUTH-02**: Utenti loggati ricevono accesso completo (booking status, pagamenti, dati personali)
- [ ] **AUTH-03**: Il livello di accesso è determinato server-side, mai dal client
- [ ] **AUTH-04**: Middleware aggiornato per permettere accesso anonimo a `/chat` e `/api/chat`

## v2 Requirements

### Enhancements

- **V2-01**: Persistenza cronologia chat su database per utenti loggati
- **V2-02**: Supporto multilingua (inglese, tedesco, francese)
- **V2-03**: Notifiche push dal chatbot per aggiornamenti booking
- **V2-04**: Analytics delle conversazioni (domande frequenti, satisfaction)
- **V2-05**: Handoff a operatore umano quando il bot non sa rispondere
- **V2-06**: Voice input per accessibilità

## Out of Scope

| Feature | Reason |
|---------|--------|
| Live chat con operatore umano | Complessità infrastrutturale elevata, focus AI per v1 |
| Training custom del modello | Uso API standard con context injection da Supabase |
| Chat persistente su database | Non richiesta — solo sessione per v1 |
| Modifica booking direttamente via chat | Rischio troppo alto — il bot suggerisce link alle azioni |
| Azioni autonome del bot (prenotare, cancellare) | Troppo rischioso senza supervisione umana |
| Voice I/O | Complessità eccessiva per v1 |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| SEC-01 | Phase 1 | Pending |
| SEC-04 | Phase 1 | Pending |
| SEC-02 | Phase 2 | Pending |
| SEC-03 | Phase 2 | Pending |
| SEC-05 | Phase 2 | Pending |
| AUTH-01 | Phase 3 | Pending |
| AUTH-02 | Phase 3 | Pending |
| AUTH-03 | Phase 3 | Pending |
| AUTH-04 | Phase 3 | Pending |
| FAQ-01 | Phase 4 | Pending |
| FAQ-02 | Phase 4 | Pending |
| FAQ-03 | Phase 4 | Pending |
| FAQ-04 | Phase 4 | Pending |
| FAQ-05 | Phase 4 | Pending |
| BOOK-01 | Phase 5 | Pending |
| BOOK-02 | Phase 5 | Pending |
| BOOK-03 | Phase 5 | Pending |
| BOOK-04 | Phase 5 | Pending |
| BOOK-05 | Phase 5 | Pending |
| CONC-01 | Phase 6 | Pending |
| CONC-02 | Phase 6 | Pending |
| CONC-03 | Phase 6 | Pending |
| CONC-04 | Phase 6 | Pending |
| UX-01 | Phase 7 | Pending |
| UX-02 | Phase 7 | Pending |
| UX-03 | Phase 7 | Pending |
| UX-04 | Phase 7 | Pending |
| UX-05 | Phase 7 | Pending |
| UI-01 | Phase 8 | Pending |
| UI-02 | Phase 8 | Pending |
| UI-03 | Phase 8 | Pending |
| UI-04 | Phase 8 | Pending |
| UI-05 | Phase 8 | Pending |
| PAGE-01 | Phase 9 | Pending |
| PAGE-02 | Phase 9 | Pending |
| PAGE-03 | Phase 9 | Pending |
| PAGE-04 | Phase 9 | Pending |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation — all requirements mapped*
