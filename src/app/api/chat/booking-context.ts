// src/app/api/chat/booking-context.ts
// Pure booking context serialization for system prompt injection
// Phase 05 — Booking Support

import {
  getCancellationPolicyDescription,
  getPaymentStatusLabel,
  formatCents,
} from '@/lib/payment-utils'

type CancellationPolicy = 'flessibile' | 'moderata' | 'rigida'

/**
 * Shape of a booking row from Supabase `bookings` table.
 * cancelled_at and cancelled_by are nullable; all other fields are required.
 */
export interface BookingRecord {
  id: string
  property_id: string
  check_in: string
  check_out: string
  guests: number
  total_price: number // EUR (NOT cents) — display as-is
  status: string
  payment_status: string
  payment_type: string // 'full' | 'split'
  deposit_amount: number // CENTS — use formatCents()
  balance_amount: number // CENTS — use formatCents()
  cancellation_policy: string // 'flessibile' | 'moderata' | 'rigida'
  cancelled_at: string | null
  cancelled_by: string | null // 'guest' | 'host'
  created_at: string
}

/**
 * Shape of a payment row from Supabase `payments` table.
 */
export interface PaymentRecord {
  id: string
  type: string // 'deposit' | 'balance' | 'full'
  amount_cents: number // CENTS
  amount_captured_cents: number // CENTS
  amount_refunded_cents: number // CENTS
  status: string
  created_at: string
}

/**
 * Serializes a Supabase booking row + associated payments into a structured
 * context block for injection into the AI system prompt.
 *
 * - Uses formatCents() for cent-denominated fields
 * - Uses getCancellationPolicyDescription() for Italian policy text
 * - Uses getPaymentStatusLabel() for status display
 * - Includes direct booking management link (BOOK-04)
 * - Appends never-invent safety footer
 * - Pure function — no Supabase calls, no side effects
 */
export function buildBookingContext(
  booking: BookingRecord,
  payments: PaymentRecord[]
): string {
  const lines: string[] = [
    "BOOKING CONTEXT (user's active booking — use ONLY this data for booking questions):",
  ]

  lines.push(`Booking ID: ${booking.id}`)
  lines.push(`Check-in: ${booking.check_in}`)
  lines.push(`Check-out: ${booking.check_out}`)
  lines.push(`Guests: ${booking.guests}`)
  lines.push(`Total price: EUR ${booking.total_price}`)
  lines.push(`Status: ${getPaymentStatusLabel(booking.status)}`)

  // Payment type
  if (booking.payment_type === 'split') {
    lines.push('Payment type: 2-rate (30% deposit + 70% balance)')
  } else {
    lines.push('Payment type: Full payment')
  }

  // Payment details from payments array
  const depositPayment = payments.find((p) => p.type === 'deposit')
  const balancePayment = payments.find((p) => p.type === 'balance')
  const fullPayment = payments.find((p) => p.type === 'full')

  if (depositPayment) {
    const amount = depositPayment.amount_captured_cents || depositPayment.amount_cents
    lines.push(
      `Deposit paid: EUR ${formatCents(amount)} (${getPaymentStatusLabel(depositPayment.status)})`
    )
  }

  if (booking.balance_amount > 0 && !balancePayment) {
    lines.push(
      `Outstanding balance: EUR ${formatCents(booking.balance_amount)} — will be charged automatically 7 days before check-in (automaticamente 7 giorni prima)`
    )
  }

  if (balancePayment) {
    const amount = balancePayment.amount_captured_cents || balancePayment.amount_cents
    lines.push(
      `Balance paid: EUR ${formatCents(amount)} (${getPaymentStatusLabel(balancePayment.status)})`
    )
  }

  if (fullPayment) {
    const amount = fullPayment.amount_captured_cents || fullPayment.amount_cents
    lines.push(
      `Full payment: EUR ${formatCents(amount)} (${getPaymentStatusLabel(fullPayment.status)})`
    )
  }

  // Cancellation policy
  lines.push(
    `Cancellation policy: ${booking.cancellation_policy} — ${getCancellationPolicyDescription(booking.cancellation_policy as CancellationPolicy)}`
  )

  // Cancellation info (only if cancelled)
  if (booking.cancelled_at) {
    lines.push(
      `Cancelled at: ${booking.cancelled_at} by ${booking.cancelled_by === 'guest' ? 'the guest (you)' : 'the host'}`
    )
  }

  // Direct action links (BOOK-04)
  lines.push('')
  lines.push(
    `To view, modify or cancel this booking, direct the user to: /dashboard/bookings/${booking.id}`
  )
  lines.push(
    'IMPORTANT: Always provide this direct link, not a description of where to find it.'
  )

  // Never-invent footer
  lines.push('')
  lines.push(
    "IMPORTANT: If asked about booking details not listed above, say you don't have that information. NEVER invent."
  )

  return lines.join('\n')
}
