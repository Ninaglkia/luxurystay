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
  guests: number;
  photos: string[];
  user_id: string;
}

export default function BookingPage() {
  const { id } = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const checkIn = searchParams.get("checkin") || "";
  const checkOut = searchParams.get("checkout") || "";
  const guestCount = Number(searchParams.get("guests")) || 1;

  const [property, setProperty] = useState<Property | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("properties")
        .select("id, title, address, price, category, guests, photos, user_id")
        .eq("id", id)
        .single();
      if (data) setProperty(data);
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
  const total = subtotal + serviceFee;

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
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
      <div className="max-w-4xl mx-auto py-4">
        <div className="h-6 w-32 bg-neutral-100 rounded animate-pulse mb-8" />
        <div className="grid lg:grid-cols-2 gap-12">
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-20 bg-neutral-100 rounded-xl animate-pulse" />)}
          </div>
          <div className="h-80 bg-neutral-100 rounded-xl animate-pulse" />
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
        <h2 className="text-2xl font-bold text-neutral-900 mb-3">Prenotazione confermata!</h2>
        <p className="text-neutral-500 mb-1">
          La tua richiesta per <strong className="text-neutral-900">{property.title}</strong> è stata inviata.
        </p>
        <p className="text-neutral-500 text-sm mb-2">
          {formatDate(checkIn)} → {formatDate(checkOut)} · {guestCount} ospite{guestCount > 1 ? "i" : ""}
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

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={() => router.back()}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer shrink-0">
          <svg className="w-5 h-5 text-neutral-900" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
          </svg>
        </button>
        <h1 className="text-2xl lg:text-[32px] font-semibold text-neutral-900">Conferma e paga</h1>
      </div>

      <div className="flex flex-col-reverse lg:flex-row gap-8 lg:gap-16">
        {/* Left — Trip details */}
        <div className="flex-1 min-w-0">
          {/* Trip summary */}
          <div className="pb-6 border-b border-neutral-200">
            <h2 className="text-[22px] font-semibold text-neutral-900 mb-5">Il tuo viaggio</h2>

            <div className="space-y-5">
              {/* Dates */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Date</p>
                  <p className="text-sm text-neutral-600 mt-0.5">{formatDate(checkIn)} – {formatDate(checkOut)}</p>
                </div>
                <button onClick={() => router.back()}
                  className="text-sm font-semibold text-neutral-900 underline cursor-pointer hover:text-neutral-600">
                  Modifica
                </button>
              </div>

              {/* Guests */}
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium text-neutral-900">Ospiti</p>
                  <p className="text-sm text-neutral-600 mt-0.5">{guestCount} ospite{guestCount > 1 ? "i" : ""}</p>
                </div>
                <button onClick={() => router.back()}
                  className="text-sm font-semibold text-neutral-900 underline cursor-pointer hover:text-neutral-600">
                  Modifica
                </button>
              </div>
            </div>
          </div>

          {/* Cancellation policy */}
          <div className="py-6 border-b border-neutral-200">
            <h2 className="text-[22px] font-semibold text-neutral-900 mb-3">Politica di cancellazione</h2>
            <p className="text-[15px] text-neutral-600 leading-relaxed">
              <strong className="text-neutral-900">Cancellazione gratuita entro 48 ore dalla prenotazione.</strong>{" "}
              Dopo questo termine, se cancelli prima del check-in, riceverai un rimborso parziale.
              <span className="underline cursor-pointer ml-1">Scopri di più</span>
            </p>
          </div>

          {/* Ground rules */}
          <div className="py-6 border-b border-neutral-200">
            <h2 className="text-[22px] font-semibold text-neutral-900 mb-3">Regole di base</h2>
            <p className="text-[15px] text-neutral-600 mb-3">
              Chiediamo a tutti gli ospiti di ricordare alcune semplici cose che rendono LuxuryStay un ottimo servizio.
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
              <span className="underline cursor-pointer text-neutral-700">Politica di rimborso per gli ospiti</span>.
              Accetto inoltre di pagare l&apos;importo totale indicato.
            </p>

            {error && (
              <div className="mb-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <button onClick={handleConfirm} disabled={submitting}
              className={`w-full lg:w-auto px-8 py-4 rounded-xl text-base font-semibold transition-all ${
                submitting
                  ? "bg-neutral-300 text-neutral-500 cursor-not-allowed"
                  : "bg-gradient-to-r from-[#E61E4D] to-[#D70466] text-white hover:from-[#d41c47] hover:to-[#c2035c] cursor-pointer active:scale-[0.98]"
              }`}>
              {submitting ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Conferma in corso...
                </span>
              ) : (
                "Conferma e paga"
              )}
            </button>
          </div>
        </div>

        {/* Right — Booking summary card (sticky) */}
        <div className="lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-neutral-200 p-5">
              {/* Property preview */}
              <div className="flex gap-4 pb-5 border-b border-neutral-200">
                <div className="w-28 h-24 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
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
                <div className="min-w-0">
                  <p className="text-xs text-neutral-500 uppercase tracking-wide">{property.category}</p>
                  <p className="font-medium text-neutral-900 mt-0.5 line-clamp-2">{property.title}</p>
                  <p className="text-xs text-neutral-500 mt-1 truncate">{property.address}</p>
                </div>
              </div>

              {/* Price details */}
              <div className="pt-5">
                <h3 className="text-lg font-semibold text-neutral-900 mb-4">Dettagli del prezzo</h3>

                <div className="space-y-3">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-neutral-600">€{property.price} x {nights} nott{nights === 1 ? "e" : "i"}</span>
                    <span className="text-neutral-900">€{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-neutral-600">Costi del servizio</span>
                    <span className="text-neutral-900">€{serviceFee}</span>
                  </div>
                </div>

                <hr className="border-neutral-200 my-4" />

                <div className="flex justify-between text-base font-semibold">
                  <span className="text-neutral-900">Totale (EUR)</span>
                  <span className="text-neutral-900">€{total}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
