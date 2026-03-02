"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { formatCents } from "@/lib/payment-utils";

interface PaymentFormProps {
  bookingId: string;
  paymentType: "full" | "split";
  totalCents: number;
  depositAmount?: number;
  balanceAmount?: number;
  cancellationPolicy: string;
  onSuccess: () => void;
}

export default function PaymentForm({
  bookingId,
  paymentType,
  totalCents,
  depositAmount,
  balanceAmount,
  cancellationPolicy,
  onSuccess,
}: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) return;

    setLoading(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/booking/success?booking_id=${bookingId}`,
      },
    });

    // Only reaches here if redirect fails (e.g. 3DS popup closed)
    if (submitError) {
      setError(
        submitError.message || "Errore durante il pagamento. Riprova."
      );
      setLoading(false);
    } else {
      onSuccess();
    }
  };

  const policyLabels: Record<string, string> = {
    flessibile: "Flessibile",
    moderata: "Moderata",
    rigida: "Rigida",
  };

  const policyDescriptions: Record<string, string> = {
    flessibile:
      "Cancellazione gratuita fino a 24h prima del check-in. Rimborso del 50% nelle ultime 24 ore.",
    moderata:
      "Cancellazione gratuita fino a 5 giorni prima. Rimborso del 50% tra 5 giorni e 24h prima.",
    rigida:
      "Rimborso del 50% solo fino a 7 giorni prima del check-in. Nessun rimborso dopo.",
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Split payment info */}
      {paymentType === "split" && depositAmount && balanceAmount && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 space-y-2">
          <h4 className="font-semibold text-blue-900">
            Pagamento in 2 rate
          </h4>
          <div className="flex justify-between text-sm text-blue-800">
            <span>Acconto (30%) — oggi</span>
            <span className="font-semibold">EUR {formatCents(depositAmount)}</span>
          </div>
          <div className="flex justify-between text-sm text-blue-800">
            <span>Saldo (70%) — 7gg prima del check-in</span>
            <span className="font-semibold">EUR {formatCents(balanceAmount)}</span>
          </div>
          <div className="border-t border-blue-200 pt-2 flex justify-between text-sm font-semibold text-blue-900">
            <span>Totale</span>
            <span>EUR {formatCents(totalCents)}</span>
          </div>
        </div>
      )}

      {/* Full payment info */}
      {paymentType === "full" && (
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Importo totale</span>
            <span className="font-semibold">EUR {formatCents(totalCents)}</span>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            L&apos;importo sarà autorizzato ora e addebitato dopo il check-in.
          </p>
        </div>
      )}

      {/* Cancellation policy */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-1">
          <svg
            className="w-4 h-4 text-amber-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span className="text-sm font-semibold text-amber-900">
            Cancellazione {policyLabels[cancellationPolicy] || cancellationPolicy}
          </span>
        </div>
        <p className="text-xs text-amber-800">
          {policyDescriptions[cancellationPolicy] || ""}
        </p>
      </div>

      {/* Stripe Payment Element */}
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || loading}
        className="w-full bg-[#1a1a2e] text-white py-4 rounded-xl font-semibold text-lg hover:bg-[#16162a] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
                fill="none"
              />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              />
            </svg>
            Elaborazione...
          </span>
        ) : paymentType === "split" ? (
          `Paga acconto EUR ${formatCents(depositAmount || 0)}`
        ) : (
          `Conferma e paga EUR ${formatCents(totalCents)}`
        )}
      </button>

      <p className="text-xs text-center text-gray-500">
        Pagamento sicuro tramite Stripe. I tuoi dati sono protetti.
      </p>
    </form>
  );
}
