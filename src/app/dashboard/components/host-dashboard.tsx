"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export function HostDashboard() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ total: 0, pending: 0, confirmed: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
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

  // --- Property actions ---

  async function handleToggleStatus(property: Property) {
    setActionLoading(property.id);
    const newStatus = property.status === "active" ? "paused" : "active";
    await supabase
      .from("properties")
      .update({ status: newStatus })
      .eq("id", property.id);
    await loadData();
    setActionLoading(null);
  }

  async function handleDelete(property: Property) {
    const ok = window.confirm(
      `Sei sicuro di voler eliminare "${property.title}"? Questa azione non può essere annullata.`
    );
    if (!ok) return;
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
    await supabase
      .from("properties")
      .update({ price: newPrice })
      .eq("id", propertyId);
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
    await supabase
      .from("properties")
      .update({ amenities: updated })
      .eq("id", property.id);
    await loadData();
    setSavingAmenity(false);
  }

  // --- Booking actions ---

  async function handleBookingAction(bookingId: string, newStatus: "confirmed" | "cancelled") {
    setActionLoading(bookingId);
    await supabase
      .from("bookings")
      .update({ status: newStatus })
      .eq("id", bookingId);
    await loadData();
    setActionLoading(null);
  }

  // --- Helpers ---

  function formatDate(dateStr: string): string {
    if (!dateStr) return "\u2014";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" });
  }

  function getStatusBadge(status: string) {
    switch (status) {
      case "confirmed":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Confermata</span>;
      case "authorized":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700">Autorizzata</span>;
      case "captured":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Catturata</span>;
      case "pending":
      case "pending_payment":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">In attesa</span>;
      case "cancelled":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">Annullata</span>;
      case "completed":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700">Completata</span>;
      case "expired":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">Scaduta</span>;
      case "refunded":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700">Rimborsata</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{status}</span>;
    }
  }

  function getPaymentBadge(paymentStatus: string, paymentType: string) {
    if (!paymentStatus) return null;
    const label = paymentStatus === "paid"
      ? "Pagato"
      : paymentStatus === "partial"
        ? "Acconto"
        : paymentStatus === "unpaid"
          ? "Non pagato"
          : paymentStatus;
    const color = paymentStatus === "paid"
      ? "bg-green-50 text-green-700"
      : paymentStatus === "partial"
        ? "bg-blue-50 text-blue-700"
        : "bg-orange-50 text-orange-700";
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${color}`}>
        {label}{paymentType === "split" ? " (2 rate)" : ""}
      </span>
    );
  }

  function getGuestDisplayName(booking: Booking): string {
    if (booking.profile_name) return booking.profile_name;
    if (booking.guest_name) return booking.guest_name;
    return "Ospite";
  }

  // --- Loading state ---

  if (loading) {
    return (
      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 bg-neutral-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  // --- Empty state ---

  if (properties.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-center py-20">
        <div className="w-20 h-20 rounded-full bg-neutral-100 flex items-center justify-center mb-6">
          <svg className="w-10 h-10 text-neutral-400" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 12 8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">Nessun immobile pubblicato</h3>
        <p className="text-neutral-500 text-sm mb-6 max-w-sm">
          Inizia ad aggiungere il tuo primo immobile per ricevere prenotazioni.
        </p>
        <Link
          href="/dashboard/add-property"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 transition-colors cursor-pointer"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Aggiungi immobile
        </Link>
      </div>
    );
  }

  // --- Main dashboard ---

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-neutral-900">{properties.length}</p>
          <p className="text-xs text-neutral-500 mt-1">Immobili totali</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-neutral-900">{stats.total}</p>
          <p className="text-xs text-neutral-500 mt-1">Prenotazioni totali</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          <p className="text-xs text-neutral-500 mt-1">In attesa</p>
        </div>
        <div className="bg-white rounded-xl border border-neutral-200 p-4">
          <p className="text-2xl font-bold text-emerald-600">
            &euro; {stats.earnings.toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
          </p>
          <p className="text-xs text-neutral-500 mt-1">Guadagni netti (&minus;5% commissione)</p>
        </div>
      </div>

      {/* Property list */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-neutral-900">I tuoi immobili</h2>
          <Link
            href="/dashboard/add-property"
            className="text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors cursor-pointer"
          >
            + Aggiungi
          </Link>
        </div>
        <div className="space-y-4">
          {properties.map((property) => {
            const isExpanded = expandedId === property.id;
            const propAmenities = property.amenities || [];
            const netPerNight = Math.round(property.price * (1 - HOST_COMMISSION_RATE));

            return (
              <div key={property.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
                {/* Card header */}
                <div className="flex">
                  {/* Photo */}
                  <div className="w-28 h-28 lg:w-40 lg:h-32 shrink-0 bg-neutral-100">
                    {property.photos[0] ? (
                      <img src={property.photos[0]} alt={property.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-8 h-8 text-neutral-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909M18 12.75h.008v.008H18v-.008Zm-9-6h.008v.008H9V6.75Z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  {/* Info */}
                  <div className="flex-1 p-4 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-neutral-900 truncate">{property.title}</h3>
                        {/* Status toggle switch */}
                        <button
                          onClick={() => handleToggleStatus(property)}
                          disabled={actionLoading === property.id}
                          className="shrink-0 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                          title={property.status === "active" ? "Disattiva annuncio" : "Attiva annuncio"}
                        >
                          <span className={`text-xs font-medium ${property.status === "active" ? "text-emerald-700" : "text-neutral-400"}`}>
                            {actionLoading === property.id ? "..." : property.status === "active" ? "Attivo" : "In pausa"}
                          </span>
                          <div className={`relative w-10 h-[22px] rounded-full transition-colors ${property.status === "active" ? "bg-emerald-500" : "bg-neutral-300"}`}>
                            <div className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow transition-transform ${property.status === "active" ? "left-[22px]" : "left-[3px]"}`} />
                          </div>
                        </button>
                      </div>
                      <p className="text-sm text-neutral-500 truncate mt-0.5">{property.address}</p>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-sm text-neutral-500">
                        {property.guests} ospiti &middot; {property.bedrooms} camere &middot; {property.beds} letti
                      </p>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-neutral-900">&euro;{property.price}<span className="text-neutral-400 font-normal">/notte</span></p>
                        <p className="text-xs text-emerald-600 font-medium">&euro;{netPerNight} netto</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action bar */}
                <div className="border-t border-neutral-100 px-4 py-2.5 flex flex-wrap items-center gap-2">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : property.id)}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer flex items-center gap-1"
                  >
                    <svg className={`w-3.5 h-3.5 transition-transform ${isExpanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
                    </svg>
                    Gestisci
                  </button>
                  <Link
                    href={`/dashboard/add-property?edit=${property.id}`}
                    className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
                  >
                    Modifica completa
                  </Link>
                  <button
                    onClick={() => handleDelete(property)}
                    disabled={actionLoading === property.id}
                    className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {actionLoading === property.id ? "..." : "Elimina"}
                  </button>
                </div>

                {/* Expanded management panel */}
                {isExpanded && (
                  <div className="border-t border-neutral-200 bg-neutral-50">
                    {/* ── PREZZO & GUADAGNI ── */}
                    <div className="p-5 border-b border-neutral-200">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-4 flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                        </svg>
                        Prezzo e guadagni
                      </h4>

                      {/* Price editor */}
                      <div className="flex items-center gap-3 mb-5">
                        <label className="text-sm text-neutral-600">Prezzo per notte:</label>
                        <div className="flex items-center gap-2">
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 text-sm">&euro;</span>
                            <input
                              type="number"
                              min="1"
                              value={editingPrice?.id === property.id ? editingPrice.value : property.price}
                              onChange={(e) => setEditingPrice({ id: property.id, value: e.target.value })}
                              className="w-28 pl-7 pr-3 py-2 border border-neutral-300 rounded-lg text-sm text-neutral-900 focus:outline-none focus:ring-2 focus:ring-neutral-900 focus:border-transparent"
                            />
                          </div>
                          {editingPrice?.id === property.id && editingPrice.value !== String(property.price) && (
                            <button
                              onClick={() => handleSavePrice(property.id)}
                              disabled={actionLoading === property.id}
                              className="px-3 py-2 bg-neutral-900 text-white rounded-lg text-xs font-medium hover:bg-neutral-800 transition-colors cursor-pointer disabled:opacity-50"
                            >
                              Salva
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Earnings table */}
                      <div className="bg-white rounded-lg border border-neutral-200 overflow-hidden">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-neutral-100">
                              <th className="text-left py-2.5 px-4 text-neutral-500 font-medium">Durata</th>
                              <th className="text-right py-2.5 px-4 text-neutral-500 font-medium">Prezzo ospite</th>
                              <th className="text-right py-2.5 px-4 text-emerald-600 font-medium">Il tuo guadagno (95%)</th>
                            </tr>
                          </thead>
                          <tbody>
                            {[1, 3, 7, 14, 30].map((nights) => {
                              const gross = property.price * nights;
                              const net = Math.round(gross * (1 - HOST_COMMISSION_RATE));
                              return (
                                <tr key={nights} className="border-b border-neutral-50 last:border-0">
                                  <td className="py-2.5 px-4 text-neutral-600">
                                    {nights} {nights === 1 ? "notte" : "notti"}
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-neutral-900">
                                    &euro;{gross.toLocaleString("it-IT")}
                                  </td>
                                  <td className="py-2.5 px-4 text-right text-emerald-600 font-semibold">
                                    &euro;{net.toLocaleString("it-IT")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                      <p className="text-xs text-neutral-400 mt-2">
                        LuxuryStay trattiene il 5% come commissione piattaforma. L&apos;ospite paga un ulteriore 15% di service fee.
                      </p>
                    </div>

                    {/* ── SERVIZI & COMFORT ── */}
                    <div className="p-5">
                      <h4 className="text-sm font-semibold text-neutral-900 mb-1 flex items-center gap-2">
                        <svg className="w-4 h-4 text-neutral-500" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9.568 3H5.25A2.25 2.25 0 0 0 3 5.25v4.318c0 .597.237 1.17.659 1.591l9.581 9.581c.699.699 1.78.872 2.607.33a18.095 18.095 0 0 0 5.223-5.223c.542-.827.369-1.908-.33-2.607L11.16 3.66A2.25 2.25 0 0 0 9.568 3Z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M6 6h.008v.008H6V6Z" />
                        </svg>
                        Servizi e comfort
                      </h4>
                      <p className="text-xs text-neutral-400 mb-4">
                        Clicca per attivare/disattivare. Questi filtri compaiono nella ricerca degli ospiti.
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                        {ALL_AMENITIES.map((amenity) => {
                          const isActive = propAmenities.includes(amenity.id);
                          return (
                            <button
                              key={amenity.id}
                              onClick={() => handleToggleAmenity(property, amenity.id)}
                              disabled={savingAmenity}
                              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg border text-sm transition-all cursor-pointer disabled:opacity-60 ${
                                isActive
                                  ? "border-neutral-900 bg-neutral-900 text-white"
                                  : "border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300"
                              }`}
                            >
                              <svg className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-neutral-400"}`} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" d={amenity.icon} />
                              </svg>
                              <span className="truncate">{amenity.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent bookings */}
      <div>
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">Prenotazioni recenti</h2>
        {bookings.length === 0 ? (
          <div className="bg-white rounded-xl border border-neutral-200 p-8 text-center">
            <p className="text-sm text-neutral-500">Nessuna prenotazione ricevuta.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-xl border border-neutral-200 p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  {/* Left: booking details */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <p className="text-sm font-semibold text-neutral-900 truncate">
                        {booking.property_title}
                      </p>
                      {getStatusBadge(booking.status)}
                      {getPaymentBadge(booking.payment_status, booking.payment_type)}
                    </div>
                    <p className="text-sm text-neutral-600">
                      <span className="font-medium text-neutral-700">{getGuestDisplayName(booking)}</span>
                      {booking.guest_email && (
                        <span className="text-neutral-400"> &middot; {booking.guest_email}</span>
                      )}
                    </p>
                    <p className="text-xs text-neutral-500 mt-1">
                      {formatDate(booking.check_in)} &rarr; {formatDate(booking.check_out)}
                      <span className="mx-1">&middot;</span>
                      {booking.guests} ospite{booking.guests !== 1 ? "i" : ""}
                    </p>
                  </div>

                  {/* Right: price + actions */}
                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <p className="text-sm font-semibold text-neutral-900">
                        &euro;{Math.round(Number(booking.total_price) * (1 - HOST_COMMISSION_RATE)).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                      </p>
                      <p className="text-xs text-neutral-400">
                        netto (&minus;5%)
                      </p>
                    </div>
                    {booking.status === "pending" && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleBookingAction(booking.id, "confirmed")}
                          disabled={actionLoading === booking.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === booking.id ? "..." : "Conferma"}
                        </button>
                        <button
                          onClick={() => handleBookingAction(booking.id, "cancelled")}
                          disabled={actionLoading === booking.id}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {actionLoading === booking.id ? "..." : "Rifiuta"}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
