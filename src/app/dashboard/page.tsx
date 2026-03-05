"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { MapPin, Search, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMode } from "./components/mode-context";

/* ═══════════════ Types ═══════════════ */

interface GuestBooking {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
  property_title: string;
  property_photo: string | null;
}

interface HostBooking {
  id: string;
  property_id: string;
  guest_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  created_at: string;
  property_title: string;
  guest_name: string;
  guest_avatar: string | null;
}

/* ═══════════════ Helpers ═══════════════ */

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.06, duration: 0.35, ease: "easeOut" as const },
  }),
};

function formatDateIT(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

/* ═══════════════ Status Badge ═══════════════ */

function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Confermata" },
    authorized: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Confermata" },
    captured: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Confermata" },
    pending: { bg: "bg-amber-50", text: "text-amber-600", label: "In attesa" },
    pending_payment: { bg: "bg-amber-50", text: "text-amber-600", label: "In attesa" },
    cancelled: { bg: "bg-red-50", text: "text-red-500", label: "Cancellata" },
    completed: { bg: "bg-neutral-100", text: "text-neutral-600", label: "Completata" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`text-[11px] font-medium px-2.5 py-1 rounded-full whitespace-nowrap ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

/* ═══════════════ Filter Chips ═══════════════ */

function FilterChips({
  filters,
  active,
  onChange,
}: {
  filters: string[];
  active: string;
  onChange: (f: string) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      {filters.map((f) => (
        <button
          key={f}
          onClick={() => onChange(f)}
          className={`shrink-0 px-4 py-2 text-sm rounded-full transition-colors ${
            active === f
              ? "bg-neutral-900 text-white"
              : "bg-white border border-neutral-200 text-neutral-600"
          }`}
        >
          {f}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════ Loading Skeleton ═══════════════ */

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      <div className="h-8 w-48 bg-neutral-100 rounded-lg animate-pulse" />
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-10 w-24 bg-neutral-100 rounded-full animate-pulse" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-neutral-100 rounded-2xl animate-pulse" />
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Guest: I miei soggiorni ═══════════════ */

const GUEST_FILTERS = ["Tutti", "In arrivo", "In corso", "Completati", "Cancellati"];

function GuestSoggiorni() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<GuestBooking[]>([]);
  const [filter, setFilter] = useState("Tutti");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: rawBookings } = await supabase
        .from("bookings")
        .select("id, property_id, check_in, check_out, guests, total_price, status, created_at")
        .eq("guest_id", user.id)
        .order("created_at", { ascending: false });

      const allBookings = rawBookings || [];

      // Fetch property details
      const propIds = [...new Set(allBookings.map((b) => b.property_id))];
      let propMap = new Map<string, { title: string; photos: string[] }>();
      if (propIds.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("id, title, photos")
          .in("id", propIds);
        propMap = new Map((props || []).map((p) => [p.id, p]));
      }

      setBookings(
        allBookings.map((b) => {
          const prop = propMap.get(b.property_id);
          return {
            ...b,
            property_title: prop?.title || "Alloggio",
            property_photo: prop?.photos?.[0] || null,
          };
        })
      );
      setLoading(false);
    }
    load();
  }, [supabase]);

  const filtered = useMemo(() => {
    const today = todayStr();
    const activeStatuses = ["confirmed", "authorized", "captured"];

    switch (filter) {
      case "In arrivo":
        return bookings.filter(
          (b) => b.check_in >= today && activeStatuses.includes(b.status)
        );
      case "In corso":
        return bookings.filter(
          (b) =>
            b.check_in <= today &&
            b.check_out >= today &&
            activeStatuses.includes(b.status)
        );
      case "Completati":
        return bookings.filter(
          (b) =>
            b.status === "completed" ||
            b.status === "captured" ||
            (b.check_out < today &&
              activeStatuses.includes(b.status))
        );
      case "Cancellati":
        return bookings.filter((b) => b.status === "cancelled");
      default:
        return bookings;
    }
  }, [bookings, filter]);

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">I miei soggiorni</h1>

      <FilterChips filters={GUEST_FILTERS} active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-neutral-900 mb-1">Nessun soggiorno</p>
          <p className="text-xs text-neutral-400 mb-5">Inizia a esplorare le destinazioni</p>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-full text-sm font-medium hover:bg-neutral-800 transition-colors"
          >
            Esplora alloggi
          </Link>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => (
            <motion.div
              key={booking.id}
              custom={i}
              initial="hidden"
              animate="visible"
              variants={fadeUp}
            >
              <Link href={`/dashboard/bookings/${booking.id}`}>
                <div className="bg-white rounded-2xl border border-neutral-100 p-4 flex gap-4 hover:shadow-sm transition-shadow">
                  {/* Property photo */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                    {booking.property_photo ? (
                      <img
                        src={booking.property_photo}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-neutral-300" />
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-sm font-semibold text-neutral-900 truncate">
                      {booking.property_title}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatDateIT(booking.check_in)} &ndash; {formatDateIT(booking.check_out)}
                    </p>
                    <p className="text-sm font-bold text-neutral-900 mt-1">
                      &euro;{Number(booking.total_price).toLocaleString("it-IT")}
                    </p>
                  </div>

                  {/* Status */}
                  <div className="shrink-0 flex items-center">
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Host: Prenotazioni ═══════════════ */

const HOST_FILTERS = ["Tutti", "In attesa", "Confermati", "Completati", "Cancellati"];

function HostPrenotazioni() {
  const supabase = createClient();
  const [bookings, setBookings] = useState<HostBooking[]>([]);
  const [filter, setFilter] = useState("Tutti");
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  async function loadBookings() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }

    // Get host's properties
    const { data: properties } = await supabase
      .from("properties")
      .select("id, title")
      .eq("user_id", user.id);

    const props = properties || [];
    if (props.length === 0) {
      setLoading(false);
      return;
    }

    const propIds = props.map((p) => p.id);
    const propMap = new Map(props.map((p) => [p.id, p.title]));

    // Get bookings for those properties
    const { data: rawBookings } = await supabase
      .from("bookings")
      .select("id, property_id, guest_id, check_in, check_out, guests, total_price, status, created_at")
      .in("property_id", propIds)
      .order("created_at", { ascending: false });

    const allBookings = rawBookings || [];

    // Get guest profiles
    const guestIds = [...new Set(allBookings.map((b) => b.guest_id))];
    let guestMap = new Map<string, { full_name: string; avatar_url: string | null }>();
    if (guestIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", guestIds);
      guestMap = new Map(
        (profiles || []).map((p) => [p.id, { full_name: p.full_name, avatar_url: p.avatar_url }])
      );
    }

    setBookings(
      allBookings.map((b) => {
        const guest = guestMap.get(b.guest_id);
        return {
          ...b,
          property_title: propMap.get(b.property_id) || "Proprieta",
          guest_name: guest?.full_name || "Ospite",
          guest_avatar: guest?.avatar_url || null,
        };
      })
    );
    setLoading(false);
  }

  useEffect(() => {
    loadBookings();
  }, [supabase]);

  const filtered = useMemo(() => {
    const today = todayStr();

    switch (filter) {
      case "In attesa":
        return bookings.filter((b) =>
          ["pending", "pending_payment"].includes(b.status)
        );
      case "Confermati":
        return bookings.filter((b) =>
          ["confirmed", "authorized", "captured"].includes(b.status)
        );
      case "Completati":
        return bookings.filter(
          (b) =>
            b.status === "completed" ||
            (b.status === "captured" && b.check_out < today)
        );
      case "Cancellati":
        return bookings.filter((b) => b.status === "cancelled");
      default:
        return bookings;
    }
  }, [bookings, filter]);

  async function handleAction(bookingId: string, newStatus: "confirmed" | "cancelled") {
    setActionLoading(bookingId);
    await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);
    // Refresh bookings
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
    );
    setActionLoading(null);
  }

  if (loading) return <LoadingSkeleton />;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold text-neutral-900">Prenotazioni</h1>

      <FilterChips filters={HOST_FILTERS} active={filter} onChange={setFilter} />

      {filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-14 h-14 rounded-2xl bg-neutral-100 flex items-center justify-center mb-4">
            <Search className="w-6 h-6 text-neutral-400" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-semibold text-neutral-900 mb-1">Nessuna prenotazione</p>
          <p className="text-xs text-neutral-400">Le prenotazioni appariranno qui</p>
        </motion.div>
      ) : (
        <div className="space-y-3">
          {filtered.map((booking, i) => {
            const isPending = ["pending", "pending_payment"].includes(booking.status);

            return (
              <motion.div
                key={booking.id}
                custom={i}
                initial="hidden"
                animate="visible"
                variants={fadeUp}
              >
                <div className="bg-white rounded-2xl border border-neutral-100 overflow-hidden">
                  {/* Content */}
                  <div className="p-4">
                    {/* Top row: avatar + property + amount */}
                    <div className="flex items-center gap-3">
                      {/* Guest avatar */}
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-neutral-100 shrink-0">
                        {booking.guest_avatar ? (
                          <img
                            src={booking.guest_avatar}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-sm font-semibold text-neutral-400">
                            {booking.guest_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {booking.property_title}
                        </p>
                        <p className="text-xs text-rose-500 font-medium truncate">
                          {booking.guest_name}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-bold text-neutral-900">
                          &euro;{Number(booking.total_price).toLocaleString("it-IT")}
                        </p>
                        <StatusBadge status={booking.status} />
                      </div>
                    </div>

                    {/* Date boxes */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 rounded-lg border border-neutral-100 p-2">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Inizio</p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatDateIT(booking.check_in)}
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-neutral-300 shrink-0" />
                      <div className="flex-1 rounded-lg border border-neutral-100 p-2">
                        <p className="text-[10px] text-neutral-400 uppercase tracking-wide">Fine</p>
                        <p className="text-sm font-semibold text-neutral-900">
                          {formatDateIT(booking.check_out)}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Action buttons for pending bookings */}
                  {isPending && (
                    <div className="flex border-t border-neutral-100">
                      <button
                        onClick={() => handleAction(booking.id, "cancelled")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 py-3 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        Rifiuta
                      </button>
                      <div className="w-px bg-neutral-100" />
                      <button
                        onClick={() => handleAction(booking.id, "confirmed")}
                        disabled={actionLoading === booking.id}
                        className="flex-1 py-3 text-sm font-medium text-emerald-600 hover:bg-emerald-50 transition-colors disabled:opacity-50"
                      >
                        Accetta
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ═══════════════ Main Export ═══════════════ */

export default function DashboardPage() {
  const { mode } = useMode();

  if (mode === "host") {
    return <HostPrenotazioni />;
  }

  return <GuestSoggiorni />;
}
