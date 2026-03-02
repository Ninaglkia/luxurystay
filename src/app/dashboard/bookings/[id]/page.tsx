"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import CancelBookingModal from "@/app/components/cancel-booking-modal";
import {
  formatCents,
  getPaymentStatusLabel,
  getPaymentStatusColor,
  getCancellationPolicyDescription,
} from "@/lib/payment-utils";

interface BookingData {
  booking: {
    id: string;
    property_id: string;
    check_in: string;
    check_out: string;
    guests: number;
    total_price: number;
    status: string;
    payment_status: string;
    payment_type: string;
    deposit_amount: number;
    balance_amount: number;
    cancellation_policy: string;
    cancelled_at: string | null;
    cancelled_by: string | null;
    created_at: string;
    guest_id: string | null;
    host_id: string;
  };
  property: {
    title: string;
    address: string;
    photos: string[];
    price: number;
    cancellation_policy: string;
  } | null;
  payments: Array<{
    id: string;
    type: string;
    amount_cents: number;
    amount_captured_cents: number;
    amount_refunded_cents: number;
    status: string;
    created_at: string;
    captured_at: string | null;
  }>;
  refunds: Array<{
    id: string;
    amount_cents: number;
    reason: string;
    status: string;
    initiated_by: string;
    created_at: string;
  }>;
  hostProfile: { full_name: string; avatar_url: string | null } | null;
}

