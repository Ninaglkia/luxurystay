"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

const sections = [
  {
    title: "1. Definizioni",
    content: `Ai fini dei presenti Termini di Servizio, si intende per:

- "LuxuryStay" o "Piattaforma": il sito web e l'applicazione gestiti da LuxuryStay S.r.l., con sede legale in Via Roma 42, 20121 Milano (MI), Italia.
- "Utente": qualsiasi persona fisica o giuridica che accede e utilizza la Piattaforma.
- "Host": l'utente che pubblica un annuncio di alloggio sulla Piattaforma.
- "Ospite": l'utente che effettua una prenotazione di un alloggio sulla Piattaforma.
- "Prenotazione": l'accordo tra Host e Ospite per il soggiorno in un alloggio, concluso tramite la Piattaforma.
- "Contenuto": testi, immagini, recensioni e qualsiasi altro materiale pubblicato dagli utenti sulla Piattaforma.`,
  },
  {
    title: "2. Uso del servizio",
    content: `L'utilizzo della Piattaforma \u00e8 soggetto ai seguenti termini:

- L'utente deve avere almeno 18 anni di et\u00e0 per registrarsi e utilizzare i servizi.
- Le informazioni fornite durante la registrazione devono essere veritiere, accurate e aggiornate.
- L'utente \u00e8 responsabile della riservatezza delle proprie credenziali di accesso.
- \u00c8 vietato utilizzare la Piattaforma per scopi illeciti, fraudolenti o in violazione dei diritti di terzi.
- LuxuryStay si riserva il diritto di sospendere o cancellare gli account che violano i presenti termini.
- L'utente si impegna a non utilizzare sistemi automatizzati per accedere alla Piattaforma senza autorizzazione scritta.`,
  },
  {
    title: "3. Prenotazioni",
    content: `Le prenotazioni sulla Piattaforma sono regolate come segue:

- L'Ospite pu\u00f2 prenotare un alloggio selezionando le date, il numero di ospiti e confermando la richiesta.
- La prenotazione si considera confermata al momento della ricezione della email di conferma.
- L'Ospite \u00e8 tenuto a rispettare le regole della struttura stabilite dall'Host.
- L'Host \u00e8 tenuto a garantire che l'alloggio corrisponda alla descrizione pubblicata sulla Piattaforma.
- LuxuryStay funge da intermediario e non \u00e8 parte del contratto di soggiorno tra Host e Ospite.
- In caso di controversie tra Host e Ospite, LuxuryStay potr\u00e0 intervenire come mediatore ma non \u00e8 obbligata a farlo.`,
  },
  {
    title: "4. Pagamenti",
    content: `I pagamenti sulla Piattaforma sono gestiti come segue:

- L'Ospite paga l'importo totale della prenotazione al momento della conferma, salvo diversa indicazione.
- I pagamenti vengono elaborati tramite fornitori di servizi di pagamento certificati e sicuri.
- L'Host riceve il pagamento entro 48 ore dal check-in dell'Ospite, al netto delle commissioni della Piattaforma.
- LuxuryStay applica una commissione di servizio sia all'Ospite che all'Host, i cui importi sono indicati prima della conferma della prenotazione.
- In caso di pagamento rifiutato, la prenotazione non sar\u00e0 confermata.
- Le fatture e le ricevute sono disponibili nella dashboard dell'utente.`,
  },
  {
    title: "5. Cancellazioni e rimborsi",
    content: `La politica di cancellazione prevede:

- Cancellazione gratuita entro 48 ore dalla prenotazione, a condizione che il check-in sia almeno 14 giorni dopo.
- Per cancellazioni successive, si applicano le condizioni specifiche della struttura, visibili al momento della prenotazione.
- In caso di cancellazione da parte dell'Host, l'Ospite ricever\u00e0 un rimborso completo e assistenza per trovare un alloggio alternativo.
- I rimborsi vengono elaborati entro 5-10 giorni lavorativi sullo stesso metodo di pagamento utilizzato per la prenotazione.
- In caso di circostanze eccezionali (calamit\u00e0 naturali, pandemie, ecc.), LuxuryStay potr\u00e0 applicare politiche di cancellazione straordinarie.
- Le spese di servizio della Piattaforma non sono rimborsabili, salvo cancellazione entro il periodo gratuito.`,
  },
  {
    title: "6. Responsabilit\u00e0",
    content: `LuxuryStay opera come piattaforma di intermediazione e pertanto:

- Non \u00e8 responsabile della qualit\u00e0, sicurezza o conformit\u00e0 degli alloggi pubblicati dagli Host.
- Non garantisce la disponibilit\u00e0 continua e ininterrotta della Piattaforma.
- Non \u00e8 responsabile di danni diretti o indiretti derivanti dall'utilizzo della Piattaforma o dal soggiorno presso gli alloggi.
- L'Host \u00e8 il solo responsabile della conformit\u00e0 del proprio alloggio alle normative locali, fiscali e di sicurezza.
- L'Ospite \u00e8 responsabile del rispetto delle regole della struttura e di eventuali danni causati durante il soggiorno.
- LuxuryStay si impegna a verificare l'identit\u00e0 degli Host e la veridicit\u00e0 degli annunci, ma non pu\u00f2 garantire l'assenza di errori o inesattezze.

Per qualsiasi domanda relativa ai presenti Termini di Servizio, contattare: legale@luxurystay.it

Ultimo aggiornamento: Marzo 2026`,
  },
];

export default function TerminiPage() {
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
            Termini di Servizio
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
