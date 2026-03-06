"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import Footer from "./components/footer";
import type { User } from "@supabase/supabase-js";

const categories = [
  { name: "Villa", slug: "villa" },
  { name: "Appartamento", slug: "appartamento" },
  { name: "Casa", slug: "casa" },
  { name: "Loft", slug: "loft" },
  { name: "Baita", slug: "baita" },
  { name: "Castello", slug: "castello" },
  { name: "Barca", slug: "barca" },
];

const destinations = [
  { name: "Roma", slug: "roma" },
  { name: "Milano", slug: "milano" },
  { name: "Firenze", slug: "firenze" },
  { name: "Napoli", slug: "napoli" },
  { name: "Venezia", slug: "venezia" },
  { name: "Costiera Amalfitana", slug: "costiera-amalfitana" },
];

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [destination, setDestination] = useState("");
  const [checkin, setCheckin] = useState("");
  const [checkout, setCheckout] = useState("");
  const [guests, setGuests] = useState(1);
  const supabase = createClient();
  const router = useRouter();
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
      setLoading(false);
    });
  }, [supabase]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (destination) params.set("destination", destination);
    if (checkin) params.set("checkin", checkin);
    if (checkout) params.set("checkout", checkout);
    if (guests > 1) params.set("guests", String(guests));
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative h-screen w-full overflow-hidden">
        {/* Video background */}
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/videos/hero-villa.mp4" type="video/mp4" />
        </video>

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/60" />

        {/* Header overlaid on hero */}
        <header className="relative z-10">
          <div className="max-w-[1800px] mx-auto px-4 lg:px-6 h-16 flex items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"
                />
              </svg>
              <span className="text-xl font-semibold text-white tracking-tight">
                LuxuryStay
              </span>
            </Link>

            {/* Nav + Auth buttons */}
            <div className="flex items-center gap-3">
              <Link
                href="/come-funziona"
                className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors hidden sm:flex"
              >
                Come funziona
              </Link>
              {loading ? (
                <div className="w-24 h-11 bg-white/10 rounded-lg animate-pulse" />
              ) : user ? (
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white px-4 py-2 min-h-[44px] rounded-lg text-sm font-medium hover:bg-white/25 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-xs font-semibold">
                    {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                      user.email?.[0]?.toUpperCase() ||
                      "U"}
                  </div>
                  <span className="hidden sm:inline">Dashboard</span>
                </Link>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 min-h-[44px] flex items-center text-sm font-medium text-white/80 hover:text-white transition-colors"
                  >
                    Accedi
                  </Link>
                  <Link
                    href="/register"
                    className="px-4 py-2 min-h-[44px] flex items-center bg-white text-neutral-900 text-sm font-medium rounded-lg hover:bg-white/90 transition-colors"
                  >
                    Registrati
                  </Link>
                </>
              )}
            </div>
          </div>
        </header>

        {/* Center content */}
        <div className="relative z-10 flex flex-col items-center justify-center h-[calc(100%-4rem)] px-4">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-light text-white text-center tracking-tight leading-tight mb-4">
            Prenota la tua villa da sogno
          </h1>
          <p className="text-lg sm:text-xl text-white/70 text-center mb-10 max-w-xl">
            Ville di lusso in Italia, selezionate per te
          </p>

          {/* Search bar */}
          <form
            onSubmit={handleSearch}
            className="w-full max-w-3xl bg-white/15 backdrop-blur-xl rounded-2xl shadow-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
          >
            {/* Destination */}
            <div className="flex-1 flex items-center gap-2 bg-white/90 rounded-xl px-4 py-3">
              <svg
                className="w-5 h-5 text-neutral-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1 1 15 0Z"
                />
              </svg>
              <input
                type="text"
                placeholder="Dove vuoi andare?"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
              />
            </div>

            {/* Check-in / Check-out */}
            <div className="flex-1 flex items-center gap-2 bg-white/90 rounded-xl px-4 py-3">
              <svg
                className="w-5 h-5 text-neutral-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"
                />
              </svg>
              <div className="flex items-center gap-1 w-full">
                <input
                  type="date"
                  value={checkin}
                  onChange={(e) => setCheckin(e.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
                  placeholder="Check-in"
                />
                <span className="text-neutral-300 mx-1">/</span>
                <input
                  type="date"
                  value={checkout}
                  onChange={(e) => setCheckout(e.target.value)}
                  className="w-full bg-transparent text-sm text-neutral-900 placeholder-neutral-400 outline-none"
                  placeholder="Check-out"
                />
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-3 sm:w-32">
              <svg
                className="w-5 h-5 text-neutral-400 shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
                />
              </svg>
              <button
                type="button"
                onClick={() => setGuests(Math.max(1, guests - 1))}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-200 text-neutral-600 text-xs hover:bg-neutral-300 transition-colors"
              >
                -
              </button>
              <span className="text-sm text-neutral-900 font-medium min-w-[1ch] text-center">
                {guests}
              </span>
              <button
                type="button"
                onClick={() => setGuests(guests + 1)}
                className="w-6 h-6 flex items-center justify-center rounded-full bg-neutral-200 text-neutral-600 text-xs hover:bg-neutral-300 transition-colors"
              >
                +
              </button>
            </div>

            {/* Search button */}
            <button
              type="submit"
              className="bg-neutral-900 text-white px-6 py-3 rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors shrink-0"
            >
              Cerca
            </button>
          </form>
        </div>
      </section>

      {/* ==================== CATEGORIES SECTION ==================== */}
      <section className="py-16 px-4 lg:px-6 max-w-[1800px] mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-8">
          Esplora per categoria
        </h2>
        <div
          ref={categoriesRef}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide snap-x snap-mandatory"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {categories.map((cat) => (
            <Link
              key={cat.slug}
              href={`/search?category=${cat.slug}`}
              className="flex flex-col items-center gap-3 shrink-0 snap-start group"
            >
              <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-neutral-200 group-hover:bg-neutral-300 transition-colors" />
              <span className="text-sm font-medium text-neutral-700 group-hover:text-neutral-900 transition-colors">
                {cat.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== DESTINATIONS SECTION ==================== */}
      <section className="py-16 px-4 lg:px-6 max-w-[1800px] mx-auto w-full">
        <h2 className="text-2xl sm:text-3xl font-semibold text-neutral-900 mb-8">
          Destinazioni popolari
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {destinations.map((dest) => (
            <Link
              key={dest.slug}
              href={`/search?destination=${dest.slug}`}
              className="relative h-[200px] rounded-xl overflow-hidden bg-neutral-200 group"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
              <span className="absolute bottom-4 left-4 text-white text-xl font-bold tracking-tight group-hover:translate-x-1 transition-transform">
                {dest.name}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== FOOTER ==================== */}
      <Footer />
    </div>
  );
}
