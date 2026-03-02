"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function ChiSiamoPage() {
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
        <div className="max-w-5xl mx-auto px-4 lg:px-6 pt-6">
          <Link href="/" className="text-sm text-neutral-500 hover:text-neutral-900 transition-colors">
            &larr; Torna alla home
          </Link>
        </div>

        {/* Hero / Mission */}
        <section className="max-w-5xl mx-auto px-4 lg:px-6 pt-12 pb-16 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-6">
            Chi Siamo
          </h1>
          <p className="text-lg lg:text-xl text-neutral-500 max-w-2xl mx-auto leading-relaxed">
            LuxuryStay nasce dalla passione per l&apos;ospitalit&agrave; d&apos;eccellenza.
            La nostra missione &egrave; connettere viaggiatori esigenti con le strutture
            pi&ugrave; esclusive d&apos;Italia, offrendo un&apos;esperienza di prenotazione
            semplice, trasparente e sicura.
          </p>
        </section>

        {/* Valori */}
        <section className="bg-neutral-50 py-16 lg:py-24">
          <div className="max-w-5xl mx-auto px-4 lg:px-6">
            <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">I nostri valori</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: "Eccellenza",
                  desc: "Selezioniamo solo strutture che rispettano i pi\u00f9 alti standard di qualit\u00e0, comfort e design.",
                  icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11.48 3.499a.562.562 0 0 1 1.04 0l2.125 5.111a.563.563 0 0 0 .475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 0 0-.182.557l1.285 5.385a.562.562 0 0 1-.84.61l-4.725-2.885a.562.562 0 0 0-.586 0L6.982 20.54a.562.562 0 0 1-.84-.61l1.285-5.386a.562.562 0 0 0-.182-.557l-4.204-3.602a.562.562 0 0 1 .321-.988l5.518-.442a.563.563 0 0 0 .475-.345L11.48 3.5Z" />
                    </svg>
                  ),
                },
                {
                  title: "Trasparenza",
                  desc: "Prezzi chiari, nessun costo nascosto. Ogni dettaglio della prenotazione \u00e8 visibile fin dal primo momento.",
                  icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  ),
                },
                {
                  title: "Fiducia",
                  desc: "Ogni host \u00e8 verificato, ogni recensione \u00e8 autentica. Costruiamo relazioni basate sulla fiducia reciproca.",
                  icon: (
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75m-3-7.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
                    </svg>
                  ),
                },
              ].map((value, i) => (
                <div
                  key={i}
                  className="bg-white rounded-2xl p-8 border border-neutral-200 text-center"
                >
                  <div className="w-14 h-14 rounded-xl bg-neutral-100 text-neutral-700 flex items-center justify-center mx-auto mb-5">
                    {value.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{value.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{value.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Come funziona - 3 passi */}
        <section className="py-16 lg:py-24">
          <div className="max-w-5xl mx-auto px-4 lg:px-6">
            <h2 className="text-3xl font-bold text-neutral-900 text-center mb-12">Come funziona</h2>
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  step: "1",
                  title: "Esplora",
                  desc: "Naviga la mappa interattiva e trova strutture luxury nella tua destinazione ideale.",
                },
                {
                  step: "2",
                  title: "Scegli",
                  desc: "Confronta foto, servizi, posizione e recensioni per trovare l'alloggio perfetto.",
                },
                {
                  step: "3",
                  title: "Prenota",
                  desc: "Seleziona le date, conferma la prenotazione e preparati per un soggiorno indimenticabile.",
                },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <div className="w-12 h-12 rounded-full bg-neutral-900 text-white flex items-center justify-center mx-auto mb-4 text-lg font-bold">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold text-neutral-900 mb-2">{item.title}</h3>
                  <p className="text-neutral-500 text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Stats */}
        <section className="bg-neutral-900 py-16 lg:py-20">
          <div className="max-w-5xl mx-auto px-4 lg:px-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {[
                { value: "150+", label: "Strutture selezionate" },
                { value: "2.500+", label: "Ospiti soddisfatti" },
                { value: "50+", label: "Destinazioni" },
                { value: "98%", label: "Tasso di soddisfazione" },
              ].map((stat, i) => (
                <div key={i}>
                  <p className="text-3xl lg:text-4xl font-bold text-white mb-1">{stat.value}</p>
                  <p className="text-sm text-neutral-400">{stat.label}</p>
                </div>
              ))}
            </div>
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
