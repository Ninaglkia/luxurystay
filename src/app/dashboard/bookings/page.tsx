"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarDays, MapPin, Users, ChevronRight, Search, Luggage } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import {
  getPaymentStatusLabel,
  getPaymentStatusColor,
} from "@/lib/payment-utils";

interface Booking {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_type: string;
  cancellation_policy: string;
  created_at: string;
}

interface Property {
  id: string;
  title: string;
  address: string;
  photos: string[];
  price: number;
}

type BookingWithProp = Booking & { property?: Property };

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.45, ease: "easeOut" as const },
  }),
};

function StatusBadge({ status }: { status: string }) {
  const label = getPaymentStatusLabel(status);
  const colorClass = getPaymentStatusColor(status);
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${colorClass}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
      {label}
    </span>
  );
}

function BookingCard({ booking, index }: { booking: BookingWithProp; index: number }) {
  const router = useRouter();
  const nights = calculateNights(booking.check_in, booking.check_out);
  const dateRange = formatDateRange(booking.check_in, booking.check_out);
  const isPast = new Date(booking.check_out) < new Date();

  return (
    <motion.div
      custom={index}
      initial="hidden"
      animate="visible"
      variants={fadeUp}
    >
      <button
        onClick={() => router.push(`/dashboard/bookings/${booking.id}`)}
        className={`group w-full text-left bg-white rounded-2xl border border-neutral-200/80 overflow-hidden hover:shadow-lg hover:border-neutral-300 transition-all duration-300 cursor-pointer ${isPast ? "opacity-75" : ""}`}
      >
        <div className="flex flex-col sm:flex-row">
          {/* Photo */}
          <div className="sm:w-48 h-44 sm:h-auto relative overflow-hidden shrink-0">
            {booking.property?.photos?.[0] ? (
              <img
                src={booking.property.photos[0]}
                alt={booking.property.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-br from-neutral-100 to-neutral-50 flex items-center justify-center">
                <MapPin className="w-8 h-8 text-neutral-300" />
              </div>
            )}
            {isPast && (
              <div className="absolute inset-0 bg-neutral-900/20 flex items-center justify-center">
                <span className="bg-white/90 backdrop-blur-sm text-neutral-700 text-xs font-semibold px-3 py-1 rounded-full">
                  Completato
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-5 sm:p-6 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-neutral-900 truncate group-hover:text-neutral-700 transition-colors">
                    {booking.property?.title || "Alloggio"}
                  </h3>
                  {booking.property?.address && (
                    <p className="text-sm text-neutral-400 truncate mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {booking.property.address}
                    </p>
                  )}
                </div>
                <StatusBadge status={booking.status} />
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-sm text-neutral-500">
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays className="w-3.5 h-3.5 text-neutral-400" />
                  {dateRange}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Luggage className="w-3.5 h-3.5 text-neutral-400" />
                  {nights} nott{nights === 1 ? "e" : "i"}
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-neutral-400" />
                  {booking.guests} ospite{booking.guests > 1 ? "i" : ""}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-neutral-100">
              <div className="flex items-center gap-3">
                <p className="text-lg font-bold text-neutral-900">
                  &euro;{Number(booking.total_price).toLocaleString("it-IT")}
                </p>
                {booking.payment_type === "split" && (
                  <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md font-medium">
                    2 rate
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-400 group-hover:text-neutral-600 transition-colors flex items-center gap-1">
                Dettagli
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </span>
            </div>
          </div>
        </div>
      </button>
    </motion.div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="relative bg-white rounded-3xl border border-neutral-200/60 overflow-hidden"
    >
      {/* Decorative background */}
      <div className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: "24px 24px",
        }}
      />

      <div className="relative px-8 py-20 sm:py-28 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, duration: 0.5, ease: "easeOut" as const }}
          className="w-24 h-24 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 flex items-center justify-center mx-auto mb-8 shadow-sm"
        >
          <Luggage className="w-11 h-11 text-amber-400/80" strokeWidth={1.5} />
        </motion.div>

        <h2 className="text-2xl font-semibold text-neutral-900 mb-3">
          Il tuo prossimo viaggio ti aspetta
        </h2>
        <p className="text-neutral-500 text-[15px] mb-10 max-w-md mx-auto leading-relaxed">
          Esplora ville, appartamenti e alloggi unici in tutta Italia. Le tue prenotazioni appariranno qui.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2.5 px-7 py-3.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 active:scale-[0.98] transition-all shadow-lg shadow-neutral-900/10"
        >
          <Search className="w-4 h-4" />
          Esplora alloggi
        </Link>
      </div>
    </motion.div>
  );
}

function formatDateRange(checkIn: string, checkOut: string): string {
  const dIn = new Date(checkIn + "T00:00:00");
  const dOut = new Date(checkOut + "T00:00:00");
  return `${dIn.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} \u2013 ${dOut.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`;
}

function calculateNights(checkIn: string, checkOut: string): number {
  const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
  return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
}

export default function GuestBookingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<BookingWithProp[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "upcoming" | "past">("all");

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("guest_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsData && bookingsData.length > 0) {
        const propertyIds = [...new Set(bookingsData.map((b) => b.property_id))];
        const { data: properties } = await supabase
          .from("properties")
          .select("id, title, address, photos, price")
          .in("id", propertyIds);

        const propertyMap = new Map(properties?.map((p) => [p.id, p]) || []);
        setBookings(bookingsData.map((b) => ({ ...b, property: propertyMap.get(b.property_id) })));
      }
      setLoading(false);
    }
    load();
  }, [supabase, router]);

  const today = new Date().toISOString().split("T")[0];
  const filtered = bookings.filter((b) => {
    if (filter === "upcoming") return b.check_out >= today;
    if (filter === "past") return b.check_out < today;
    return true;
  });

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-5 pt-2">
        <div className="h-7 w-56 bg-neutral-100 rounded-lg animate-pulse" />
        <div className="h-5 w-36 bg-neutral-100 rounded animate-pulse" />
        <div className="space-y-4 mt-6">
          {[1, 2].map((i) => (
            <div key={i} className="h-44 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-semibold text-neutral-900">
          Le mie prenotazioni
        </h1>
        <p className="text-sm text-neutral-400 mt-1">
          {bookings.length > 0
            ? `${bookings.length} prenotazion${bookings.length === 1 ? "e" : "i"} totali`
            : "Gestisci i tuoi soggiorni"}
        </p>
      </motion.div>

      {bookings.length === 0 ? (
        <EmptyState />
      ) : (
        <>
          {/* Filter tabs */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-1 mb-6 bg-neutral-100 rounded-xl p-1 w-fit"
          >
            {([
              { key: "all" as const, label: "Tutte" },
              { key: "upcoming" as const, label: "In arrivo" },
              { key: "past" as const, label: "Passate" },
            ]).map((tab) => (
              <button
                key={tab.key}
                onClick={() => setFilter(tab.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer ${
                  filter === tab.key
                    ? "bg-white text-neutral-900 shadow-sm"
                    : "text-neutral-500 hover:text-neutral-700"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* Bookings list */}
          {filtered.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-neutral-400 text-sm">Nessuna prenotazione in questa categoria.</p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {filtered.map((booking, i) => (
                <BookingCard key={booking.id} booking={booking} index={i} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
