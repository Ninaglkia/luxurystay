"use client";

import { useState } from "react";
import {
  calculateRefundPercent,
  formatCents,
  getCancellationPolicyDescription,
} from "@/lib/payment-utils";

interface CancelBookingModalProps {
  bookingId: string;
  checkIn: string;
  cancellationPolicy: "flessibile" | "moderata" | "rigida";
  totalPaidCents: number;
  onClose: () => void;
  onCancelled: () => void;
}

export default function CancelBookingModal({
  bookingId,
  checkIn,
  cancellationPolicy,
  totalPaidCents,
  onClose,
  onCancelled,
}: CancelBookingModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refundPercent = calculateRefundPercent(cancellationPolicy, checkIn);
  const refundAmount = Math.round(totalPaidCents * (refundPercent / 100));

  const handleCancel = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/cancel-booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ booking_id: bookingId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Errore durante la cancellazione.");
        return;
      }

      onCancelled();
    } catch {
      setError("Errore di rete. Riprova.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold">Cancella prenotazione</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Policy info */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900 mb-1">
            Politica: {cancellationPolicy.charAt(0).toUpperCase() + cancellationPolicy.slice(1)}
          </p>
          <p className="text-xs text-amber-800">
            {getCancellationPolicyDescription(cancellationPolicy)}
          </p>
        </div>

        {/* Refund calculation */}
        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Importo pagato</span>
            <span>EUR {formatCents(totalPaidCents)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Rimborso ({refundPercent}%)</span>
            <span className="font-semibold text-green-700">
              EUR {formatCents(refundAmount)}
            </span>
          </div>
          {refundPercent < 100 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Penale</span>
              <span className="text-red-600">
                EUR {formatCents(totalPaidCents - refundAmount)}
              </span>
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 py-3 border border-gray-300 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            Annulla
          </button>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Cancellazione..." : "Conferma cancellazione"}
          </button>
        </div>
      </div>
    </div>
  );
}
