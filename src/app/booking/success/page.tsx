"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { formatCents, getCancellationPolicyDescription } from "@/lib/payment-utils";

interface BookingDetails {
  booking: {
    id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    status: string;
    payment_type: string;
    deposit_amount: number;
    balance_amount: number;
    cancellation_policy: string;
  };
  property: {
    title: string;
    address: string;
    photos: string[];
  } | null;
  payments: Array<{
    type: string;
    amount_cents: number;
    status: string;
  }>;
}

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const bookingId = searchParams.get("booking_id");
  const sessionId = searchParams.get("session_id"); // legacy support
  const [details, setDetails] = useState<BookingDetails | null>(null);
  const [loading, setLoading] = useState(!!bookingId);

  useEffect(() => {
    if (!bookingId) return;

    async function fetchBooking() {
      try {
        const res = await fetch(`/api/booking/${bookingId}`);
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
        }
      } catch {
        // Silently fail — show basic success
      } finally {
        setLoading(false);
      }
    }
    fetchBooking();
  }, [bookingId]);

  function formatDate(dateStr: string): string {
    if (!dateStr) return "—";
    const d = new Date(dateStr + "T00:00:00");
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
      </div>
    );
  }

  const booking = details?.booking;
  const property = details?.property;
  const isSplit = booking?.payment_type === "split";

  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Success icon */}
        <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-10 h-10 text-emerald-500"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-bold text-neutral-900 mb-3">
          Pagamento completato!
        </h1>
        <p className="text-neutral-500 mb-2">
          La tua prenotazione è stata confermata. Riceverai un&apos;email di
          conferma a breve.
        </p>

        {/* Booking details */}
        {booking && property && (
          <div className="mt-6 mb-6 text-left bg-neutral-50 rounded-xl p-5 space-y-4">
            <div className="flex gap-3">
              {property.photos?.[0] && (
                <img
                  src={property.photos[0]}
                  alt=""
                  className="w-16 h-16 rounded-lg object-cover shrink-0"
                />
              )}
              <div>
                <p className="font-semibold text-neutral-900">
                  {property.title}
                </p>
                <p className="text-sm text-neutral-500">{property.address}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-neutral-500">Check-in</p>
                <p className="font-medium text-neutral-900">
                  {formatDate(booking.check_in)}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Check-out</p>
                <p className="font-medium text-neutral-900">
                  {formatDate(booking.check_out)}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Ospiti</p>
                <p className="font-medium text-neutral-900">
                  {booking.guests}
                </p>
              </div>
              <div>
                <p className="text-neutral-500">Totale</p>
                <p className="font-medium text-neutral-900">
                  &euro;{booking.total_price}
                </p>
              </div>
            </div>

            {/* Split payment info */}
            {isSplit && booking.deposit_amount > 0 && (
              <div className="border-t border-neutral-200 pt-3 space-y-2">
                <p className="text-sm font-semibold text-neutral-900">
                  Pagamento in 2 rate
                </p>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    Acconto pagato oggi
                  </span>
                  <span className="font-medium text-green-700">
                    EUR {formatCents(booking.deposit_amount)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-neutral-600">
                    Saldo (7gg prima del check-in)
                  </span>
                  <span className="font-medium text-neutral-900">
                    EUR {formatCents(booking.balance_amount)}
                  </span>
                </div>
              </div>
            )}

            {/* Cancellation policy */}
            {booking.cancellation_policy && (
              <div className="border-t border-neutral-200 pt-3">
                <p className="text-xs text-neutral-500">
                  <strong className="text-neutral-700">Cancellazione:</strong>{" "}
                  {getCancellationPolicyDescription(
                    booking.cancellation_policy as "flessibile" | "moderata" | "rigida"
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Legacy session_id support */}
        {!booking && sessionId && (
          <p className="text-xs text-neutral-400 mb-8">
            Riferimento: {sessionId.slice(0, 20)}...
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push("/")}
            className="px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold hover:bg-neutral-800 transition-colors cursor-pointer"
          >
            Torna alla mappa
          </button>
          <button
            onClick={() =>
              router.push(
                bookingId
                  ? `/dashboard/bookings/${bookingId}`
                  : "/dashboard/bookings"
              )
            }
            className="px-6 py-3 bg-white border border-neutral-300 text-neutral-900 rounded-xl text-sm font-semibold hover:bg-neutral-50 transition-colors cursor-pointer"
          >
            Le mie prenotazioni
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BookingSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-neutral-300 border-t-neutral-900 rounded-full animate-spin" />
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
