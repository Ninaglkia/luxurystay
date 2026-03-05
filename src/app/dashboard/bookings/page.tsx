"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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

export default function GuestBookingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [bookings, setBookings] = useState<(Booking & { property?: Property })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      const { data: bookingsData } = await supabase
        .from("bookings")
        .select("*")
        .eq("guest_id", user.id)
        .order("created_at", { ascending: false });

      if (bookingsData && bookingsData.length > 0) {
        // Fetch properties
        const propertyIds = [...new Set(bookingsData.map((b) => b.property_id))];
        const { data: properties } = await supabase
          .from("properties")
          .select("id, title, address, photos, price")
          .in("id", propertyIds);

        const propertyMap = new Map(properties?.map((p) => [p.id, p]) || []);

        setBookings(
          bookingsData.map((b) => ({
            ...b,
            property: propertyMap.get(b.property_id),
          }))
        );
      }

      setLoading(false);
    }
    load();
  }, [supabase, router]);

  function formatDateRange(checkIn: string, checkOut: string): string {
    const dIn = new Date(checkIn + "T00:00:00");
    const dOut = new Date(checkOut + "T00:00:00");
    return `${dIn.toLocaleDateString("it-IT", { day: "numeric", month: "short" })} – ${dOut.toLocaleDateString("it-IT", { day: "numeric", month: "short", year: "numeric" })}`;
  }

  function calculateNights(checkIn: string, checkOut: string): number {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-64 bg-neutral-100 rounded animate-pulse" />
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-32 bg-neutral-100 rounded-xl animate-pulse"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-neutral-900">
          Le mie prenotazioni
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          {bookings.length > 0
            ? `${bookings.length} prenotazion${bookings.length === 1 ? "e" : "i"} totali`
            : "Gestisci i tuoi soggiorni"}
        </p>
      </div>

      {bookings.length === 0 ? (
        <div className="bg-white border border-neutral-200 rounded-2xl p-10 sm:p-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-100 flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-violet-400"
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
          </div>
          <h2 className="text-xl font-semibold text-neutral-900 mb-2">
            Nessuna prenotazione
          </h2>
          <p className="text-neutral-500 text-sm mb-8 max-w-sm mx-auto leading-relaxed">
            Non hai ancora effettuato prenotazioni. Esplora le destinazioni disponibili e prenota il tuo prossimo soggiorno.
          </p>
          <button
            onClick={() => router.push("/dashboard")}
            className="inline-flex items-center gap-2 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z" />
            </svg>
            Esplora alloggi
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {bookings.map((booking) => (
            <button
              key={booking.id}
              onClick={() =>
                router.push(`/dashboard/bookings/${booking.id}`)
              }
              className="w-full text-left bg-white border border-neutral-200 rounded-xl p-4 hover:border-neutral-300 hover:shadow-sm transition-all cursor-pointer"
            >
              <div className="flex gap-4">
                {/* Photo */}
                <div className="w-24 h-20 rounded-lg overflow-hidden bg-neutral-100 shrink-0">
                  {booking.property?.photos?.[0] ? (
                    <img
                      src={booking.property.photos[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        className="w-6 h-6 text-neutral-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        strokeWidth={1}
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="m2.25 15.75 5.159-5.159a2.25 2.25 0 0 1 3.182 0l5.159 5.159m-1.5-1.5 1.409-1.409a2.25 2.25 0 0 1 3.182 0l2.909 2.909"
                        />
                      </svg>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-neutral-900 truncate">
                      {booking.property?.title || "Proprietà"}
                    </p>
                    <div className="flex gap-1.5 shrink-0">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${getPaymentStatusColor(booking.status)}`}
                      >
                        {getPaymentStatusLabel(booking.status)}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-neutral-500 mt-0.5">
                    {formatDateRange(booking.check_in, booking.check_out)} ·{" "}
                    {calculateNights(booking.check_in, booking.check_out)} notti
                  </p>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-sm font-semibold text-neutral-900">
                      &euro;{booking.total_price}
                    </p>
                    {booking.payment_type === "split" && (
                      <span className="text-xs text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                        2 rate
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
