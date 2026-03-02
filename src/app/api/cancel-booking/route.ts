import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/admin-supabase";
import { createClient } from "@/lib/supabase/server";
import {
  calculateRefundPercent,
  calculateRefundAmount,
} from "@/lib/payment-utils";

export async function POST(request: NextRequest) {
  try {
    const { booking_id } = await request.json();

    if (!booking_id) {
      return NextResponse.json(
        { error: "booking_id mancante." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = getAdminSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
    }

    // Fetch booking
    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        { error: "Prenotazione non trovata." },
        { status: 404 }
      );
    }

    // Check authorization: must be guest or host
    const isGuest = booking.guest_id === user.id;
    const isHost = booking.host_id === user.id;
    if (!isGuest && !isHost) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }

    // Check if cancellable
    if (["cancelled", "refunded", "expired"].includes(booking.status)) {
      return NextResponse.json(
        { error: "Questa prenotazione non può essere cancellata." },
        { status: 400 }
      );
    }

    const cancelledBy = isGuest ? "guest" : "host";
    const refundPercent =
      cancelledBy === "host"
        ? 100 // Host cancels → full refund
        : calculateRefundPercent(booking.cancellation_policy, booking.check_in);

    // Get all payments for this booking
    const { data: payments } = await adminSupabase
      .from("payments")
      .select("*")
      .eq("booking_id", booking_id);

    const refundsCreated: string[] = [];

    if (payments) {
      for (const payment of payments) {
        if (payment.status === "authorized") {
          // Not yet captured → cancel the PI
          await stripe.paymentIntents.cancel(payment.stripe_payment_intent_id);
          await adminSupabase
            .from("payments")
            .update({ status: "cancelled" })
            .eq("id", payment.id);
        } else if (
          payment.status === "captured" &&
          payment.amount_captured_cents > 0
        ) {
          // Already captured → refund
          const refundAmount = calculateRefundAmount(
            payment.amount_captured_cents,
            refundPercent
          );

          if (refundAmount > 0) {
            const stripeRefund = await stripe.refunds.create({
              payment_intent: payment.stripe_payment_intent_id,
              amount: refundAmount,
              reason: "requested_by_customer",
            });

            // Create refund record
            const { data: refundRecord } = await adminSupabase
              .from("refunds")
              .insert({
                payment_id: payment.id,
                booking_id: booking_id,
                stripe_refund_id: stripeRefund.id,
                amount_cents: refundAmount,
                reason:
                  cancelledBy === "host"
                    ? "host_cancellation"
                    : "guest_cancellation",
                status: "succeeded",
                initiated_by: cancelledBy,
              })
              .select("id")
              .single();

            if (refundRecord) refundsCreated.push(refundRecord.id);

            // Update payment refunded amount
            await adminSupabase
              .from("payments")
              .update({
                amount_refunded_cents:
                  payment.amount_refunded_cents + refundAmount,
                status: "refunded",
              })
              .eq("id", payment.id);
          }
        } else if (payment.status === "requires_payment") {
          // Not yet paid → just cancel
          try {
            await stripe.paymentIntents.cancel(
              payment.stripe_payment_intent_id
            );
          } catch {
            // PI may already be cancelled
          }
          await adminSupabase
            .from("payments")
            .update({ status: "cancelled" })
            .eq("id", payment.id);
        }
      }
    }

    // Update booking status
    await adminSupabase
      .from("bookings")
      .update({
        status: "cancelled",
        cancelled_at: new Date().toISOString(),
        cancelled_by: cancelledBy,
      })
      .eq("id", booking_id);

    return NextResponse.json({
      success: true,
      refundPercent,
      refundsCreated,
      cancelledBy,
    });
  } catch (err) {
    console.error("Cancel booking error:", err);
    return NextResponse.json(
      { error: "Errore interno del server." },
      { status: 500 }
    );
  }
}
