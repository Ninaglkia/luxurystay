"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface Property {
  id: string;
  title: string;
  description: string;
  address: string;
  price: number;
  category: string;
  space_type: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  photos: string[];
  user_id: string;
  created_at: string;
}

interface HostProfile {
  full_name: string;
  avatar_url: string | null;
}

const amenityLabels: Record<string, string> = {
  wifi: "Wi-Fi", tv: "TV", cucina: "Cucina", lavatrice: "Lavatrice",
  aria: "Aria condizionata", piscina: "Piscina", parcheggio: "Parcheggio",
  riscaldamento: "Riscaldamento", giardino: "Giardino", animali: "Animali ammessi",
};

const categoryLabels: Record<string, string> = {
  casa: "Casa", appartamento: "Appartamento", villa: "Villa", baita: "Baita",
  bb: "B&B", barca: "Barca", camper: "Camper", castello: "Castello", loft: "Loft",
};

const spaceLabels: Record<string, string> = {
  entire: "Intero alloggio", private: "Stanza privata", shared: "Stanza condivisa",
};

export default function PropertyPage() {
  const { id } = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [property, setProperty] = useState<Property | null>(null);
  const [host, setHost] = useState<HostProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState(0);

  // Booking state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(1);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("properties")
        .select("*")
        .eq("id", id)
        .single();

      if (data) {
        setProperty(data);
        // Load host profile from profiles table (or fallback)
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", data.user_id)
          .single();
        if (profile) {
          setHost(profile);
        }
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

  async function handleBooking() {
    if (!property || !checkIn || !checkOut) return;
    setSubmitting(true);
    setBookingError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setBookingError("Devi effettuare l'accesso per prenotare.");
      setSubmitting(false);
      return;
    }

    if (user.id === property.user_id) {
      setBookingError("Non puoi prenotare il tuo stesso alloggio.");
      setSubmitting(false);
      return;
    }

    const nights = calculateNights();
    if (nights < 1) {
      setBookingError("Seleziona delle date valide.");
      setSubmitting(false);
      return;
    }

    const { error } = await supabase.from("bookings").insert({
      property_id: property.id,
      guest_id: user.id,
      host_id: property.user_id,
      check_in: checkIn,
      check_out: checkOut,
      guests: guestCount,
      total_price: property.price * nights,
      status: "pending",
    });

    if (error) {
      setBookingError("Errore durante la prenotazione. Riprova.");
      setSubmitting(false);
      return;
    }

    setBookingSuccess(true);
    setSubmitting(false);
  }

  const nights = calculateNights();
  const total = property ? property.price * nights : 0;
  const serviceFee = Math.round(total * 0.12);
  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto">
        <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse mb-6" />
        <div className="h-[400px] bg-neutral-100 rounded-2xl animate-pulse mb-8" />
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <div className="h-6 w-64 bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-full bg-neutral-100 rounded animate-pulse" />
            <div className="h-4 w-3/4 bg-neutral-100 rounded animate-pulse" />
          </div>
          <div className="h-80 bg-neutral-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!property) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-neutral-100 flex items-center justify-center mb-4">
          <svg className="w-8 h-8 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">Annuncio non trovato</h2>
        <p className="text-neutral-500 text-sm mb-6">L'annuncio potrebbe essere stato rimosso o non è più disponibile.</p>
        <button onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer">
          Torna alla mappa
        </button>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-emerald-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-neutral-900 mb-2">Prenotazione inviata!</h2>
        <p className="text-neutral-500 mb-2">
          La tua richiesta per <strong>{property.title}</strong> è stata inviata all'host.
        </p>
        <p className="text-neutral-500 text-sm mb-8">
          {nights} notti · {checkIn} → {checkOut} · Totale <strong>€{total + serviceFee}</strong>
        </p>
        <button onClick={() => router.push("/dashboard")}
          className="px-6 py-3 bg-neutral-900 text-white rounded-lg text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer">
          Torna alla mappa
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Back button */}
      <button onClick={() => router.back()}
        className="flex items-center gap-2 text-sm text-neutral-600 hover:text-neutral-900 transition-colors mb-4 cursor-pointer">
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5 8.25 12l7.5-7.5" />
        </svg>
        Indietro
      </button>

      {/* Title */}
      <h1 className="text-2xl lg:text-3xl font-bold text-neutral-900 mb-1">{property.title}</h1>
      <p className="text-sm text-neutral-500 mb-5">{property.address}</p>

      {/* Photo gallery */}
      <div className="mb-8">
        {property.photos.length > 0 ? (
          <div className="space-y-2">
            <div className="aspect-[16/9] lg:aspect-[2/1] rounded-2xl overflow-hidden bg-neutral-100">
              <img src={property.photos[selectedPhoto]} alt={property.title}
                className="w-full h-full object-cover" />
            </div>
            {property.photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {property.photos.map((photo, i) => (
                  <button key={i} onClick={() => setSelectedPhoto(i)}
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                      i === selectedPhoto ? "border-neutral-900" : "border-transparent opacity-60 hover:opacity-100"
                    }`}>
                    <img src={photo} alt={`Foto ${i + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] lg:aspect-[2/1] rounded-2xl bg-neutral-100 flex items-center justify-center">
            <svg className="w-16 h-16 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Content + Booking card */}
      <div className="grid lg:grid-cols-3 gap-8 lg:gap-12">
        {/* Left — Details */}
        <div className="lg:col-span-2 space-y-8">
          {/* Type + host */}
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-neutral-900">
                {spaceLabels[property.space_type] || property.space_type} · {categoryLabels[property.category] || property.category}
              </h2>
              <p className="text-neutral-500 text-sm mt-1">
                {property.guests} ospiti · {property.bedrooms} camere · {property.beds} letti · {property.bathrooms} bagni
              </p>
            </div>
            {host && (
              <div className="flex items-center gap-3 shrink-0">
                {host.avatar_url ? (
                  <img src={host.avatar_url} alt={host.full_name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-neutral-200 flex items-center justify-center">
                    <span className="text-lg font-semibold text-neutral-500">{host.full_name[0]}</span>
                  </div>
                )}
                <div className="hidden lg:block">
                  <p className="text-sm font-medium text-neutral-900">{host.full_name}</p>
                  <p className="text-xs text-neutral-500">Host</p>
                </div>
              </div>
            )}
          </div>

          <hr className="border-neutral-200" />

          {/* Description */}
          {property.description && (
            <>
              <div>
                <h3 className="text-lg font-semibold text-neutral-900 mb-3">Descrizione</h3>
                <p className="text-neutral-600 leading-relaxed whitespace-pre-line">{property.description}</p>
              </div>
              <hr className="border-neutral-200" />
            </>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-4">Cosa offre questo alloggio</h3>
              <div className="grid grid-cols-2 gap-3">
                {property.amenities.map((a) => (
                  <div key={a} className="flex items-center gap-3 py-2">
                    <svg className="w-5 h-5 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                    </svg>
                    <span className="text-sm text-neutral-700">{amenityLabels[a] || a}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right — Booking card (sticky on desktop) */}
        <div className="lg:sticky lg:top-8 self-start">
          <div className="bg-white rounded-2xl border border-neutral-200 shadow-lg p-6">
            <div className="flex items-baseline gap-1 mb-5">
              <span className="text-2xl font-bold text-neutral-900">€{property.price}</span>
              <span className="text-neutral-500 text-sm">/ notte</span>
            </div>

            {/* Date inputs */}
            <div className="grid grid-cols-2 rounded-xl border border-neutral-300 overflow-hidden mb-3">
              <div className="p-3 border-r border-neutral-300">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase">Check-in</label>
                <input type="date" value={checkIn} min={today}
                  onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }}
                  className="w-full text-sm text-neutral-900 bg-transparent outline-none mt-0.5" />
              </div>
              <div className="p-3">
                <label className="block text-[10px] font-semibold text-neutral-500 uppercase">Check-out</label>
                <input type="date" value={checkOut} min={checkIn || today}
                  onChange={(e) => setCheckOut(e.target.value)}
                  className="w-full text-sm text-neutral-900 bg-transparent outline-none mt-0.5" />
              </div>
            </div>

            {/* Guests */}
            <div className="rounded-xl border border-neutral-300 p-3 mb-4">
              <label className="block text-[10px] font-semibold text-neutral-500 uppercase">Ospiti</label>
              <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}
                className="w-full text-sm text-neutral-900 bg-transparent outline-none mt-0.5 cursor-pointer">
                {Array.from({ length: property.guests }, (_, i) => i + 1).map(n => (
                  <option key={n} value={n}>{n} ospite{n > 1 ? "i" : ""}</option>
                ))}
              </select>
            </div>

            {/* Book button */}
            <button onClick={handleBooking}
              disabled={!checkIn || !checkOut || nights < 1 || submitting}
              className={`w-full py-3.5 rounded-xl text-sm font-semibold transition-all ${
                checkIn && checkOut && nights >= 1 && !submitting
                  ? "bg-gradient-to-r from-rose-500 to-pink-600 text-white hover:from-rose-600 hover:to-pink-700 cursor-pointer active:scale-[0.98]"
                  : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
              }`}>
              {submitting ? "Prenotazione in corso..." : "Prenota"}
            </button>

            {bookingError && (
              <p className="text-red-500 text-sm mt-3 text-center">{bookingError}</p>
            )}

            {/* Price breakdown */}
            {nights > 0 && (
              <div className="mt-5 space-y-2 pt-4 border-t border-neutral-200">
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">€{property.price} x {nights} notti</span>
                  <span className="text-neutral-900">€{total}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">Costi del servizio</span>
                  <span className="text-neutral-900">€{serviceFee}</span>
                </div>
                <hr className="border-neutral-200" />
                <div className="flex justify-between font-semibold">
                  <span className="text-neutral-900">Totale</span>
                  <span className="text-neutral-900">€{total + serviceFee}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
