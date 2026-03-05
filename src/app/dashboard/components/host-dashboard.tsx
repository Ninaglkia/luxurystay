"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

// 3D tilt card component
function Tilt3DCard({ children, className = "", intensity = 8 }: { children: React.ReactNode; className?: string; intensity?: number }) {
  const ref = useRef<HTMLDivElement>(null);

  function handleMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const rotateX = ((y - centerY) / centerY) * -intensity;
    const rotateY = ((x - centerX) / centerX) * intensity;
    el.style.transform = `perspective(600px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
  }

  function handleMouseLeave() {
    const el = ref.current;
    if (!el) return;
    el.style.transform = "perspective(600px) rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)";
  }

  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={className}
      style={{ transition: "transform 0.15s ease-out", transformStyle: "preserve-3d", willChange: "transform" }}
    >
      {children}
    </div>
  );
}

interface Property {
  id: string;
  title: string;
  address: string;
  price: number;
  category: string;
  photos: string[];
  status: string;
  created_at: string;
  guests: number;
  bedrooms: number;
  beds: number;
  bathrooms: number;
  amenities: string[];
  cancellation_policy: string;
}

interface Booking {
  id: string;
  property_id: string;
  guest_id: string | null;
  check_in: string;
  check_out: string;
  guests: number;
  total_price: number;
  status: string;
  payment_status: string;
  payment_type: string;
  guest_name: string | null;
  guest_email: string | null;
  guest_phone: string | null;
  created_at: string;
  property_title?: string;
  profile_name?: string;
}

interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  earnings: number;
}

const HOST_COMMISSION_RATE = 0.05;

const ALL_AMENITIES: { id: string; label: string; icon: string }[] = [
  { id: "wifi", label: "Wi-Fi", icon: "M8.288 15.038a5.25 5.25 0 0 1 7.424 0M5.106 11.856c3.807-3.808 9.98-3.808 13.788 0M1.924 8.674c5.565-5.565 14.587-5.565 20.152 0M12.53 18.22l-.53.53-.53-.53a.75.75 0 0 1 1.06 0Z" },
  { id: "tv", label: "TV", icon: "M6 20.25h12m-7.5-3v3m3-3v3m-10.125-3h17.25c.621 0 1.125-.504 1.125-1.125V4.875c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125Z" },
  { id: "cucina", label: "Cucina", icon: "M12 8.25v-1.5m0 1.5c-1.355 0-2.697.056-4.024.166C6.845 8.51 6 9.473 6 10.608v2.513m6-4.871c1.355 0 2.697.056 4.024.166C17.155 8.51 18 9.473 18 10.608v2.513M15 8.25v-1.5m-6 1.5v-1.5m12 9.75-1.5.75a3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0 3.354 3.354 0 0 0-3 0 3.354 3.354 0 0 1-3 0L3 16.5m18-12.75H3" },
  { id: "lavatrice", label: "Lavatrice", icon: "M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" },
  { id: "aria", label: "Aria condizionata", icon: "M12 3v2.25m6.364.386-1.591 1.591M21 12h-2.25m-.386 6.364-1.591-1.591M12 18.75V21m-4.773-4.227-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0Z" },
  { id: "piscina", label: "Piscina", icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" },
  { id: "parcheggio", label: "Parcheggio", icon: "M8.25 18.75a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 0 1-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 0 0-3.213-9.193 2.056 2.056 0 0 0-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 0 0-10.026 0 1.106 1.106 0 0 0-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" },
  { id: "riscaldamento", label: "Riscaldamento", icon: "M15.362 5.214A8.252 8.252 0 0 1 12 21 8.25 8.25 0 0 1 6.038 7.047 8.287 8.287 0 0 0 9 9.601a8.983 8.983 0 0 1 3.361-6.867 8.21 8.21 0 0 0 3 2.48Z" },
  { id: "giardino", label: "Giardino", icon: "M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" },
  { id: "animali", label: "Animali ammessi", icon: "M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V3a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" },
];

const categoryLabels: Record<string, string> = {
  casa: "Casa", villa: "Villa", appartamento: "Appartamento", baita: "Baita",
  bb: "B&B", barca: "Barca", camper: "Camper", castello: "Castello", loft: "Loft",
};

export function HostDashboard() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ total: 0, pending: 0, confirmed: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedTab, setExpandedTab] = useState<"prezzo" | "servizi">("prezzo");
  const [editingPrice, setEditingPrice] = useState<{ id: string; value: string } | null>(null);
  const [savingAmenity, setSavingAmenity] = useState(false);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: propsData } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const props = (propsData || []) as Property[];
    setProperties(props);

    if (props.length === 0) {
      setLoading(false);
      return;
    }

    const propertyIds = props.map((p) => p.id);

    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    const rawBookings = bookingsData || [];

    const titleMap: Record<string, string> = {};
    for (const p of props) {
      titleMap[p.id] = p.title;
    }

    const guestIds = rawBookings
      .filter((b) => b.guest_id)
      .map((b) => b.guest_id as string);

    const uniqueGuestIds = [...new Set(guestIds)];
    let profileMap: Record<string, string> = {};

    if (uniqueGuestIds.length > 0) {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", uniqueGuestIds);

      if (profiles) {
        for (const p of profiles) {
          profileMap[p.id] = p.full_name || "";
        }
      }
    }

    const enrichedBookings: Booking[] = rawBookings.map((b) => ({
      ...b,
      property_title: titleMap[b.property_id] || "Immobile rimosso",
      profile_name: b.guest_id ? profileMap[b.guest_id] || null : null,
    }));

    setBookings(enrichedBookings);

    const total = rawBookings.length;
    const pending = rawBookings.filter((b) => ["pending", "pending_payment"].includes(b.status)).length;
    const confirmed = rawBookings.filter((b) => ["authorized", "confirmed", "captured"].includes(b.status)).length;
    const grossEarnings = rawBookings
      .filter((b) => ["confirmed", "captured", "completed"].includes(b.status))
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);
    const earnings = Math.round(grossEarnings * (1 - HOST_COMMISSION_RATE));

    setStats({ total, pending, confirmed, earnings });
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function handleToggleStatus(property: Property) {
    setActionLoading(property.id);
    const newStatus = property.status === "active" ? "paused" : "active";
    await supabase.from("properties").update({ status: newStatus }).eq("id", property.id);
    await loadData();
    setActionLoading(null);
  }

  async function handleDelete(property: Property) {
    if (!window.confirm(`Sei sicuro di voler eliminare "${property.title}"? Questa azione non può essere annullata.`)) return;
    setActionLoading(property.id);
    await supabase.from("properties").delete().eq("id", property.id);
    await loadData();
    setActionLoading(null);
  }

  async function handleSavePrice(propertyId: string) {
    if (!editingPrice || editingPrice.id !== propertyId) return;
    const newPrice = parseInt(editingPrice.value, 10);
    if (isNaN(newPrice) || newPrice < 1) return;
    setActionLoading(propertyId);
    await supabase.from("properties").update({ price: newPrice }).eq("id", propertyId);
    setEditingPrice(null);
    await loadData();
    setActionLoading(null);
  }

  async function handleToggleAmenity(property: Property, amenityId: string) {
    setSavingAmenity(true);
    const current = property.amenities || [];
    const updated = current.includes(amenityId)
      ? current.filter((a) => a !== amenityId)
      : [...current, amenityId];
    await supabase.from("properties").update({ amenities: updated }).eq("id", property.id);
    await loadData();
    setSavingAmenity(false);
  }

  async function handleBookingAction(bookingId: string, newStatus: "confirmed" | "cancelled") {
    setActionLoading(bookingId);
    await supabase.from("bookings").update({ status: newStatus }).eq("id", bookingId);
    await loadData();
    setActionLoading(null);
  }

  function formatDate(dateStr: string): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  }

  function getStatusConfig(status: string) {
    const map: Record<string, { label: string; bg: string; text: string; dot: string }> = {
      confirmed: { label: "Confermata", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      authorized: { label: "Autorizzata", bg: "bg-blue-50", text: "text-blue-700", dot: "bg-blue-500" },
      captured: { label: "Pagata", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      pending: { label: "In attesa", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
      pending_payment: { label: "In attesa", bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" },
      cancelled: { label: "Annullata", bg: "bg-red-50", text: "text-red-700", dot: "bg-red-500" },
      completed: { label: "Completata", bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" },
      expired: { label: "Scaduta", bg: "bg-neutral-100", text: "text-neutral-500", dot: "bg-neutral-400" },
      refunded: { label: "Rimborsata", bg: "bg-purple-50", text: "text-purple-700", dot: "bg-purple-500" },
    };
    return map[status] || { label: status, bg: "bg-neutral-100", text: "text-neutral-500", dot: "bg-neutral-400" };
  }

  function getGuestDisplayName(booking: Booking): string {
    return booking.profile_name || booking.guest_name || "Ospite";
  }

  function getGuestInitial(booking: Booking): string {
    const name = getGuestDisplayName(booking);
    return name[0]?.toUpperCase() || "O";
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-24 bg-white rounded-2xl animate-pulse" />
          ))}
        </div>
        {[1, 2].map((i) => (
          <div key={i} className="h-44 bg-white rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  if (properties.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-rose-50 to-orange-50 flex items-center justify-center mb-6 animate-[float_3s_ease-in-out_infinite]" style={{ animation: "float 3s ease-in-out infinite" }}>
          <svg className="w-12 h-12 text-rose-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-neutral-900 mb-2">Inizia a guadagnare</h3>
        <p className="text-neutral-500 text-sm mb-8 max-w-sm">
          Pubblica il tuo primo immobile e inizia a ricevere prenotazioni da viaggiatori di tutto il mondo.
        </p>
        <Link
          href="/dashboard/add-property"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-600 text-white rounded-xl text-sm font-semibold hover:from-rose-600 hover:to-pink-700 transition-all shadow-lg shadow-rose-500/25 cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Pubblica il tuo immobile
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          {
            value: properties.length,
            label: "Immobili",
            iconBg: "bg-blue-50",
            iconColor: "text-blue-600",
            icon: "m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
          },
          {
            value: stats.total,
            label: "Prenotazioni",
            iconBg: "bg-violet-50",
            iconColor: "text-violet-600",
            icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5",
          },
          {
            value: stats.pending,
            label: "In attesa",
            iconBg: "bg-amber-50",
            iconColor: "text-amber-600",
            icon: "M12 6v6h4.5m4.5 0a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z",
            valueColor: stats.pending > 0 ? "text-amber-600" : undefined,
          },
          {
            value: `\u20AC ${stats.earnings.toLocaleString("it-IT")}`,
            label: "Guadagni netti",
            iconBg: "bg-emerald-50",
            iconColor: "text-emerald-600",
            icon: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z",
            valueColor: "text-emerald-600",
          },
        ].map((stat, i) => (
          <Tilt3DCard key={i} className="bg-white rounded-2xl border border-neutral-100 p-4 flex items-start gap-3 shadow-sm hover:shadow-md">
            <div className={`w-10 h-10 rounded-xl ${stat.iconBg} flex items-center justify-center shrink-0`}>
              <svg className={`w-5 h-5 ${stat.iconColor}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
              </svg>
            </div>
            <div>
              <p className={`text-xl font-bold ${stat.valueColor || "text-neutral-900"}`}>{stat.value}</p>
              <p className="text-xs text-neutral-500">{stat.label}</p>
            </div>
          </Tilt3DCard>
        ))}
      </div>

      {/* ── PROPERTIES ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">I tuoi immobili</h2>
          <Link
            href="/dashboard/add-property"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
            </svg>
            Aggiungi
          </Link>
        </div>

        <div className="space-y-4">
          {properties.map((property) => {
            const isExpanded = expandedId === property.id;
            const propAmenities = property.amenities || [];
            const netPerNight = Math.round(property.price * (1 - HOST_COMMISSION_RATE));
            const activeAmenities = ALL_AMENITIES.filter((a) => propAmenities.includes(a.id));

            return (
              <div key={property.id} className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${isExpanded ? "border-neutral-300 shadow-lg" : "border-neutral-100 hover:shadow-md"}`}>
                {/* Card */}
                <div className="p-4 lg:p-5">
                  <div className="flex gap-4">
                    {/* Photo */}
                    <Tilt3DCard intensity={12} className="w-24 h-24 lg:w-36 lg:h-28 rounded-xl overflow-hidden bg-neutral-100 shrink-0">
                      {property.photos[0] ? (
                        <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
                          </svg>
                        </div>
                      )}
                    </Tilt3DCard>

                    {/* Info */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-neutral-900 truncate text-[15px]">{property.title}</h3>
                            <p className="text-sm text-neutral-500 truncate">{property.address}</p>
                          </div>
                          {/* Toggle */}
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStatus(property); }}
                            disabled={actionLoading === property.id}
                            className="shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          >
                            <span className={`text-xs font-medium hidden sm:block ${property.status === "active" ? "text-emerald-600" : "text-neutral-400"}`}>
                              {actionLoading === property.id ? "..." : property.status === "active" ? "Attivo" : "Pausa"}
                            </span>
                            <div className={`relative w-11 h-6 rounded-full transition-colors ${property.status === "active" ? "bg-emerald-500" : "bg-neutral-300"}`}>
                              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-transform ${property.status === "active" ? "left-[24px]" : "left-1"}`} />
                            </div>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-end justify-between mt-2 gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs text-neutral-400 bg-neutral-50 px-2 py-0.5 rounded-md">
                            {categoryLabels[property.category] || property.category}
                          </span>
                          <span className="text-xs text-neutral-500">
                            {property.guests} ospiti &middot; {property.bedrooms} cam &middot; {property.beds} letti
                          </span>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-base font-bold text-neutral-900">&euro;{property.price}<span className="text-neutral-400 font-normal text-sm">/notte</span></p>
                          <p className="text-xs text-emerald-600 font-semibold">&euro;{netPerNight} netto</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Amenity chips (collapsed view) */}
                  {!isExpanded && activeAmenities.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-3 flex-wrap">
                      {activeAmenities.slice(0, 5).map((a) => (
                        <span key={a.id} className="inline-flex items-center gap-1 text-[11px] text-neutral-500 bg-neutral-50 px-2 py-1 rounded-md">
                          <svg className="w-3 h-3 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={a.icon} />
                          </svg>
                          {a.label}
                        </span>
                      ))}
                      {activeAmenities.length > 5 && (
                        <span className="text-[11px] text-neutral-400">+{activeAmenities.length - 5}</span>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3 pt-3 border-t border-neutral-100">
                    <button
                      onClick={() => { setExpandedId(isExpanded ? null : property.id); setExpandedTab("prezzo"); }}
                      className={`text-xs font-medium px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                        isExpanded
                          ? "bg-neutral-900 text-white"
                          : "bg-neutral-100 text-neutral-700 hover:bg-neutral-200"
                      }`}
                    >
                      <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                      </svg>
                      Gestisci
                    </button>
                    <Link
                      href={`/dashboard/add-property?edit=${property.id}`}
                      className="text-xs font-medium px-3.5 py-2 rounded-lg bg-neutral-100 text-neutral-700 hover:bg-neutral-200 transition-colors cursor-pointer"
                    >
                      Modifica
                    </Link>
                    <button
                      onClick={() => handleDelete(property)}
                      disabled={actionLoading === property.id}
                      className="text-xs font-medium px-3.5 py-2 rounded-lg text-red-500 hover:bg-red-50 transition-colors cursor-pointer disabled:opacity-50 ml-auto"
                    >
                      Elimina
                    </button>
                  </div>
                </div>

                {/* ── Expanded Panel ── */}
                {isExpanded && (
                  <div className="border-t border-neutral-200">
                    {/* Tabs */}
                    <div className="flex border-b border-neutral-100 bg-neutral-50/50">
                      {([
                        { id: "prezzo" as const, label: "Prezzo e guadagni", icon: "M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" },
                        { id: "servizi" as const, label: "Servizi e comfort", icon: "M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" },
                      ]).map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setExpandedTab(tab.id)}
                          className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors cursor-pointer border-b-2 ${
                            expandedTab === tab.id
                              ? "border-neutral-900 text-neutral-900"
                              : "border-transparent text-neutral-400 hover:text-neutral-600"
                          }`}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d={tab.icon} />
                          </svg>
                          {tab.label}
                        </button>
                      ))}
                    </div>

                    {expandedTab === "prezzo" && (
                      <div className="p-5">
                        {/* Price editor */}
                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5 p-4 bg-neutral-50 rounded-xl">
                          <label className="text-sm font-medium text-neutral-700">Prezzo per notte</label>
                          <div className="flex items-center gap-2">
                            <div className="relative">
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">&euro;</span>
                              <input
                                type="number"
                                min="1"
                                value={editingPrice?.id === property.id ? editingPrice.value : property.price}
                                onChange={(e) => setEditingPrice({ id: property.id, value: e.target.value })}
                                className="w-32 pl-7 pr-3 py-2.5 border border-neutral-200 rounded-xl text-sm font-semibold text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent bg-white"
                              />
                            </div>
                            {editingPrice?.id === property.id && editingPrice.value !== String(property.price) && (
                              <button
                                onClick={() => handleSavePrice(property.id)}
                                disabled={actionLoading === property.id}
                                className="px-4 py-2.5 bg-neutral-900 text-white rounded-xl text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Salva
                              </button>
                            )}
                          </div>
                        </div>

                        {/* Earnings table */}
                        <div className="rounded-xl border border-neutral-200 overflow-hidden">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="bg-neutral-50">
                                <th className="text-left py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wide">Durata</th>
                                <th className="text-right py-3 px-4 text-neutral-500 font-medium text-xs uppercase tracking-wide">Prezzo</th>
                                <th className="text-right py-3 px-4 text-emerald-600 font-medium text-xs uppercase tracking-wide">Tuo guadagno</th>
                              </tr>
                            </thead>
                            <tbody>
                              {[1, 3, 7, 14, 30].map((nights, i) => {
                                const gross = property.price * nights;
                                const net = Math.round(gross * (1 - HOST_COMMISSION_RATE));
                                return (
                                  <tr key={nights} className={i % 2 === 0 ? "bg-white" : "bg-neutral-50/50"}>
                                    <td className="py-3 px-4 text-neutral-700 font-medium">
                                      {nights} {nights === 1 ? "notte" : "notti"}
                                    </td>
                                    <td className="py-3 px-4 text-right text-neutral-600">
                                      &euro;{gross.toLocaleString("it-IT")}
                                    </td>
                                    <td className="py-3 px-4 text-right text-emerald-600 font-bold">
                                      &euro;{net.toLocaleString("it-IT")}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs text-neutral-400 mt-3">
                          Commissione piattaforma: 5%. L&apos;ospite paga un ulteriore 15% di costi del servizio.
                        </p>
                      </div>
                    )}

                    {expandedTab === "servizi" && (
                      <div className="p-5">
                        <p className="text-sm text-neutral-500 mb-4">
                          Attiva i servizi offerti dalla tua struttura. Gli ospiti potranno filtrarli nella ricerca.
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                          {ALL_AMENITIES.map((amenity) => {
                            const isActive = propAmenities.includes(amenity.id);
                            return (
                              <button
                                key={amenity.id}
                                onClick={() => handleToggleAmenity(property, amenity.id)}
                                disabled={savingAmenity}
                                className={`flex items-center gap-2.5 px-3.5 py-3 rounded-xl border text-sm transition-all cursor-pointer disabled:opacity-60 ${
                                  isActive
                                    ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                                    : "border-neutral-200 bg-white text-neutral-500 hover:border-neutral-300 hover:text-neutral-700"
                                }`}
                              >
                                {isActive ? (
                                  <svg className="w-4 h-4 text-emerald-600 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4 text-neutral-300 shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d={amenity.icon} />
                                  </svg>
                                )}
                                <span className="truncate">{amenity.label}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── BOOKINGS ── */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Prenotazioni recenti</h2>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-neutral-100 p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-violet-400" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5" />
              </svg>
            </div>
            <p className="text-sm text-neutral-500">Nessuna prenotazione ancora. Arriveranno presto!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => {
              const sc = getStatusConfig(booking.status);
              return (
                <div key={booking.id} className="bg-white rounded-2xl border border-neutral-100 p-4 hover:shadow-sm transition-shadow">
                  <div className="flex items-start gap-3">
                    {/* Guest avatar */}
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <span className="text-sm font-bold text-white">{getGuestInitial(booking)}</span>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-semibold text-neutral-900 truncate">{getGuestDisplayName(booking)}</p>
                        <div className="text-right shrink-0">
                          <p className="text-sm font-bold text-neutral-900">
                            &euro;{Math.round(Number(booking.total_price) * (1 - HOST_COMMISSION_RATE)).toLocaleString("it-IT")}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-neutral-500 mt-0.5">{booking.property_title}</p>

                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${sc.bg} ${sc.text}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                          {sc.label}
                        </span>
                        {/* Date range */}
                        <span className="text-xs text-neutral-400">
                          {formatDate(booking.check_in)} &rarr; {formatDate(booking.check_out)}
                        </span>
                        <span className="text-xs text-neutral-400">&middot; {booking.guests} ospite{booking.guests !== 1 ? "i" : ""}</span>
                      </div>

                      {/* Pending actions */}
                      {booking.status === "pending" && (
                        <div className="flex items-center gap-2 mt-3">
                          <button
                            onClick={() => handleBookingAction(booking.id, "confirmed")}
                            disabled={actionLoading === booking.id}
                            className="text-xs font-semibold px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === booking.id ? "..." : "Accetta"}
                          </button>
                          <button
                            onClick={() => handleBookingAction(booking.id, "cancelled")}
                            disabled={actionLoading === booking.id}
                            className="text-xs font-semibold px-4 py-2 rounded-lg border border-neutral-200 text-neutral-600 hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50"
                          >
                            {actionLoading === booking.id ? "..." : "Rifiuta"}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
