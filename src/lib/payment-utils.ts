/**
 * Check-in > 7 giorni → split payment (30% acconto + 70% saldo)
 */
export function shouldSplitPayment(checkInDate: string): boolean {
  const checkIn = new Date(checkInDate);
  const now = new Date();
  const diffMs = checkIn.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);
  return diffDays > 7;
}

export function calculateSplitAmounts(totalCents: number) {
  const depositCents = Math.round(totalCents * 0.3);
  const balanceCents = totalCents - depositCents;
  return { depositCents, balanceCents };
}

type CancellationPolicy = "flessibile" | "moderata" | "rigida";

/**
 * Calcola la percentuale di rimborso in base alla policy e al tempo al check-in.
 *
 * Flessibile: 100% fino a 24h prima, 50% nelle ultime 24h, 0% dopo check-in
 * Moderata:   100% fino a 5gg prima, 50% tra 5gg e 24h, 0% dopo
 * Rigida:     50% fino a 7gg prima, 0% dopo
 */
export function calculateRefundPercent(
  policy: CancellationPolicy,
  checkInDate: string
): number {
  const checkIn = new Date(checkInDate);
  const now = new Date();
  const diffMs = checkIn.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Dopo il check-in: nessun rimborso per tutte le policy
  if (diffDays < 0) return 0;

  switch (policy) {
    case "flessibile":
      if (diffDays >= 1) return 100;
      return 50; // ultime 24h
    case "moderata":
      if (diffDays >= 5) return 100;
      if (diffDays >= 1) return 50;
      return 0;
    case "rigida":
      if (diffDays >= 7) return 50;
      return 0;
  }
}

export function calculateRefundAmount(
  amountCapturedCents: number,
  refundPercent: number
): number {
  return Math.round(amountCapturedCents * (refundPercent / 100));
}

export function getCancellationPolicyDescription(
  policy: CancellationPolicy
): string {
  switch (policy) {
    case "flessibile":
      return "Cancellazione gratuita fino a 24 ore prima del check-in. Rimborso del 50% nelle ultime 24 ore.";
    case "moderata":
      return "Cancellazione gratuita fino a 5 giorni prima del check-in. Rimborso del 50% tra 5 giorni e 24 ore prima.";
    case "rigida":
      return "Rimborso del 50% solo fino a 7 giorni prima del check-in. Nessun rimborso dopo.";
  }
}

export function formatCents(cents: number): string {
  return (cents / 100).toFixed(2).replace(".", ",");
}

export function getPaymentStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: "In attesa",
    pending_payment: "In attesa di pagamento",
    authorized: "Autorizzato",
    confirmed: "Confermato",
    captured: "Catturato",
    cancelled: "Cancellato",
    completed: "Completato",
    expired: "Scaduto",
    refunded: "Rimborsato",
    requires_payment: "Richiede pagamento",
    failed: "Fallito",
  };
  return labels[status] || status;
}

export function getPaymentStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-100 text-yellow-800",
    pending_payment: "bg-yellow-100 text-yellow-800",
    authorized: "bg-blue-100 text-blue-800",
    confirmed: "bg-green-100 text-green-800",
    captured: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
    completed: "bg-emerald-100 text-emerald-800",
    expired: "bg-gray-100 text-gray-800",
    refunded: "bg-purple-100 text-purple-800",
    requires_payment: "bg-orange-100 text-orange-800",
    failed: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}
