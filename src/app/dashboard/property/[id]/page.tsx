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

const amenityLabels: Record<string, { label: string; icon: string }> = {
  wifi: { label: "Wi-Fi", icon: "M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" },
  tv: { label: "TV", icon: "M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" },
  cucina: { label: "Cucina", icon: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" },
  lavatrice: { label: "Lavatrice", icon: "M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5" },
  aria: { label: "Aria condizionata", icon: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" },
  piscina: { label: "Piscina", icon: "M12 6v6m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm-9 5.25c1.5 1.5 3.75 1.5 5.25 0S12 9.75 13.5 11.25s3.75 1.5 5.25 0" },
  parcheggio: { label: "Parcheggio gratuito", icon: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0H21" },
  riscaldamento: { label: "Riscaldamento", icon: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" },
  giardino: { label: "Giardino", icon: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3" },
  animali: { label: "Animali ammessi", icon: "M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904" },
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
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  // Booking widget state
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guestCount, setGuestCount] = useState(1);

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from("properties")
        .select("*")
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

  function handleReserve() {
    if (!property || !checkIn || !checkOut) return;
    const params = new URLSearchParams({
      checkin: checkIn,
      checkout: checkOut,
      guests: String(guestCount),
    });
    router.push(`/dashboard/property/${property.id}/book?${params}`);
  }

  const nights = calculateNights();
  const total = property ? property.price * nights : 0;
  const serviceFee = Math.round(total * 0.12);
  const today = new Date().toISOString().split("T")[0];

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse mb-4" />
        <div className="h-[420px] bg-neutral-100 rounded-2xl animate-pulse mb-10" />
        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-4 bg-neutral-100 rounded animate-pulse" style={{ width: `${90 - i * 15}%` }} />)}
          </div>
          <div className="h-96 bg-neutral-100 rounded-2xl animate-pulse" />
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
        <p className="text-neutral-500 text-sm mb-6">L&apos;annuncio potrebbe essere stato rimosso.</p>
        <button onClick={() => router.push("/dashboard")}
          className="px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer">
          Torna alla mappa
        </button>
      </div>
    );
  }

  const photos = property.photos;

  return (
    <div className="max-w-6xl mx-auto">
      {/* Title row */}
      <div className="mb-5">
        <h1 className="text-2xl lg:text-[26px] font-semibold text-neutral-900">{property.title}</h1>
        <div className="flex items-center gap-2 mt-1.5 text-sm text-neutral-600">
          <span className="underline cursor-pointer hover:text-neutral-900">{property.address}</span>
        </div>
      </div>

      {/* Airbnb-style photo grid: 1 large + 4 small */}
      <div className="relative mb-10">
        {photos.length >= 5 && !showAllPhotos ? (
          <div className="grid grid-cols-4 grid-rows-2 gap-2 rounded-2xl overflow-hidden h-[300px] lg:h-[420px]">
            <button onClick={() => setSelectedPhoto(0)} className="col-span-2 row-span-2 relative cursor-pointer">
              <img src={photos[0]} alt="" className="w-full h-full object-cover hover:brightness-90 transition" />
            </button>
            {photos.slice(1, 5).map((p, i) => (
              <button key={i} onClick={() => { setSelectedPhoto(i + 1); setShowAllPhotos(true); }} className="relative cursor-pointer">
                <img src={p} alt="" className="w-full h-full object-cover hover:brightness-90 transition" />
              </button>
            ))}
            <button onClick={() => setShowAllPhotos(true)}
              className="absolute bottom-4 right-4 bg-white border border-neutral-900 rounded-lg px-4 py-2 text-sm font-medium text-neutral-900 hover:bg-neutral-50 transition cursor-pointer flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
              </svg>
              Mostra tutte le foto
            </button>
          </div>
        ) : photos.length > 0 ? (
          <div>
            <div className="aspect-[16/9] lg:aspect-[2.2/1] rounded-2xl overflow-hidden bg-neutral-100 mb-2">
              <img src={photos[selectedPhoto]} alt={property.title} className="w-full h-full object-cover" />
            </div>
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, i) => (
                  <button key={i} onClick={() => setSelectedPhoto(i)}
                    className={`w-20 h-14 rounded-lg overflow-hidden shrink-0 cursor-pointer border-2 transition-all ${
                      i === selectedPhoto ? "border-neutral-900" : "border-transparent opacity-60 hover:opacity-100"
                    }`}>
                    <img src={photo} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {showAllPhotos && (
              <button onClick={() => setShowAllPhotos(false)}
                className="mt-2 text-sm font-medium text-neutral-900 underline cursor-pointer">
                Nascondi
              </button>
            )}
          </div>
        ) : (
          <div className="aspect-[16/9] lg:aspect-[2.2/1] rounded-2xl bg-neutral-100 flex items-center justify-center">
            <svg className="w-16 h-16 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={0.8} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
            </svg>
          </div>
        )}
      </div>

      {/* Main content + Booking sidebar */}
      <div className="flex flex-col lg:flex-row gap-8 lg:gap-16">
        {/* Left — Property info */}
        <div className="flex-1 min-w-0">
          {/* Host + type */}
          <div className="flex items-center justify-between pb-6 border-b border-neutral-200">
            <div>
              <h2 className="text-[22px] font-semibold text-neutral-900">
                {spaceLabels[property.space_type] || property.space_type} · {categoryLabels[property.category] || property.category}
              </h2>
              <p className="text-neutral-600 text-[15px] mt-1">
                {property.guests} ospiti · {property.bedrooms} camere da letto · {property.beds} letti · {property.bathrooms} bagni
              </p>
            </div>
            {host && (
              <div className="shrink-0 ml-6 text-center">
                {host.avatar_url ? (
                  <img src={host.avatar_url} alt={host.full_name} className="w-14 h-14 rounded-full object-cover mx-auto" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-neutral-900 flex items-center justify-center mx-auto">
                    <span className="text-xl font-semibold text-white">{host.full_name[0]}</span>
                  </div>
                )}
                <p className="text-xs font-medium text-neutral-900 mt-1.5">{host.full_name}</p>
              </div>
            )}
          </div>

          {/* Highlights */}
          <div className="py-6 border-b border-neutral-200 space-y-5">
            <div className="flex gap-5">
              <svg className="w-7 h-7 text-neutral-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">{spaceLabels[property.space_type] || "Intero alloggio"}</p>
                <p className="text-sm text-neutral-500 mt-0.5">Avrai a disposizione l&apos;alloggio tutto per te.</p>
              </div>
            </div>
            <div className="flex gap-5">
              <svg className="w-7 h-7 text-neutral-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">Posizione eccellente</p>
                <p className="text-sm text-neutral-500 mt-0.5">{property.address}</p>
              </div>
            </div>
            <div className="flex gap-5">
              <svg className="w-7 h-7 text-neutral-700 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
              <div>
                <p className="font-medium text-neutral-900">Cancellazione gratuita entro 48h</p>
                <p className="text-sm text-neutral-500 mt-0.5">Ottieni un rimborso completo se cambi idea.</p>
              </div>
            </div>
          </div>

          {/* Description */}
          {property.description && (
            <div className="py-6 border-b border-neutral-200">
              <p className="text-neutral-700 leading-relaxed whitespace-pre-line">{property.description}</p>
            </div>
          )}

          {/* Amenities */}
          {property.amenities.length > 0 && (
            <div className="py-8 border-b border-neutral-200">
              <h3 className="text-[22px] font-semibold text-neutral-900 mb-6">Cosa offre questo alloggio</h3>
              <div className="grid grid-cols-2 gap-4">
                {property.amenities.map((a) => {
                  const info = amenityLabels[a];
                  return (
                    <div key={a} className="flex items-center gap-4 py-1">
                      <svg className="w-6 h-6 text-neutral-700 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d={info?.icon || "M4.5 12.75l6 6 9-13.5"} />
                      </svg>
                      <span className="text-[15px] text-neutral-700">{info?.label || a}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right — Booking card (sticky) */}
        <div className="lg:w-[380px] shrink-0">
          <div className="lg:sticky lg:top-6">
            <div className="bg-white rounded-xl border border-neutral-200 shadow-[0_6px_20px_rgba(0,0,0,0.12)] p-6">
              {/* Price */}
              <div className="flex items-baseline gap-1.5 mb-6">
                <span className="text-[22px] font-semibold text-neutral-900">€{property.price}</span>
                <span className="text-neutral-600">notte</span>
              </div>

              {/* Date + guest picker (Airbnb style stacked border) */}
              <div className="rounded-xl border border-neutral-400 overflow-hidden mb-4">
                <div className="grid grid-cols-2 divide-x divide-neutral-400">
                  <div className="p-3">
                    <label className="block text-[10px] font-bold text-neutral-900 uppercase tracking-wide">Check-in</label>
                    <input type="date" value={checkIn} min={today}
                      onChange={(e) => { setCheckIn(e.target.value); if (checkOut && e.target.value >= checkOut) setCheckOut(""); }}
                      className="w-full text-sm text-neutral-700 bg-transparent outline-none mt-0.5 cursor-pointer" />
                  </div>
                  <div className="p-3">
                    <label className="block text-[10px] font-bold text-neutral-900 uppercase tracking-wide">Check-out</label>
                    <input type="date" value={checkOut} min={checkIn || today}
                      onChange={(e) => setCheckOut(e.target.value)}
                      className="w-full text-sm text-neutral-700 bg-transparent outline-none mt-0.5 cursor-pointer" />
                  </div>
                </div>
                <div className="border-t border-neutral-400 p-3">
                  <label className="block text-[10px] font-bold text-neutral-900 uppercase tracking-wide">Ospiti</label>
                  <select value={guestCount} onChange={(e) => setGuestCount(Number(e.target.value))}
                    className="w-full text-sm text-neutral-700 bg-transparent outline-none mt-0.5 cursor-pointer">
                    {Array.from({ length: property.guests }, (_, i) => i + 1).map(n => (
                      <option key={n} value={n}>{n} ospite{n > 1 ? "i" : ""}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reserve button (goes to checkout) */}
              <button onClick={handleReserve}
                disabled={!checkIn || !checkOut || nights < 1}
                className={`w-full py-3.5 rounded-xl text-base font-semibold transition-all ${
                  checkIn && checkOut && nights >= 1
                    ? "bg-gradient-to-r from-[#E61E4D] to-[#D70466] text-white hover:from-[#d41c47] hover:to-[#c2035c] cursor-pointer active:scale-[0.98]"
                    : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
                }`}>
                Prenota
              </button>

              {nights > 0 && (
                <p className="text-center text-sm text-neutral-500 mt-3">Non ti verrà addebitato nulla adesso</p>
              )}

              {/* Price breakdown */}
              {nights > 0 && (
                <div className="mt-5 space-y-3 pt-5 border-t border-neutral-200">
                  <div className="flex justify-between text-[15px]">
                    <span className="text-neutral-600 underline cursor-pointer">€{property.price} x {nights} nott{nights === 1 ? "e" : "i"}</span>
                    <span className="text-neutral-900">€{total}</span>
                  </div>
                  <div className="flex justify-between text-[15px]">
                    <span className="text-neutral-600 underline cursor-pointer">Costi del servizio LuxuryStay</span>
                    <span className="text-neutral-900">€{serviceFee}</span>
                  </div>
                  <hr className="border-neutral-200" />
                  <div className="flex justify-between text-base font-semibold pt-1">
                    <span className="text-neutral-900">Totale</span>
                    <span className="text-neutral-900">€{total + serviceFee}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
