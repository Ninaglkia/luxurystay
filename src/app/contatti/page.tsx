"use client";

import { useState, useEffect, FormEvent } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function ContattiPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    setSuccess(false);

    const { error: insertError } = await supabase
      .from("contacts")
      .insert({ name, email, subject, message });

    if (insertError) {
      setError("Si \u00e8 verificato un errore. Riprova pi\u00f9 tardi.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

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

        {/* Title */}
        <section className="max-w-5xl mx-auto px-4 lg:px-6 pt-12 pb-8 text-center">
          <h1 className="text-4xl lg:text-5xl font-bold text-neutral-900 tracking-tight mb-4">
            Contattaci
          </h1>
          <p className="text-lg text-neutral-500 max-w-xl mx-auto">
            Hai una domanda o hai bisogno di assistenza? Compila il modulo e ti risponderemo al pi&ugrave; presto.
          </p>
        </section>

        {/* Content */}
        <section className="max-w-5xl mx-auto px-4 lg:px-6 pb-20">
          <div className="grid lg:grid-cols-5 gap-12">
            {/* Form - left side */}
            <div className="lg:col-span-3">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Nome
                  </label>
                  <input
                    id="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Il tuo nome"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tuo@email.com"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Oggetto
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Oggetto del messaggio"
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-neutral-700 mb-1.5">
                    Messaggio
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Scrivi il tuo messaggio..."
                    className="w-full px-4 py-2.5 border border-neutral-300 rounded-lg text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent transition-colors resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
                    {error}
                  </p>
                )}

                {success && (
                  <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded-lg px-4 py-2.5">
                    Messaggio inviato con successo! Ti risponderemo al pi&ugrave; presto.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full px-6 py-3 bg-neutral-900 text-white text-sm font-medium rounded-lg hover:bg-neutral-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? "Invio in corso..." : "Invia messaggio"}
                </button>
              </form>
            </div>

            {/* Info - right side */}
            <div className="lg:col-span-2">
              <div className="bg-neutral-50 rounded-2xl p-8 border border-neutral-200 space-y-8">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Email</h3>
                  <p className="text-sm text-neutral-500">info@luxurystay.it</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Telefono</h3>
                  <p className="text-sm text-neutral-500">+39 02 1234 5678</p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Indirizzo</h3>
                  <p className="text-sm text-neutral-500">
                    Via Roma 42<br />
                    20121 Milano (MI)<br />
                    Italia
                  </p>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 mb-2">Orari di assistenza</h3>
                  <p className="text-sm text-neutral-500">
                    Luned&igrave; - Venerd&igrave;: 9:00 - 18:00<br />
                    Sabato: 9:00 - 13:00<br />
                    Domenica: Chiuso
                  </p>
                </div>
              </div>
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
