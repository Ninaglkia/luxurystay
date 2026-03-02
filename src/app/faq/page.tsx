"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

interface FAQItem {
  q: string;
  a: string;
}

interface FAQCategory {
  category: string;
  items: FAQItem[];
}

function AccordionItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-b border-neutral-200">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-5 text-left group"
      >
        <span className="text-sm lg:text-base font-medium text-neutral-900 pr-4">{question}</span>
        <svg
          className={`w-5 h-5 text-neutral-400 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ${open ? "max-h-96 pb-5" : "max-h-0"}`}
      >
        <p className="text-sm text-neutral-500 leading-relaxed">{answer}</p>
      </div>
    </div>
  );
}

const faqData: FAQCategory[] = [
  {
    category: "Prenotazione",
    items: [
      {
        q: "Come posso prenotare un alloggio su LuxuryStay?",
        a: "Puoi prenotare esplorando la mappa interattiva, selezionando la struttura che preferisci, scegliendo le date e il numero di ospiti, e confermando la prenotazione. Puoi anche prenotare come ospite senza creare un account.",
      },
      {
        q: "Devo creare un account per prenotare?",
        a: "No, non \u00e8 obbligatorio. Puoi prenotare come ospite inserendo nome, email e numero di telefono. Tuttavia, con un account puoi gestire le tue prenotazioni, salvare i preferiti e accedere alla cronologia.",
      },
      {
        q: "Posso prenotare per conto di un'altra persona?",
        a: "S\u00ec, puoi inserire i dati dell'ospite principale al momento della prenotazione. Assicurati che il nome e i contatti siano quelli della persona che soggiorner\u00e0.",
      },
      {
        q: "Come ricevo la conferma della prenotazione?",
        a: "Dopo la prenotazione riceverai una email di conferma con tutti i dettagli: indirizzo, date, istruzioni per il check-in e contatti dell'host.",
      },
    ],
  },
  {
    category: "Pagamento",
    items: [
      {
        q: "Quali metodi di pagamento accettate?",
        a: "Accettiamo carte di credito e debito (Visa, Mastercard, American Express) e PayPal. Tutti i pagamenti sono protetti con crittografia SSL.",
      },
      {
        q: "Quando viene addebitato l'importo?",
        a: "L'importo viene addebitato al momento della conferma della prenotazione. Per soggiorni superiori a 7 notti, \u00e8 possibile suddividere il pagamento in due rate.",
      },
      {
        q: "I prezzi includono le tasse?",
        a: "S\u00ec, i prezzi mostrati sono comprensivi di IVA e tasse di soggiorno, salvo diversa indicazione nella pagina della struttura.",
      },
    ],
  },
  {
    category: "Host",
    items: [
      {
        q: "Come posso diventare un host su LuxuryStay?",
        a: "Registra un account, accedi alla dashboard e clicca su \"Aggiungi propriet\u00e0\". Inserisci le informazioni sulla tua struttura, carica le foto e imposta il prezzo. Il nostro team verificher\u00e0 la struttura prima della pubblicazione.",
      },
      {
        q: "Quali commissioni applica LuxuryStay agli host?",
        a: "LuxuryStay applica una commissione competitiva sul totale della prenotazione. I dettagli esatti sono visibili nella sezione host della dashboard.",
      },
      {
        q: "Posso gestire pi\u00f9 propriet\u00e0?",
        a: "S\u00ec, puoi aggiungere e gestire quante propriet\u00e0 desideri dalla tua dashboard. Ogni propriet\u00e0 avr\u00e0 il proprio calendario, tariffe e impostazioni.",
      },
    ],
  },
  {
    category: "Cancellazioni",
    items: [
      {
        q: "Posso cancellare una prenotazione?",
        a: "S\u00ec, puoi cancellare dalla tua dashboard o contattando il nostro supporto. La politica di rimborso dipende dai termini della struttura e dal preavviso.",
      },
      {
        q: "Entro quanto tempo posso cancellare gratuitamente?",
        a: "La cancellazione gratuita \u00e8 generalmente disponibile entro 48 ore dalla prenotazione, purch\u00e9 il check-in sia almeno 14 giorni dopo. Le condizioni specifiche sono indicate nella pagina della struttura.",
      },
      {
        q: "Come funziona il rimborso in caso di cancellazione?",
        a: "Il rimborso viene elaborato entro 5-10 giorni lavorativi sullo stesso metodo di pagamento utilizzato. Riceverai un'email di conferma con i dettagli del rimborso.",
      },
    ],
  },
];

export default function FAQPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("Prenotazione");
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  const activeFaq = faqData.find((c) => c.category === activeCategory);

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
        <section className="max-w-3xl mx-auto px-4 lg:px-6 pt-12 pb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
            Domande Frequenti
          </h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto">
            Trova le risposte alle domande pi&ugrave; comuni su prenotazioni, pagamenti, hosting e cancellazioni.
          </p>
        </section>

        {/* Category tabs */}
        <div className="max-w-3xl mx-auto px-4 lg:px-6 mb-8">
          <div className="flex flex-wrap gap-2 justify-center">
            {faqData.map((cat) => (
              <button
                key={cat.category}
                onClick={() => setActiveCategory(cat.category)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeCategory === cat.category
                    ? "bg-neutral-900 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {cat.category}
              </button>
            ))}
          </div>
        </div>

        {/* Accordion */}
        <section className="max-w-3xl mx-auto px-4 lg:px-6 pb-20">
          <div className="border-t border-neutral-200">
            {activeFaq?.items.map((item, i) => (
              <AccordionItem key={i} question={item.q} answer={item.a} />
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
