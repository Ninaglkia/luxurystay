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

export function HostDashboard() {
  const supabase = createClient();
  const [properties, setProperties] = useState<Property[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [stats, setStats] = useState<BookingStats>({ total: 0, pending: 0, confirmed: 0, earnings: 0 });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Fetch properties
    const { data: propsData } = await supabase
      .from("properties")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const props = propsData || [];
    setProperties(props);

    if (props.length === 0) {
      setLoading(false);
      return;
    }

    const propertyIds = props.map((p) => p.id);

    // Fetch bookings for all host properties
    const { data: bookingsData } = await supabase
      .from("bookings")
      .select("*")
      .in("property_id", propertyIds)
      .order("created_at", { ascending: false });

    const rawBookings = bookingsData || [];

    // Build a map of property titles
    const titleMap: Record<string, string> = {};
    for (const p of props) {
      titleMap[p.id] = p.title;
    }

    // Fetch guest profiles for bookings with guest_id
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

    // Enrich bookings
    const enrichedBookings: Booking[] = rawBookings.map((b) => ({
      ...b,
      property_title: titleMap[b.property_id] || "Immobile rimosso",
      profile_name: b.guest_id ? profileMap[b.guest_id] || null : null,
    }));

    setBookings(enrichedBookings);

    // Compute stats
    const total = rawBookings.length;
    const pending = rawBookings.filter((b) => b.status === "pending").length;
    const confirmed = rawBookings.filter((b) => b.status === "confirmed").length;
    const earnings = rawBookings
      .filter((b) => b.status === "confirmed")
      .reduce((sum, b) => sum + (Number(b.total_price) || 0), 0);

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
      case "pending":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-yellow-50 text-yellow-700">In attesa</span>;
      case "cancelled":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-red-50 text-red-700">Annullata</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500">{status}</span>;
    }
  }

  function getPropertyStatusBadge(status: string) {
    switch (status) {
      case "active":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 shrink-0">Attivo</span>;
      case "paused":
        return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-200 text-neutral-600 shrink-0">In pausa</span>;
      default:
        return <span className="text-xs px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">Bozza</span>;
    }
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
          <p className="text-xs text-neutral-500 mt-1">Guadagni (confermate)</p>
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
        <div className="space-y-3">
          {properties.map((property) => (
            <div key={property.id} className="bg-white rounded-xl border border-neutral-200 overflow-hidden">
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
                      {getPropertyStatusBadge(property.status)}
                    </div>
                    <p className="text-sm text-neutral-500 truncate mt-0.5">{property.address}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm text-neutral-500">
                      {property.guests} ospiti &middot; {property.bedrooms} camere &middot; {property.beds} letti
                    </p>
                    <p className="text-sm font-semibold text-neutral-900">&euro;{property.price}<span className="text-neutral-400 font-normal">/notte</span></p>
                  </div>
                </div>
              </div>
              {/* Action buttons */}
              <div className="border-t border-neutral-100 px-4 py-2.5 flex flex-wrap items-center gap-2">
                <Link
                  href={`/dashboard/add-property?edit=${property.id}`}
                  className="text-xs font-medium text-neutral-600 hover:text-neutral-900 px-3 py-1.5 rounded-lg border border-neutral-200 hover:border-neutral-300 transition-colors cursor-pointer"
                >
                  Modifica
                </Link>
                <button
                  onClick={() => handleToggleStatus(property)}
                  disabled={actionLoading === property.id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-neutral-200 hover:border-neutral-300 text-neutral-600 hover:text-neutral-900"
                >
                  {actionLoading === property.id ? "..." : property.status === "active" ? "Pausa" : "Attiva"}
                </button>
                <button
                  onClick={() => handleDelete(property)}
                  disabled={actionLoading === property.id}
                  className="text-xs font-medium px-3 py-1.5 rounded-lg border border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {actionLoading === property.id ? "..." : "Elimina"}
                </button>
              </div>
            </div>
          ))}
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
                    <p className="text-sm font-semibold text-neutral-900">
                      &euro;{Number(booking.total_price).toLocaleString("it-IT", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                    </p>
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