export default function BookingDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const [data, setData] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCancelModal, setShowCancelModal] = useState(false);

  async function fetchData() {
    try {
      const res = await fetch(`/api/booking/${id}`);
      if (res.ok) {
        setData(await res.json());
      }
    } catch {
      // fail silently
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function formatDate(dateStr: string): string {
    const d = new Date(dateStr + (dateStr.includes("T") ? "" : "T00:00:00"));
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  }

  function formatDateTime(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString("it-IT", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 bg-neutral-100 rounded animate-pulse" />
        <div className="h-64 bg-neutral-100 rounded-xl animate-pulse" />
        <div className="h-48 bg-neutral-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20">
        <p className="text-neutral-500">Prenotazione non trovata.</p>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="mt-4 px-6 py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold cursor-pointer"
        >
          Torna alle prenotazioni
        </button>
      </div>
    );
  }

  const { booking, property, payments, refunds, hostProfile } = data;
  const canCancel = !["cancelled", "refunded", "expired", "completed"].includes(
    booking.status
  );

  const totalCaptured = payments.reduce(
    (sum, p) => sum + (p.amount_captured_cents || 0),
    0
  );

  return (
    <div className="max-w-3xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="w-9 h-9 rounded-full flex items-center justify-center hover:bg-neutral-100 transition-colors cursor-pointer"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M15.75 19.5 8.25 12l7.5-7.5"
            />
          </svg>
        </button>
        <h1 className="text-2xl font-bold text-neutral-900">
          Dettaglio prenotazione
        </h1>
      </div>

      {/* Status banner */}
      <div
        className={`rounded-xl p-4 mb-6 ${getPaymentStatusColor(booking.status)}`}
      >
        <p className="font-semibold">
          Stato: {getPaymentStatusLabel(booking.status)}
        </p>
        {booking.cancelled_at && (
          <p className="text-sm mt-1">
            Cancellata il {formatDateTime(booking.cancelled_at)} da{" "}
            {booking.cancelled_by === "guest" ? "te" : "l'host"}
          </p>
        )}
      </div>

      {/* Property card */}
      {property && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
          <div className="flex gap-4">
            {property.photos?.[0] && (
              <img
                src={property.photos[0]}
                alt=""
                className="w-24 h-20 rounded-lg object-cover shrink-0"
              />
            )}
            <div>
              <p className="font-semibold text-neutral-900">{property.title}</p>
              <p className="text-sm text-neutral-500">{property.address}</p>
              {hostProfile && (
                <p className="text-sm text-neutral-500 mt-1">
                  Host: {hostProfile.full_name}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4 pt-4 border-t border-neutral-200">
            <div>
              <p className="text-xs text-neutral-500">Check-in</p>
              <p className="text-sm font-medium">
                {formatDate(booking.check_in)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Check-out</p>
              <p className="text-sm font-medium">
                {formatDate(booking.check_out)}
              </p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Ospiti</p>
              <p className="text-sm font-medium">{booking.guests}</p>
            </div>
            <div>
              <p className="text-xs text-neutral-500">Totale</p>
              <p className="text-sm font-medium">
                &euro;{booking.total_price}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Payment timeline */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-4">
          Pagamenti
        </h2>

        {payments.length === 0 ? (
          <p className="text-sm text-neutral-500">
            Nessun pagamento registrato.
          </p>
        ) : (
          <div className="space-y-4">
            {payments.map((payment) => (
              <div
                key={payment.id}
                className="flex items-center justify-between border-b border-neutral-100 pb-3 last:border-0"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    {payment.type === "deposit"
                      ? "Acconto (30%)"
                      : payment.type === "balance"
                        ? "Saldo (70%)"
                        : "Pagamento completo"}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDateTime(payment.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold">
                    EUR {formatCents(payment.amount_cents)}
                  </p>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${getPaymentStatusColor(payment.status)}`}
                  >
                    {getPaymentStatusLabel(payment.status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Balance pending info for split */}
        {booking.payment_type === "split" &&
          booking.balance_amount > 0 &&
          !payments.find((p) => p.type === "balance") && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                <strong>Saldo in attesa:</strong> EUR{" "}
                {formatCents(booking.balance_amount)} — verrà addebitato
                automaticamente 7 giorni prima del check-in.
              </p>
            </div>
          )}
      </div>

      {/* Refunds */}
      {refunds.length > 0 && (
        <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">
            Rimborsi
          </h2>
          <div className="space-y-3">
            {refunds.map((refund) => (
              <div
                key={refund.id}
                className="flex items-center justify-between"
              >
                <div>
                  <p className="text-sm font-medium text-neutral-900">
                    Rimborso{" "}
                    {refund.reason === "guest_cancellation"
                      ? "per cancellazione"
                      : refund.reason === "host_cancellation"
                        ? "da host"
                        : ""}
                  </p>
                  <p className="text-xs text-neutral-500">
                    {formatDateTime(refund.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-green-700">
                    + EUR {formatCents(refund.amount_cents)}
                  </p>
                  <span className="text-xs text-green-700">
                    {refund.status === "succeeded"
                      ? "Completato"
                      : "In elaborazione"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cancellation policy */}
      <div className="bg-white border border-neutral-200 rounded-xl p-5 mb-6">
        <h2 className="text-lg font-semibold text-neutral-900 mb-2">
          Politica di cancellazione
        </h2>
        <p className="text-sm text-neutral-600">
          <strong className="text-neutral-800">
            {booking.cancellation_policy.charAt(0).toUpperCase() +
              booking.cancellation_policy.slice(1)}
          </strong>{" "}
          —{" "}
          {getCancellationPolicyDescription(
            booking.cancellation_policy as
              | "flessibile"
              | "moderata"
              | "rigida"
          )}
        </p>
      </div>

      {/* Cancel button */}
      {canCancel && (
        <button
          onClick={() => setShowCancelModal(true)}
          className="w-full py-3 border border-red-300 text-red-700 rounded-xl font-medium hover:bg-red-50 transition-colors cursor-pointer"
        >
          Cancella prenotazione
        </button>
      )}

      {/* Cancel modal */}
      {showCancelModal && (
        <CancelBookingModal
          bookingId={booking.id}
          checkIn={booking.check_in}
          cancellationPolicy={
            booking.cancellation_policy as
              | "flessibile"
              | "moderata"
              | "rigida"
          }
          totalPaidCents={totalCaptured}
          onClose={() => setShowCancelModal(false)}
          onCancelled={() => {
            setShowCancelModal(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}
