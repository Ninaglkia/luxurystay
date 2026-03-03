/**
 * Tests for buildBookingContext() — pure booking context serialization
 *
 * TDD RED phase: Tests written before implementation.
 * Verifies serialization of Supabase booking rows + payments into structured system prompt blocks.
 */

import { describe, it, expect } from 'vitest'
import { buildBookingContext, BookingRecord, PaymentRecord } from './booking-context'

function makeFullBooking(overrides?: Partial<BookingRecord>): BookingRecord {
  return {
    id: '550e8400-e29b-41d4-a716-446655440001',
    property_id: '550e8400-e29b-41d4-a716-446655440099',
    check_in: '2026-04-10',
    check_out: '2026-04-17',
    guests: 4,
    total_price: 700,
    status: 'confirmed',
    payment_status: 'captured',
    payment_type: 'split',
    deposit_amount: 21000, // cents
    balance_amount: 49000, // cents
    cancellation_policy: 'flessibile',
    cancelled_at: null,
    cancelled_by: null,
    created_at: '2026-03-01T10:00:00Z',
    ...overrides,
  }
}

function makeDepositPayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: 'pay-001',
    type: 'deposit',
    amount_cents: 21000,
    amount_captured_cents: 21000,
    amount_refunded_cents: 0,
    status: 'captured',
    created_at: '2026-03-01T10:05:00Z',
    ...overrides,
  }
}

function makeBalancePayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: 'pay-002',
    type: 'balance',
    amount_cents: 49000,
    amount_captured_cents: 49000,
    amount_refunded_cents: 0,
    status: 'captured',
    created_at: '2026-04-03T10:00:00Z',
    ...overrides,
  }
}

function makeFullPayment(overrides?: Partial<PaymentRecord>): PaymentRecord {
  return {
    id: 'pay-003',
    type: 'full',
    amount_cents: 70000,
    amount_captured_cents: 70000,
    amount_refunded_cents: 0,
    status: 'captured',
    created_at: '2026-03-01T10:05:00Z',
    ...overrides,
  }
}

describe('buildBookingContext', () => {
  describe('full record serialization', () => {
    it('returns a string containing BOOKING CONTEXT header', () => {
      const result = buildBookingContext(makeFullBooking(), [])
      expect(result).toContain('BOOKING CONTEXT')
    })

    it('contains check_in date', () => {
      const result = buildBookingContext(makeFullBooking(), [])
      expect(result).toContain('2026-04-10')
    })

    it('contains check_out date', () => {
      const result = buildBookingContext(makeFullBooking(), [])
      expect(result).toContain('2026-04-17')
    })

    it('contains guest count', () => {
      const result = buildBookingContext(makeFullBooking({ guests: 4 }), [])
      expect(result).toContain('4')
    })

    it('contains total_price as EUR (not cents)', () => {
      const result = buildBookingContext(makeFullBooking({ total_price: 700 }), [])
      // total_price is in EUR — should appear as 700, NOT 70000
      expect(result).toContain('700')
    })

    it('contains status label from getPaymentStatusLabel', () => {
      const result = buildBookingContext(makeFullBooking({ status: 'confirmed' }), [])
      // getPaymentStatusLabel('confirmed') === 'Confermato'
      expect(result).toContain('Confermato')
    })
  })

  describe('payment summary', () => {
    it('shows deposit amount when deposit payment exists with amount_captured_cents > 0', () => {
      const booking = makeFullBooking()
      const payments = [makeDepositPayment({ amount_captured_cents: 21000 })]
      const result = buildBookingContext(booking, payments)
      // formatCents(21000) === '210,00'
      expect(result).toContain('210,00')
    })

    it('shows outstanding balance with auto-charge message when split booking has outstanding balance and no balance payment', () => {
      const booking = makeFullBooking({ balance_amount: 49000 })
      // Only deposit payment, no balance payment
      const payments = [makeDepositPayment()]
      const result = buildBookingContext(booking, payments)
      // formatCents(49000) === '490,00'
      expect(result).toContain('490,00')
      expect(result).toContain('automaticamente 7 giorni prima')
    })

    it('shows full payment amount when full payment exists', () => {
      const booking = makeFullBooking({ payment_type: 'full' })
      const payments = [makeFullPayment({ amount_captured_cents: 70000 })]
      const result = buildBookingContext(booking, payments)
      // formatCents(70000) === '700,00'
      expect(result).toContain('700,00')
    })

    it('does not crash when payments array is empty', () => {
      const booking = makeFullBooking()
      expect(() => buildBookingContext(booking, [])).not.toThrow()
      const result = buildBookingContext(booking, [])
      expect(result).toContain('BOOKING CONTEXT')
    })
  })

  describe('cancellation policy', () => {
    it('contains getCancellationPolicyDescription for flessibile', () => {
      const booking = makeFullBooking({ cancellation_policy: 'flessibile' })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('Cancellazione gratuita fino a 24 ore')
    })

    it('contains getCancellationPolicyDescription for rigida', () => {
      const booking = makeFullBooking({ cancellation_policy: 'rigida' })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('Rimborso del 50% solo fino a 7 giorni')
    })

    it('contains getCancellationPolicyDescription for moderata', () => {
      const booking = makeFullBooking({ cancellation_policy: 'moderata' })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('Cancellazione gratuita fino a 5 giorni')
    })
  })

  describe('direct link (BOOK-04)', () => {
    it('contains direct link with booking id', () => {
      const booking = makeFullBooking({ id: '550e8400-e29b-41d4-a716-446655440001' })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('/dashboard/bookings/550e8400-e29b-41d4-a716-446655440001')
    })

    it('contains instruction to always provide direct link', () => {
      const result = buildBookingContext(makeFullBooking(), [])
      expect(result).toContain('IMPORTANT: Always provide this direct link')
    })
  })

  describe('never-invent footer', () => {
    it('always contains NEVER invent instruction', () => {
      const result = buildBookingContext(makeFullBooking(), [])
      expect(result).toContain('NEVER invent')
    })
  })

  describe('cancellation info', () => {
    it('contains cancellation context when cancelled_at is set', () => {
      const booking = makeFullBooking({
        cancelled_at: '2026-03-15T14:00:00Z',
        cancelled_by: 'guest',
        status: 'cancelled',
      })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('2026-03-15T14:00:00Z')
    })

    it('does NOT contain Cancelled at line when cancelled_at is null', () => {
      const booking = makeFullBooking({ cancelled_at: null })
      const result = buildBookingContext(booking, [])
      expect(result).not.toContain('Cancelled at:')
    })
  })

  describe('payment type display', () => {
    it('shows split payment type as 2-rate description', () => {
      const booking = makeFullBooking({ payment_type: 'split' })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('2-rate (30% deposit + 70% balance)')
    })

    it('shows full payment type', () => {
      const booking = makeFullBooking({ payment_type: 'full' })
      const result = buildBookingContext(booking, [])
      expect(result).toContain('Full payment')
    })
  })

  describe('edge cases', () => {
    it('does not throw with all non-null fields', () => {
      const booking = makeFullBooking()
      const payments = [makeDepositPayment(), makeBalancePayment()]
      expect(() => buildBookingContext(booking, payments)).not.toThrow()
    })

    it('does not throw with empty payments array', () => {
      const booking = makeFullBooking()
      expect(() => buildBookingContext(booking, [])).not.toThrow()
    })
  })
})
