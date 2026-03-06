"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { APIProvider } from "@vis.gl/react-google-maps";
import { CitySearch } from "./dashboard/components/city-search";
import { DatePicker } from "./dashboard/components/date-picker";
import { GuestsPicker, type GuestsCount } from "./dashboard/components/guests-picker";
import Footer from "./components/footer";
import type { User } from "@supabase/supabase-js";

const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

const destinations = [
  { name: "Roma", slug: "roma", emoji: "🏛️", gradient: "from-amber-800 via-orange-900 to-yellow-950", lat: 41.9028, lng: 12.4964 },
  { name: "Milano", slug: "milano", emoji: "🏙️", gradient: "from-slate-700 via-zinc-800 to-slate-900", lat: 45.4642, lng: 9.19 },
  { name: "Firenze", slug: "firenze", emoji: "🎨", gradient: "from-rose-800 via-red-900 to-orange-950", lat: 43.7696, lng: 11.2558 },
  { name: "Napoli", slug: "napoli", emoji: "🌋", gradient: "from-blue-800 via-sky-900 to-cyan-950", lat: 40.8518, lng: 14.2681 },
  { name: "Venezia", slug: "venezia", emoji: "🚣", gradient: "from-teal-700 via-emerald-800 to-cyan-900", lat: 45.4408, lng: 12.3155 },
  { name: "Costiera Amalfitana", slug: "costiera-amalfitana", emoji: "🌊", gradient: "from-indigo-700 via-blue-800 to-sky-900", lat: 40.6333, lng: 14.6029 },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlace, setSelectedPlace] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const [checkIn, setCheckIn] = useState<Date | null>(null);
  const [checkOut, setCheckOut] = useState<Date | null>(null);
  const [guests, setGuests] = useState<GuestsCount>({ adults: 0, children: 0, infants: 0, pets: 0 });
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  const handlePlaceSelect = useCallback((location: { lat: number; lng: number; name: string }) => {
    setSelectedPlace(location);
  }, []);

  const handleDatesChange = useCallback((ci: Date | null, co: Date | null) => {
    setCheckIn(ci);
    setCheckOut(co);
  }, []);

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (selectedPlace) {
      params.set("destination", selectedPlace.name);
      params.set("lat", String(selectedPlace.lat));
      params.set("lng", String(selectedPlace.lng));
    }
    if (checkIn) params.set("checkin", checkIn.toISOString().split("T")[0]);
    if (checkOut) params.set("checkout", checkOut.toISOString().split("T")[0]);
    const totalGuests = guests.adults + guests.children;
    if (totalGuests > 0) params.set("guests", String(totalGuests));
    const qs = params.toString();
    router.push(qs ? `/search?${qs}` : "/search");
  };

  return (
    <APIProvider apiKey={GOOGLE_MAPS_API_KEY} libraries={["places"]}>
      <div className="min-h-screen flex flex-col bg-white">
        {/* ==================== HERO SECTION ==================== */}
        <section className="relative h-[100svh] w-full">
          {/* Video background — clip to hero bounds */}
          <div className="absolute inset-0 overflow-hidden">
            <video
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              className="w-full h-full object-cover"
            >
              <source src="/videos/hero-villa.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/30 to-black/70" />
            {/* Hide watermark in bottom-right corner */}
            <div className="absolute bottom-0 right-0 w-40 h-12 bg-gradient-to-tl from-black/90 via-black/70 to-transparent" />
          </div>

          {/* Header */}
          <header className="relative z-20">
            <div className="max-w-7xl mx-auto px-5 lg:px-8 h-20 flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2.5">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                <span className="text-xl font-semibold text-white tracking-tight">LuxuryStay</span>
              </Link>

              <div className="flex items-center gap-2">
                <Link href="/come-funziona" className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-white/70 hover:text-white transition-colors hidden sm:flex">
                  Come funziona
                </Link>
                {loading ? (
                  <div className="w-24 h-10 bg-white/10 rounded-full animate-pulse" />
                ) : user ? (
                  <Link href="/dashboard" className="flex items-center gap-2 bg-white text-neutral-900 px-5 py-2.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors">
                    Dashboard
                  </Link>
                ) : (
                  <>
                    <Link href="/login" className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors">
                      Accedi
                    </Link>
                    <Link href="/register" className="px-5 py-2.5 bg-white text-neutral-900 text-sm font-medium rounded-full hover:bg-white/90 transition-colors">
                      Registrati
                    </Link>
                  </>
                )}
              </div>
            </div>
          </header>

          {/* Center content */}
          <div className="relative z-20 flex flex-col items-center justify-center h-[calc(100%-5rem)] px-5 pb-32">
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl font-normal text-white text-center tracking-tight leading-[1.1] mb-4">
              Prenota la tua
              <br />
              <span className="italic">villa da sogno</span>
            </h1>
            <p className="text-base sm:text-lg text-white/60 text-center mb-12 max-w-md">
              Ville di lusso in Italia, selezionate per te
            </p>

            {/* Search bar */}
            <div className="w-full max-w-3xl relative z-30">
              <div className="bg-white rounded-2xl shadow-2xl shadow-black/20 p-3">
                {/* Desktop: single row */}
                <div className="hidden sm:flex items-center gap-0">
                  {/* Destination */}
                  <div className="flex-1 min-w-0 px-1">
                    <CitySearch onPlaceSelect={handlePlaceSelect} />
                  </div>

                  <div className="w-px h-10 bg-neutral-200 shrink-0" />

                  {/* Dates */}
                  <div className="shrink-0 px-1">
                    <DatePicker checkIn={checkIn} checkOut={checkOut} onDatesChange={handleDatesChange} />
                  </div>

                  <div className="w-px h-10 bg-neutral-200 shrink-0" />

                  {/* Guests */}
                  <div className="shrink-0 px-1">
                    <GuestsPicker guests={guests} onGuestsChange={setGuests} />
                  </div>

                  {/* Search button */}
                  <button
                    onClick={handleSearch}
                    className="bg-neutral-900 text-white w-12 h-12 rounded-xl flex items-center justify-center hover:bg-neutral-800 transition-colors shrink-0 cursor-pointer ml-1"
                    aria-label="Cerca"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                  </button>
                </div>

                {/* Mobile: stacked */}
                <div className="flex sm:hidden flex-col gap-2">
                  <CitySearch onPlaceSelect={handlePlaceSelect} />
                  <DatePicker checkIn={checkIn} checkOut={checkOut} onDatesChange={handleDatesChange} />
                  <GuestsPicker guests={guests} onGuestsChange={setGuests} />
                  <button
                    onClick={handleSearch}
                    className="bg-neutral-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
                    </svg>
                    Cerca
                  </button>
                </div>
              </div>
            </div>

            {/* Scroll indicator */}
            <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
              <svg className="w-5 h-5 text-white/40" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </div>
          </div>
        </section>

        {/* ==================== DESTINATIONS SECTION ==================== */}
        <section className="py-20 px-5 lg:px-8 max-w-7xl mx-auto w-full">
          <h2 className="font-serif text-3xl sm:text-4xl text-neutral-900 mb-3">
            Destinazioni popolari
          </h2>
          <p className="text-neutral-500 text-sm mb-10">
            Scopri le mete più amate dai nostri ospiti
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {destinations.map((dest) => (
              <Link
                key={dest.slug}
                href={`/search?destination=${encodeURIComponent(dest.name)}&lat=${dest.lat}&lng=${dest.lng}`}
                className={`group relative h-44 sm:h-52 rounded-2xl overflow-hidden bg-gradient-to-br ${dest.gradient} transition-all hover:scale-[1.02] active:scale-[0.98] hover:shadow-xl`}
              >
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/5 transition-colors" />
                <div className="absolute top-4 left-4 text-4xl drop-shadow-lg">{dest.emoji}</div>
                <div className="absolute bottom-4 left-4 right-4">
                  <span className="text-white text-lg font-semibold tracking-tight drop-shadow-md">
                    {dest.name}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ==================== CTA SECTION ==================== */}
        <section className="py-20 px-5 lg:px-8 bg-neutral-950">
          <div className="max-w-7xl mx-auto text-center">
            <h2 className="font-serif text-3xl sm:text-4xl text-white mb-4">
              Hai una proprietà di lusso?
            </h2>
            <p className="text-white/50 text-base mb-8 max-w-md mx-auto">
              Unisciti a LuxuryStay e inizia a guadagnare con la tua villa
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-neutral-900 px-8 py-4 rounded-full text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Diventa host
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
          </div>
        </section>

        <Footer />
      </div>
    </APIProvider>
  );
}
