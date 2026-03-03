# Requirements: LuxuryStay AI Concierge

**Defined:** 2026-03-03
**Core Value:** Gli ospiti ricevono risposte immediate e contestuali alle loro domande, con accesso ai dati reali delle proprietà

## v1 Requirements

### Security & Infrastructure

- [x] **SEC-01**: API key AI mai esposta lato client — tutte le chiamate AI passano per server-side API route
- [x] **SEC-02**: Rate limiting per utenti anonimi per prevenire abuso e costi esplosivi
- [x] **SEC-03**: Protezione anti prompt-injection nel system prompt (no dati sensibili nel prompt, input sanitization)
- [x] **SEC-04**: Edge runtime con streaming per rispettare timeout Vercel e garantire risposte fluide
- [x] **SEC-05**: Utenti anonimi non possono accedere a dati di booking, pagamenti o info personali

### AI Chat — Property FAQ

- [x] **FAQ-01**: User può chiedere info su check-in/check-out e ricevere dati reali dalla proprietà
- [x] **FAQ-02**: User può chiedere servizi disponibili (WiFi, parcheggio, piscina, ecc.) con dati da Supabase
- [x] **FAQ-03**: User può chiedere regole della casa e ricevere risposte accurate dalla proprietà specifica
- [x] **FAQ-04**: User può chiedere la posizione e indicazioni per raggiungere la proprietà
- [x] **FAQ-05**: Il chatbot risponde SOLO con dati reali da Supabase, mai inventando informazioni

### AI Chat — Booking Support

- [x] **BOOK-01**: User loggato può chiedere lo stato della propria prenotazione
- [x] **BOOK-02**: User loggato può chiedere info su pagamenti (deposito versato, saldo rimanente)
- [x] **BOOK-03**: User può chiedere la politica di cancellazione della proprietà
- [x] **BOOK-04**: User può chiedere come modificare o cancellare una prenotazione (con link alle azioni)
- [x] **BOOK-05**: User può chiedere aiuto nel processo di prenotazione (disponibilità, prezzi)

### AI Chat — Concierge

- [x] **CONC-01**: User può chiedere raccomandazioni di ristoranti vicini alla proprietà
- [x] **CONC-02**: User può chiedere info su trasporti (come arrivare, taxi, noleggio auto)
- [x] **CONC-03**: User può chiedere esperienze locali e attività (spiagge, escursioni, musei)
- [x] **CONC-04**: Il chatbot fornisce suggerimenti contestuali basati sulla posizione della proprietà

### AI Chat — Persona & UX

- [x] **UX-01**: Il chatbot ha una persona luxury coerente con il brand LuxuryStay
- [x] **UX-02**: Il chatbot mostra suggested chips/quick replies per guidare la conversazione
- [x] **UX-03**: Il chatbot ha un fallback graceful quando non può rispondere (suggerisce contatto diretto)
- [x] **UX-04**: Le risposte sono in streaming (appaiono progressivamente, non tutto insieme)
- [x] **UX-05**: La cronologia chat persiste durante la sessione del browser

### UI — Chat Widget

- [x] **UI-01**: Bubble flottante in basso a destra visibile su tutte le pagine
- [x] **UI-02**: La bubble si apre in una finestra di chat overlay
- [x] **UI-03**: La bubble è lazy-loaded (non impatta il caricamento iniziale della pagina)
- [x] **UI-04**: La chat nella bubble è responsive e funziona su mobile
- [x] **UI-05**: User può minimizzare/chiudere la bubble e riaprirla senza perdere la conversazione

### UI — Chat Page

- [x] **PAGE-01**: Pagina dedicata `/chat` con interfaccia full-screen
- [x] **PAGE-02**: La pagina `/chat` è accessibile sia da utenti loggati che anonimi
- [x] **PAGE-03**: Layout ottimizzato per conversazioni lunghe con auto-scroll
- [x] **PAGE-04**: Input area con supporto per invio con Enter e pulsante send

### Access Control

- [x] **AUTH-01**: Utenti anonimi ricevono risposte base (info proprietà generali, concierge)
- [x] **AUTH-02**: Utenti loggati ricevono accesso completo (booking status, pagamenti, dati personali)
- [x] **AUTH-03**: Il livello di accesso è determinato server-side, mai dal client
- [x] **AUTH-04**: Middleware aggiornato per permettere accesso anonimo a `/chat` e `/api/chat`

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
| SEC-01 | Phase 1 | Complete |
| SEC-04 | Phase 1 | Complete |
| SEC-02 | Phase 2 | Complete |
| SEC-03 | Phase 2 | Complete |
| SEC-05 | Phase 2 | Complete |
| AUTH-01 | Phase 3 | Complete |
| AUTH-02 | Phase 3 | Complete |
| AUTH-03 | Phase 3 | Complete |
| AUTH-04 | Phase 3 | Complete |
| FAQ-01 | Phase 4 | Complete |
| FAQ-02 | Phase 4 | Complete |
| FAQ-03 | Phase 4 | Complete |
| FAQ-04 | Phase 4 | Complete |
| FAQ-05 | Phase 4 | Complete |
| BOOK-01 | Phase 5 | Complete |
| BOOK-02 | Phase 5 | Complete |
| BOOK-03 | Phase 5 | Complete |
| BOOK-04 | Phase 5 | Complete |
| BOOK-05 | Phase 5 | Complete |
| CONC-01 | Phase 6 | Complete |
| CONC-02 | Phase 6 | Complete |
| CONC-03 | Phase 6 | Complete |
| CONC-04 | Phase 6 | Complete |
| UX-01 | Phase 7 | Complete |
| UX-02 | Phase 7 | Complete |
| UX-03 | Phase 7 | Complete |
| UX-04 | Phase 7 | Complete |
| UX-05 | Phase 7 | Complete |
| UI-01 | Phase 8 | Complete |
| UI-02 | Phase 8 | Complete |
| UI-03 | Phase 8 | Complete |
| UI-04 | Phase 8 | Complete |
| UI-05 | Phase 8 | Complete |
| PAGE-01 | Phase 9 | Complete |
| PAGE-02 | Phase 9 | Complete |
| PAGE-03 | Phase 9 | Complete |
| PAGE-04 | Phase 9 | Complete |

**Coverage:**
- v1 requirements: 37 total
- Mapped to phases: 37
- Unmapped: 0

---
*Requirements defined: 2026-03-03*
*Last updated: 2026-03-03 after roadmap creation — all requirements mapped*
