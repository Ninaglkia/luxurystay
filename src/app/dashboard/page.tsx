"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  CalendarCheck,
  Heart,
  MessageCircle,
  Plane,
  Search,
  MapPin,
  TrendingUp,
  TrendingDown,
  Home,
  Euro,
  Users,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useMode } from "./components/mode-context";
import { HostDashboard } from "./components/host-dashboard";

interface BookingPreview {
  id: string;
  property_id: string;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  property_title?: string;
  property_photo?: string;
  property_address?: string;
  created_at?: string;
}

const fadeSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.08, duration: 0.4, ease: "easeOut" as const },
  }),
};

function formatDateIT(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("it-IT", { day: "numeric", month: "short" });
}

function getTodayFormatted(): string {
  return new Date().toLocaleDateString("it-IT", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

/* ═══════════════ Stat Card ═══════════════ */
function StatCard({
  label,
  value,
  icon: Icon,
  iconBg,
  iconColor,
  trend,
  index,
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  iconBg: string;
  iconColor: string;
  trend?: { value: string; positive: boolean };
  index: number;
}) {
  return (
    <motion.div custom={index} initial="hidden" animate="visible" variants={fadeSlide}>
      <div className="bg-white rounded-2xl border border-neutral-100 p-5 hover:shadow-md transition-all group">
        <div className="flex items-start justify-between mb-4">
          <div className={`w-11 h-11 rounded-xl ${iconBg} flex items-center justify-center`}>
            <Icon className={`w-5 h-5 ${iconColor}`} strokeWidth={1.5} />
          </div>
          {trend && (
            <div
              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                trend.positive
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-500"
              }`}
            >
              {trend.positive ? (
                <TrendingUp className="w-3 h-3" />
              ) : (
                <TrendingDown className="w-3 h-3" />
              )}
              {trend.value}
            </div>
          )}
        </div>
        <p className="text-2xl font-bold text-neutral-900">{value}</p>
        <p className="text-sm text-neutral-500 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ═══════════════ Mini Bar Chart ═══════════════ */
function MiniBarChart({ data }: { data: { label: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div className="flex items-end gap-2 h-36">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
          <div className="w-full relative flex flex-col justify-end h-28">
            <motion.div
              className="w-full rounded-t-md bg-gradient-to-t from-violet-500 to-violet-400"
              initial={{ height: 0 }}
              animate={{ height: `${(d.value / max) * 100}%` }}
              transition={{ delay: 0.3 + i * 0.08, duration: 0.5, ease: "easeOut" }}
            />
          </div>
          <span className="text-[10px] text-neutral-400 font-medium">{d.label}</span>
        </div>
      ))}
    </div>
  );
}

/* ═══════════════ Donut Chart ═══════════════ */
function DonutChart({
  segments,
  centerLabel,
  centerValue,
}: {
  segments: { label: string; value: number; color: string }[];
  centerLabel: string;
  centerValue: string | number;
}) {
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  let cumulative = 0;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="relative w-32 h-32">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {segments.map((seg, i) => {
            const pct = seg.value / total;
            const offset = cumulative * circumference;
            cumulative += pct;
            return (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={radius}
                fill="none"
                stroke={seg.color}
                strokeWidth="12"
                strokeDasharray={`${pct * circumference} ${circumference}`}
                strokeDashoffset={-offset}
                strokeLinecap="round"
                className="transition-all duration-700"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-bold text-neutral-900">{centerValue}</span>
          <span className="text-[10px] text-neutral-400">{centerLabel}</span>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 justify-center">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-neutral-500">{seg.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════ Status Badge ═══════════════ */
function StatusBadge({ status }: { status: string }) {
  const config: Record<string, { bg: string; text: string; label: string }> = {
    confirmed: { bg: "bg-emerald-50", text: "text-emerald-600", label: "Confermata" },
    authorized: { bg: "bg-blue-50", text: "text-blue-600", label: "Autorizzata" },
    captured: { bg: "bg-violet-50", text: "text-violet-600", label: "Completata" },
    cancelled: { bg: "bg-red-50", text: "text-red-500", label: "Cancellata" },
    pending: { bg: "bg-amber-50", text: "text-amber-600", label: "In attesa" },
  };
  const c = config[status] || config.pending;
  return (
    <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${c.bg} ${c.text}`}>
      {c.label}
    </span>
  );
}

/* ═══════════════ Guest Dashboard ═══════════════ */
function GuestDashboard() {
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [activeBookings, setActiveBookings] = useState(0);
  const [totalSpent, setTotalSpent] = useState(0);
  const [totalGuests, setTotalGuests] = useState(0);
  const [upcomingTrips, setUpcomingTrips] = useState<BookingPreview[]>([]);
  const [recentBookings, setRecentBookings] = useState<BookingPreview[]>([]);
  const [monthlyData, setMonthlyData] = useState<{ label: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(
        user.user_metadata?.full_name?.split(" ")[0] ||
          user.email?.split("@")[0] ||
          ""
      );

      // Fetch all bookings
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, property_id, check_in, check_out, guests, total_price, status, created_at")
        .eq("guest_id", user.id)
        .order("created_at", { ascending: false });

      const allBookings = bookings || [];
      const active = allBookings.filter((b) =>
        ["confirmed", "authorized", "captured"].includes(b.status)
      );
      setActiveBookings(active.length);
      setTotalSpent(active.reduce((s, b) => s + Number(b.total_price), 0));
      setTotalGuests(active.reduce((s, b) => s + b.guests, 0));

      // Monthly spending (last 6 months)
      const months = ["Gen", "Feb", "Mar", "Apr", "Mag", "Giu", "Lug", "Ago", "Set", "Ott", "Nov", "Dic"];
      const now = new Date();
      const monthlyMap: Record<string, number> = {};
      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        monthlyMap[key] = 0;
      }
      active.forEach((b) => {
        const key = b.created_at?.slice(0, 7);
        if (key && key in monthlyMap) {
          monthlyMap[key] += Number(b.total_price);
        }
      });
      setMonthlyData(
        Object.entries(monthlyMap).map(([key, value]) => ({
          label: months[parseInt(key.split("-")[1]) - 1],
          value,
        }))
      );

      // Upcoming trips
      const today = new Date().toISOString().split("T")[0];
      const upcoming = active
        .filter((b) => b.check_in >= today)
        .sort((a, b) => a.check_in.localeCompare(b.check_in))
        .slice(0, 3);

      // Recent bookings (last 5)
      const recent = allBookings.slice(0, 5);

      // Fetch property details
      const allPropIds = [
        ...new Set([...upcoming, ...recent].map((b) => b.property_id)),
      ];
      let propMap = new Map<string, { title: string; photos: string[]; address: string }>();
      if (allPropIds.length > 0) {
        const { data: props } = await supabase
          .from("properties")
          .select("id, title, photos, address")
          .in("id", allPropIds);
        propMap = new Map((props || []).map((p) => [p.id, p]));
      }

      const enrich = (b: BookingPreview) => {
        const prop = propMap.get(b.property_id);
        return {
          ...b,
          property_title: prop?.title || "Alloggio",
          property_photo: prop?.photos?.[0] || undefined,
          property_address: prop?.address || "",
        };
      };

      setUpcomingTrips(upcoming.map(enrich));
      setRecentBookings(recent.map(enrich));
      setLoading(false);
    }
    load();
  }, [supabase]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-14 bg-neutral-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3 h-64 bg-neutral-100 rounded-2xl animate-pulse" />
          <div className="lg:col-span-2 h-64 bg-neutral-100 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const stats = [
    {
      label: "Prenotazioni",
      value: activeBookings,
      icon: CalendarCheck,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
    {
      label: "Spesa totale",
      value: `€${totalSpent.toLocaleString("it-IT")}`,
      icon: Euro,
      iconBg: "bg-emerald-50",
      iconColor: "text-emerald-600",
    },
    {
      label: "Ospiti totali",
      value: totalGuests,
      icon: Users,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Preferiti",
      value: 0,
      icon: Heart,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    },
  ];

  const bookingsByStatus = [
    {
      label: "Confermate",
      value: recentBookings.filter((b) => b.status === "confirmed").length,
      color: "#10b981",
    },
    {
      label: "Autorizzate",
      value: recentBookings.filter((b) => b.status === "authorized").length,
      color: "#6366f1",
    },
    {
      label: "Completate",
      value: recentBookings.filter((b) => b.status === "captured").length,
      color: "#8b5cf6",
    },
    {
      label: "Cancellate",
      value: recentBookings.filter((b) => b.status === "cancelled").length,
      color: "#ef4444",
    },
  ].filter((s) => s.value > 0);

  return (
    <div className="space-y-6">
      {/* ═══ Welcome header ═══ */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl lg:text-[28px] font-bold text-neutral-900">
            Bentornato, {userName}
          </h1>
          <p className="text-neutral-400 text-sm mt-1 capitalize">{getTodayFormatted()}</p>
        </div>
        <Link
          href="/dashboard/bookings"
          className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
        >
          <CalendarCheck className="w-4 h-4" />
          Le mie prenotazioni
        </Link>
      </motion.div>

      {/* ═══ Stats cards ═══ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, i) => (
          <StatCard key={stat.label} {...stat} index={i} />
        ))}
      </div>

      {/* ═══ Charts row ═══ */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Revenue / Spending chart */}
        <motion.div
          custom={4}
          initial="hidden"
          animate="visible"
          variants={fadeSlide}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-base font-semibold text-neutral-900">Spese mensili</h3>
                <p className="text-sm text-neutral-400 mt-0.5">Ultimi 6 mesi</p>
              </div>
              <div className="w-9 h-9 rounded-xl bg-violet-50 flex items-center justify-center">
                <BarChart3 className="w-4 h-4 text-violet-600" />
              </div>
            </div>
            {monthlyData.some((d) => d.value > 0) ? (
              <MiniBarChart data={monthlyData} />
            ) : (
              <div className="h-36 flex items-center justify-center text-sm text-neutral-400">
                Nessun dato disponibile
              </div>
            )}
          </div>
        </motion.div>

        {/* Donut chart */}
        <motion.div
          custom={5}
          initial="hidden"
          animate="visible"
          variants={fadeSlide}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-neutral-900">Prenotazioni</h3>
              <span className="text-xs text-neutral-400">Per stato</span>
            </div>
            <div className="flex-1 flex items-center justify-center">
              {bookingsByStatus.length > 0 ? (
                <DonutChart
                  segments={bookingsByStatus}
                  centerLabel="Totale"
                  centerValue={recentBookings.length}
                />
              ) : (
                <div className="text-sm text-neutral-400">Nessuna prenotazione</div>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ═══ Bottom row ═══ */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Upcoming trips */}
        <motion.div
          custom={6}
          initial="hidden"
          animate="visible"
          variants={fadeSlide}
          className="lg:col-span-3"
        >
          <div className="bg-white rounded-2xl border border-neutral-100 p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-base font-semibold text-neutral-900">Prossimi viaggi</h3>
              {upcomingTrips.length > 0 && (
                <Link
                  href="/dashboard/bookings"
                  className="text-sm font-medium text-violet-600 hover:text-violet-700 flex items-center gap-1 transition-colors"
                >
                  Vedi tutti <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {upcomingTrips.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mb-4">
                  <Plane className="w-7 h-7 text-violet-400" strokeWidth={1.5} />
                </div>
                <h3 className="text-sm font-semibold text-neutral-900 mb-1">
                  Nessun viaggio in programma
                </h3>
                <p className="text-xs text-neutral-400 mb-5 max-w-xs">
                  Esplora le destinazioni e prenota il tuo prossimo soggiorno.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl text-sm font-medium hover:bg-violet-700 transition-colors"
                >
                  <Search className="w-4 h-4" />
                  Esplora alloggi
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingTrips.map((trip) => (
                  <Link key={trip.id} href={`/dashboard/bookings/${trip.id}`}>
                    <div className="flex items-center gap-4 p-3 rounded-xl hover:bg-neutral-50 transition-colors group cursor-pointer">
                      <div className="w-16 h-14 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                        {trip.property_photo ? (
                          <img
                            src={trip.property_photo}
                            alt=""
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-4 h-4 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {trip.property_title}
                        </p>
                        <p className="text-xs text-neutral-400 mt-0.5">
                          {formatDateIT(trip.check_in)} - {formatDateIT(trip.check_out)} &middot;{" "}
                          {trip.guests} ospite{trip.guests > 1 ? "i" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-neutral-900">
                          &euro;{Number(trip.total_price).toLocaleString("it-IT")}
                        </p>
                        <StatusBadge status={trip.status} />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.div>

        {/* Quick actions */}
        <motion.div
          custom={7}
          initial="hidden"
          animate="visible"
          variants={fadeSlide}
          className="lg:col-span-2"
        >
          <div className="bg-white rounded-2xl border border-neutral-100 p-6 h-full">
            <h3 className="text-base font-semibold text-neutral-900 mb-5">Azioni rapide</h3>
            <div className="space-y-3">
              {[
                {
                  label: "Esplora alloggi",
                  desc: "Cerca sulla mappa",
                  icon: Search,
                  href: "/",
                  color: "bg-violet-50 text-violet-600",
                },
                {
                  label: "Le mie prenotazioni",
                  desc: "Gestisci i soggiorni",
                  icon: CalendarCheck,
                  href: "/dashboard/bookings",
                  color: "bg-emerald-50 text-emerald-600",
                },
                {
                  label: "Preferiti",
                  desc: "Alloggi salvati",
                  icon: Heart,
                  href: "/dashboard/favorites",
                  color: "bg-rose-50 text-rose-500",
                },
                {
                  label: "Messaggi",
                  desc: "Parla col concierge",
                  icon: MessageCircle,
                  href: "/dashboard/messages",
                  color: "bg-blue-50 text-blue-600",
                },
              ].map((action) => (
                <Link key={action.href} href={action.href}>
                  <div className="flex items-center gap-3 p-3 rounded-xl hover:bg-neutral-50 transition-colors group cursor-pointer">
                    <div
                      className={`w-10 h-10 rounded-xl ${action.color} flex items-center justify-center shrink-0`}
                    >
                      <action.icon className="w-4.5 h-4.5" strokeWidth={1.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900">{action.label}</p>
                      <p className="text-xs text-neutral-400">{action.desc}</p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-violet-500 transition-colors" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const { mode } = useMode();

  if (mode === "host") {
    return (
      <div className="flex flex-col h-full">
        <div className="mb-3 hidden lg:block">
          <h1 className="text-2xl font-semibold text-neutral-900">I tuoi immobili</h1>
          <p className="text-neutral-500 text-sm mt-1">
            Gestisci le tue proprietà e monitora le prenotazioni
          </p>
        </div>
        <HostDashboard />
      </div>
    );
  }

  return <GuestDashboard />;
}
