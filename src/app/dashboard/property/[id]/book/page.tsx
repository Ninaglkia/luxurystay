"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  category: string;
  space_type: string;
  guests: number;
  photos: string[];
  user_id: string;
}

interface HostProfile {
  full_name: string;
  avatar_url: string | null;
}

const categoryIcons: Record<string, string> = {
  casa: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  villa: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
  appartamento: "M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21",
};

const spaceLabels: Record<string, string> = {
  entire: "Intero alloggio", private: "Stanza privata", shared: "Stanza condivisa",
};

export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const checkIn = searchParams.get("checkin") || "";
  const checkOut = searchParams.get("checkout") || "";
  const guestCount = Number(searchParams.get("guests")) || 1;

  const [property, setProperty] = useState<Property | null>(null);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [messageToHost, setMessageToHost] = useState("");
  const [addInsurance, setAddInsurance] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("properties")
        .select("id, title, address, price, category, space_type, guests, photos, user_id")
        .eq("id", id)
        .single();
      if (data) {
        setProperty(data);
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.user_id)
          .single();
        if (profile) setHost(profile);
      }
      setLoading(false);
    }
    load();
  }, [id, supabase]);

  function calculateNights(): number {
    if (!checkIn || !checkOut) return 0;
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  const nights = calculateNights();
  const subtotal = property ? property.price * nights : 0;
  const serviceFee = Math.round(subtotal * 0.12);
  const insuranceFee = addInsurance ? Math.round(subtotal * 0.05) : 0;
  const total = subtotal + serviceFee + insuranceFee;

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  }

  function formatDateRange(): string {
    if (!checkIn || !checkOut) return "—";
    const dIn = new Date(checkIn + "T00:00:00");
    const dOut = new Date(checkOut + "T00:00:00");
    const dayIn = dIn.getDate().toString().padStart(2, "0");
    const dayOut = dOut.getDate().toString().padStart(2, "0");
    const monthIn = dIn.toLocaleDateString("it-IT", { month: "short" });
    const monthOut = dOut.toLocaleDateString("it-IT", { month: "short" });
    const yearOut = dOut.getFullYear();
    if (monthIn === monthOut) {
      return `${dayIn}–${dayOut} ${monthIn} ${yearOut}`;
    }
    return `${dayIn} ${monthIn} – ${dayOut} ${monthOut} ${yearOut}`;
  }

  async function handleConfirm() {
    if (!property || submitting) return;
    setSubmitting(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setError("Devi effettuare l'accesso per prenotare.");
      setSubmitting(false);
      return;
    }

    if (user.id === property.user_id) {
      setError("Non puoi prenotare il tuo stesso alloggio.");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await supabase.from("bookings").insert({
      property_id: property.id,
      guest_id: user.id,
      host_id: property.user_id,
      check_in: checkIn,
      check_out: checkOut,
      guests: guestCount,
      total_price: total,
      status: "pending",
    });

    if (insertError) {
      setError("Errore durante la prenotazione. Riprova.");
      setSubmitting(false);
      return;
    }

    setSuccess(true);
    setSubmitting(false);
  }

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-4">
        <div className="h-6 w-48 bg-neutral-100 rounded animate-pulse mb-8" />
        <div className="grid lg:grid-cols-[1fr_380px] gap-12">
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-24 bg-neutral-100 rounded-xl animate-pulse" />)}
          </div>
          <div className="h-96 bg-neutral-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Annuncio non trovato</h2>
        <button onClick={() => router.push("/dashboard")}
          className="mt-4 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium cursor-pointer">
          Torna alla mappa
        </button>
      </div>
    );
  }

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">Richiesta inviata!</h2>
        <p className="text-neutral-500 mb-1">
          La tua richiesta per <strong className="text-neutral-900">{property.title}</strong> è stata inviata all&apos;host.
        </p>
        <p className="text-neutral-500 text-sm mb-2">
          {formatDate(checkIn)} - {formatDate(checkOut)} · {guestCount} ospite{guestCount > 1 ? "i" : ""}
        </p>
        <p className="text-lg font-semibold text-neutral-900 mb-8">Totale: €{total}</p>
        <div className="flex gap-3">
          <button onClick={() => router.push("/dashboard")}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer">
            Torna alla mappa
          </button>
          <button onClick={() => router.push("/dashboard/bookings")}
            className="px-6 py-3 bg-white border border-neutral-300 text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors cursor-pointer">
            Le mie prenotazioni
          </button>
        </div>
      </div>
    );
  }

  const iconPath = categoryIcons[property.category] || categoryIcons.casa;

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-10">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer shrink-0">
          <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl lg:text-[28px] font-semibold text-neutral-900">Invia una richiesta di prenotazione</h1>
      </div>

      <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-16">
        {/* Left — Booking form */}
        <div className="flex-1 min-w-0">

          {/* Message to host */}
          <div className="pb-8 border-b border-neutral-200">
            <h2 className="text-[22px] font-semibold text-neutral-900 mb-2">Scrivi un messaggio all&apos;host</h2>
            <p className="text-[15px] text-neutral-600 mb-5">
              Prima di continuare, racconta qualcosa sul tuo viaggio a {host?.full_name || "l'host"} e spiega perché questo alloggio fa al caso tuo.
            </p>

            {host && (
              <div className="flex items-center gap-3 mb-5">
                {host.avatar_url ? (
                  <img src={host.avatar_url} alt={host.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-900 flex items-center justify-center">
                    <span className="text-lg font-semibold text-white">{host.full_name?.[0] || "H"}</span>
                  </div>
                )}
                <div>
                  <p className="font-medium text-neutral-900">{host.full_name}</p>
                  <p className="text-sm text-neutral-500">Host su LuxuryStay</p>
                </div>
              </div>
            )}

            <textarea
              value={messageToHost}
              onChange={(e) => setMessageToHost(e.target.value)}
              placeholder={`Esempio: "Ciao ${host?.full_name || ""}, io e il mio partner stiamo cercando un posto dove rilassarci. Il tuo alloggio sembra perfetto per noi!"`}
              className="w-full border border-neutral-300 rounded-xl p-4 text-sm text-neutral-900 placeholder-neutral-400 resize-none h-32 outline-none focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900 transition"
            />
          </div>

          {/* Travel insurance */}
          <div className="py-8 border-b border-neutral-200">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h2 className="text-lg font-semibold text-neutral-900 mb-1">Vuoi aggiungere un&apos;assicurazione di viaggio?</h2>
                <p className="text-sm text-neutral-600">
                  Si, aggiungi per <strong className="text-neutral-900">€{Math.round(subtotal * 0.05)}</strong>.
                  <br />
                  <span className="text-neutral-500">Disponibile solo al momento della prenotazione.</span>
                </p>
              </div>
              <button onClick={() => setAddInsurance(!addInsurance)}
                className={`shrink-0 mt-1 px-5 py-2 rounded-lg text-sm font-medium border transition-all cursor-pointer ${
                  addInsurance
                    ? "bg-neutral-900 text-white border-neutral-900"
                    : "bg-white text-neutral-900 border-neutral-300 hover:bg-neutral-50"
                }`}>
                {addInsurance ? "Aggiunta" : "Aggiungi"}
              </button>
            </div>
          </div>

          {/* Cancellation policy */}
          <div className="py-8 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Politica di cancellazione</h2>
            <p className="text-[15px] text-neutral-600 leading-relaxed">
              <strong className="text-neutral-900">Cancellazione gratuita entro 48 ore dalla prenotazione.</strong>{" "}
              Dopo questo termine, se cancelli prima del check-in, riceverai un rimborso parziale.{" "}
              <span className="underline cursor-pointer text-neutral-900 font-medium">Scopri di più</span>
            </p>
          </div>

          {/* Ground rules */}
          <div className="py-8 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900 mb-3">Regole di base</h2>
            <p className="text-[15px] text-neutral-600 mb-3">
              Chiediamo a tutti gli ospiti di ricordare alcune semplici cose.
            </p>
            <ul className="space-y-2">
              <li className="flex items-start gap-2.5 text-[15px] text-neutral-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                Segui le regole della casa
              </li>
              <li className="flex items-start gap-2.5 text-[15px] text-neutral-700">
                <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-neutral-400 shrink-0" />
                Tratta l&apos;alloggio dell&apos;host come se fosse casa tua
              </li>
            </ul>
          </div>

          {/* Disclaimer + Confirm button */}
          <div className="py-8">
            <p className="text-xs text-neutral-500 leading-relaxed mb-6">
              Cliccando il pulsante qui sotto, accetto le{" "}
              <span className="underline cursor-pointer text-neutral-700">Regole della casa dell&apos;host</span>,{" "}
              <span className="underline cursor-pointer text-neutral-700">le Regole di base per gli ospiti di LuxuryStay</span>{" "}
              e la{" "}
              <span className="underline cursor-pointer text-neutral-700">Politica di rimborso</span>.
              Accetto inoltre di pagare l&apos;importo totale indicato.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button onClick={handleConfirm} disabled={submitting}
              className={`w-full lg:w-auto px-10 py-4 rounded-xl text-base font-semibold transition-all ${
                submitting
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#E61E4D] to-[#D70466] text-white hover:from-[#d41c47] hover:to-[#c2035c] cursor-pointer active:scale-[0.98]"
              }`}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Invio in corso...
                </span>
              ) : (
                "Invia richiesta di prenotazione"
              )}
            </button>

            <p className="text-xs text-neutral-400 mt-3">
              Ottieni un rimborso fino al 100% del costo del tuo soggiorno se effettui la cancellazione entro 48 ore dalla prenotazione.
            </p>
          </div>
        </div>

        {/* Right — Booking summary card (sticky) */}
        <div className="lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              {/* Property preview */}
              <div className="flex gap-4 pb-5 border-b border-neutral-200">
                <div className="w-32 h-24 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                  {property.photos[0] ? (
                    <img src={property.photos[0]} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
                      </svg>
                    </div>
                  )}
                </div>
                <div className="min-w-0 flex flex-col justify-center">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <svg className="w-3.5 h-3.5 text-neutral-500 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d={iconPath} />
                    </svg>
                    <span className="text-xs text-neutral-500">{spaceLabels[property.space_type] || property.space_type}</span>
                  </div>
                  <p className="font-medium text-neutral-900 line-clamp-2 text-[15px]">{property.title}</p>
                </div>
              </div>

              {/* Non-refundable notice */}
              <div className="py-4 border-b border-neutral-200">
                <p className="text-sm text-neutral-600">
                  Questa prenotazione non è rimborsabile.{" "}
                  <span className="underline cursor-pointer text-neutral-900 font-medium">Termini completi</span>
                </p>
              </div>

              {/* Date + Guests */}
              <div className="py-4 border-b border-neutral-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Date</p>
                    <p className="text-sm text-neutral-900">{formatDateRange()}</p>
                  </div>
                  <button onClick={() => router.back()}
                    className="text-sm font-semibold text-neutral-900 underline cursor-pointer hover:text-neutral-600">
                    Modifica
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-neutral-700">Ospiti</p>
                    <p className="text-sm text-neutral-900">{guestCount} adult{guestCount > 1 ? "i" : "o"}</p>
                  </div>
                  <button onClick={() => router.back()}
                    className="text-sm font-semibold text-neutral-900 underline cursor-pointer hover:text-neutral-600">
                    Modifica
                  </button>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="pt-4">
                <h3 className="text-base font-semibold text-neutral-900 mb-4">Dettagli del prezzo</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">{nights} nott{nights === 1 ? "e" : "i"}</span>
                    <span className="text-neutral-900">€{subtotal.toLocaleString("it-IT")}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-neutral-600">Costi del servizio</span>
                    <span className="text-neutral-900">€{serviceFee.toLocaleString("it-IT")}</span>
                  </div>
                  {addInsurance && (
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-600">Assicurazione viaggio</span>
                      <span className="text-neutral-900">€{insuranceFee.toLocaleString("it-IT")}</span>
                    </div>
                  )}
                </div>

                <hr className="border-neutral-200 my-4" />

                <div className="flex justify-between font-semibold">
                  <span className="text-neutral-900">Totale EUR</span>
                  <span className="text-neutral-900">€{total.toLocaleString("it-IT")}</span>
                </div>

                <button className="mt-3 text-sm text-neutral-600 underline cursor-pointer hover:text-neutral-900">
                  Riepilogo dei costi
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
