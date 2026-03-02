"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const sections = [
  {
    title: "1. Raccolta dei dati",
    content: `LuxuryStay raccoglie i dati personali degli utenti necessari per l'erogazione dei propri servizi. I dati raccolti includono:

- Dati identificativi: nome, cognome, indirizzo email, numero di telefono.
- Dati di prenotazione: date di soggiorno, numero di ospiti, preferenze relative all'alloggio.
- Dati di pagamento: informazioni sulla carta di credito o altro metodo di pagamento (gestiti tramite fornitori di servizi di pagamento certificati PCI-DSS).
- Dati di navigazione: indirizzo IP, tipo di browser, pagine visitate, durata della sessione.

I dati vengono raccolti quando l'utente si registra, effettua una prenotazione, compila un modulo di contatto o naviga sul sito.`,
  },
  {
    title: "2. Uso dei dati",
    content: `I dati personali raccolti vengono utilizzati per le seguenti finalit\u00e0:

- Gestione delle prenotazioni e comunicazioni relative al soggiorno.
- Creazione e gestione dell'account utente.
- Assistenza clienti e risposta alle richieste di contatto.
- Invio di comunicazioni di servizio (conferme di prenotazione, promemoria, aggiornamenti).
- Miglioramento dei servizi offerti attraverso analisi statistiche aggregate.
- Adempimento degli obblighi di legge e fiscali.

I dati non verranno mai venduti a terzi. Potranno essere condivisi con gli host esclusivamente per le finalit\u00e0 legate alla prenotazione.`,
  },
  {
    title: "3. Cookies",
    content: `Il sito utilizza cookies tecnici e, previo consenso dell'utente, cookies analitici e di profilazione.

- Cookies tecnici: necessari per il funzionamento del sito e la gestione delle sessioni di autenticazione. Non richiedono il consenso dell'utente.
- Cookies analitici: utilizzati per raccogliere informazioni aggregate sull'utilizzo del sito (es. pagine pi\u00f9 visitate, durata media della sessione).
- Cookies di terze parti: il sito potrebbe integrare servizi di terze parti (es. mappe, strumenti di pagamento) che utilizzano i propri cookies.

L'utente pu\u00f2 gestire le preferenze sui cookies tramite le impostazioni del proprio browser o attraverso il banner cookies presente sul sito.`,
  },
  {
    title: "4. Diritti dell'utente",
    content: `In conformit\u00e0 al Regolamento Europeo 2016/679 (GDPR), l'utente ha il diritto di:

- Accesso: ottenere informazioni sui propri dati personali trattati.
- Rettifica: richiedere la correzione di dati inesatti o incompleti.
- Cancellazione: richiedere la cancellazione dei propri dati personali (\u201cdiritto all'oblio\u201d).
- Limitazione del trattamento: richiedere la limitazione del trattamento in determinate circostanze.
- Portabilit\u00e0: ricevere i propri dati in formato strutturato e leggibile da macchina.
- Opposizione: opporsi al trattamento dei dati per finalit\u00e0 di marketing diretto.
- Revoca del consenso: revocare in qualsiasi momento il consenso prestato.

Per esercitare questi diritti, l'utente pu\u00f2 contattarci all'indirizzo privacy@luxurystay.it.`,
  },
  {
    title: "5. Conservazione dei dati",
    content: `I dati personali vengono conservati per il tempo strettamente necessario alle finalit\u00e0 per le quali sono stati raccolti:

- Dati di prenotazione: conservati per 10 anni per obblighi fiscali e contabili.
- Dati dell'account: conservati fino alla cancellazione dell'account da parte dell'utente.
- Dati di navigazione: conservati per un massimo di 12 mesi.
- Dati di contatto (modulo): conservati per 24 mesi dalla ricezione.`,
  },
  {
    title: "6. Contatti",
    content: `Per qualsiasi domanda relativa alla presente informativa sulla privacy o al trattamento dei dati personali, \u00e8 possibile contattare:

LuxuryStay S.r.l.
Via Roma 42, 20121 Milano (MI), Italia
Email: privacy@luxurystay.it
Telefono: +39 02 1234 5678

Responsabile della protezione dei dati (DPO): dpo@luxurystay.it

Ultimo aggiornamento: Marzo 2026`,
  },
];

export default function PrivacyPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* Header */}
      <header className="shrink-0 border-b border-neutral-200 bg-white">
        <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <svg className="w-7 h-7 text-neutral-900" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
            <span className="text-xl font-semibold text-neutral-900 tracking-tight">LuxuryStay</span>
          </Link>
          <div className="flex items-center gap-3">
            {loading ? (
              <div className="w-24 h-9 bg-neutral-100 rounded-lg animate-pulse" />
            ) : user ? (
              <Link
                href="/dashboard"
                className="flex items-center gap-2 bg-neutral-900 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                  {user.user_metadata?.full_name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "U"}
                </div>
                Dashboard
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="px-4 py-2 text-sm font-medium text-neutral-700 hover:text-neutral-900 hover:bg-neutral-100 rounded-lg transition-colors"
                >
                  Accedi
                </Link>
                <Link
                  href="/register"
                  className="px-4 py-2 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  Registrati
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto px-4 lg:px-6 pt-6">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            &larr; Torna alla home
          </Link>
        </div>

        {/* Title */}
        <section className="max-w-3xl mx-auto px-4 lg:px-6 pt-12 pb-8">
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
            Informativa sulla Privacy
          </h1>
          <p className="text-neutral-500">
            Ultimo aggiornamento: Marzo 2026
          </p>
        </section>

        {/* Content */}
        <section className="max-w-3xl mx-auto px-4 lg:px-6 pb-20">
          <div className="space-y-10">
            {sections.map((section, i) => (
              <div key={i}>
                <h2 className="text-xl font-semibold text-neutral-900 mb-4">{section.title}</h2>
                <div className="text-sm text-neutral-600 leading-relaxed whitespace-pre-line">
                  {section.content}
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200 py-8 bg-white">
        <div className="max-w-5xl mx-auto px-4 lg:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-neutral-500">&copy; 2026 LuxuryStay. Tutti i diritti riservati.</p>
          <div className="flex items-center gap-6">
            <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Home</Link>
            <Link href="/chi-siamo" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Chi siamo</Link>
            <Link href="/contatti" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Contatti</Link>
            <Link href="/privacy" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Privacy</Link>
            <Link href="/termini" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">Termini</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
