import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/admin-supabase";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    console.error("Webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const supabase = getAdminSupabase();

  switch (event.type) {
    // ── Legacy: Checkout Session events (for existing bookings) ──
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({
            status: "confirmed",
            payment_status: "paid",
            stripe_session_id: session.id,
          })
          .eq("id", bookingId);
      }
      break;
    }

    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const bookingId = session.metadata?.booking_id;
      if (bookingId) {
        await supabase
          .from("bookings")
          .update({ status: "expired", payment_status: "unpaid" })
          .eq("id", bookingId);
      }
      break;
    }

    // ── Payment Intent: authorized (manual capture) ──
    case "payment_intent.amount_capturable_updated": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = pi.metadata?.booking_id;
      const type = pi.metadata?.type;

      if (bookingId) {
        // Update payment record
        await supabase
          .from("payments")
          .update({
            status: "authorized",
            amount_authorized_cents: pi.amount_capturable,
          })
          .eq("stripe_payment_intent_id", pi.id);

        // Only update booking status for full payments
        if (type === "full") {
          await supabase
            .from("bookings")
            .update({ status: "authorized" })
            .eq("id", bookingId);
        }
      }
      break;
    }

    // ── Payment Intent: succeeded (captured or auto-captured deposit) ──
    case "payment_intent.succeeded": {
      const pi = event.data.object as Stripe.PaymentIntent;
      const bookingId = pi.metadata?.booking_id;
      const type = pi.metadata?.type;

      if (bookingId) {
        await supabase
          .from("payments")
          .update({
            status: "captured",
            amount_captured_cents: pi.amount_received,
            captured_at: new Date().toISOString(),
          })
          .eq("stripe_payment_intent_id", pi.id);

        if (type === "deposit") {
          // Deposit captured → booking is confirmed (awaiting balance)
          await supabase
            .from("bookings")
            .update({ status: "confirmed", payment_status: "partial" })
            .eq("id", bookingId);
        } else if (type === "full") {
          await supabase
            .from("bookings")
            .update({ status: "captured", payment_status: "paid" })
            .eq("id", bookingId);
        } else if (type === "balance") {
          // Balance captured → fully paid
          await supabase
            .from("bookings")
            .update({ payment_status: "paid" })
            .eq("id", bookingId);
        }
      }
      break;
    }

    // ── Payment Intent: canceled ──
    case "payment_intent.canceled": {
      const pi = event.data.object as Stripe.PaymentIntent;

      await supabase
        .from("payments")
        .update({ status: "cancelled" })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    // ── Payment Intent: failed ──
    case "payment_intent.payment_failed": {
      const pi = event.data.object as Stripe.PaymentIntent;

      await supabase
        .from("payments")
        .update({ status: "failed" })
        .eq("stripe_payment_intent_id", pi.id);
      break;
    }

    // ── Charge: refunded ──
    case "charge.refunded": {
      const charge = event.data.object as Stripe.Charge;
      const piId = charge.payment_intent as string;

      if (piId && charge.amount_refunded > 0) {
        await supabase
          .from("payments")
          .update({ amount_refunded_cents: charge.amount_refunded })
          .eq("stripe_payment_intent_id", piId);
      }
      break;
    }
  }

  return NextResponse.json({ received: true });
}
