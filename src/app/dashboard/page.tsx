"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { CalendarCheck, Heart, MessageCircle, Plane, Search, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { useMode } from "./components/mode-context";
import { ExploreMap } from "./components/explore-map";
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
}

const fadeSlide = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.4, ease: "easeOut" as const },
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

function GuestDashboard() {
  const supabase = createClient();
  const [userName, setUserName] = useState("");
  const [activeBookings, setActiveBookings] = useState(0);
  const [upcomingTrips, setUpcomingTrips] = useState<BookingPreview[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      setUserName(user.user_metadata?.full_name?.split(" ")[0] || user.email?.split("@")[0] || "");

      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, property_id, check_in, check_out, guests, total_price, status")
        .eq("guest_id", user.id)
        .in("status", ["confirmed", "authorized", "captured"])
        .order("check_in", { ascending: true });

      const allBookings = bookings || [];
      setActiveBookings(allBookings.length);

      const today = new Date().toISOString().split("T")[0];
      const upcoming = allBookings.filter((b) => b.check_in >= today).slice(0, 3);

      if (upcoming.length > 0) {
        const propIds = [...new Set(upcoming.map((b) => b.property_id))];
        const { data: props } = await supabase
          .from("properties")
          .select("id, title, photos, address")
          .in("id", propIds);

        const propMap = new Map((props || []).map((p) => [p.id, p]));
        setUpcomingTrips(
          upcoming.map((b) => {
            const prop = propMap.get(b.property_id);
            return {
              ...b,
              property_title: prop?.title || "Alloggio",
              property_photo: prop?.photos?.[0] || null,
              property_address: prop?.address || "",
            };
          })
        );
      }

      setLoading(false);
    }
    load();
  }, [supabase]);

  const stats = [
    {
      label: "Prenotazioni attive",
      value: activeBookings,
      icon: CalendarCheck,
      iconBg: "bg-blue-50",
      iconColor: "text-blue-600",
    },
    {
      label: "Preferiti salvati",
      value: 0,
      icon: Heart,
      iconBg: "bg-rose-50",
      iconColor: "text-rose-500",
    },
    {
      label: "Messaggi non letti",
      value: 0,
      icon: MessageCircle,
      iconBg: "bg-violet-50",
      iconColor: "text-violet-600",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-16 bg-neutral-100 rounded-2xl animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 bg-neutral-100 rounded-2xl animate-pulse" />
          ))}
        </div>
        <div className="h-48 bg-neutral-100 rounded-2xl animate-pulse" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Welcome header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-2xl lg:text-[28px] font-semibold text-neutral-900">
          Bentornato, {userName}
        </h1>
        <p className="text-neutral-500 text-sm mt-1 capitalize">{getTodayFormatted()}</p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            custom={i}
            initial="hidden"
            animate="visible"
            variants={fadeSlide}
          >
            <Card className="border-neutral-100 bg-white hover:shadow-md transition-shadow py-0">
              <CardContent className="flex items-center gap-4 p-5">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
                  <stat.icon className={`w-6 h-6 ${stat.iconColor}`} strokeWidth={1.5} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-neutral-900">{stat.value}</p>
                  <p className="text-xs text-neutral-500">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Upcoming trips */}
      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fadeSlide}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">Prossimi viaggi</h2>
          {upcomingTrips.length > 0 && (
            <Link
              href="/dashboard/bookings"
              className="text-sm font-medium text-neutral-500 hover:text-neutral-900 transition-colors"
            >
              Vedi tutti
            </Link>
          )}
        </div>

        {upcomingTrips.length === 0 ? (
          <Card className="border-neutral-100 bg-white py-0">
            <CardContent className="flex flex-col items-center justify-center py-14 text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center mb-5">
                <Plane className="w-8 h-8 text-amber-400" strokeWidth={1.5} />
              </div>
              <h3 className="text-base font-semibold text-neutral-900 mb-1.5">
                Nessun viaggio in programma
              </h3>
              <p className="text-sm text-neutral-500 mb-6 max-w-xs">
                Esplora le destinazioni disponibili e prenota il tuo prossimo soggiorno.
              </p>
              <Link
                href="/dashboard/explore"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors"
              >
                <Search className="w-4 h-4" />
                Esplora alloggi
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {upcomingTrips.map((trip, i) => (
              <motion.div
                key={trip.id}
                custom={4 + i}
                initial="hidden"
                animate="visible"
                variants={fadeSlide}
              >
                <Link href={`/dashboard/bookings/${trip.id}`}>
                  <Card className="border-neutral-100 bg-white hover:shadow-md transition-shadow cursor-pointer py-0">
                    <CardContent className="flex items-center gap-4 p-4">
                      <div className="w-20 h-16 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                        {trip.property_photo ? (
                          <img src={trip.property_photo} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-neutral-300" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-neutral-900 truncate">
                          {trip.property_title}
                        </p>
                        <p className="text-xs text-neutral-500 truncate mt-0.5">
                          {trip.property_address}
                        </p>
                        <p className="text-xs text-neutral-400 mt-1">
                          {formatDateIT(trip.check_in)} - {formatDateIT(trip.check_out)} &middot; {trip.guests} ospite{trip.guests > 1 ? "i" : ""}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-sm font-bold text-neutral-900">
                          &euro;{Number(trip.total_price).toLocaleString("it-IT")}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
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
