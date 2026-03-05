import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/admin-supabase";
import { calculateApplicationFee } from "@/lib/payment-utils";

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this header)
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = getAdminSupabase();
  const now = new Date();
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const results = {
    captured: 0,
    balanceCreated: 0,
    expired: 0,
    errors: [] as string[],
  };

  // ── Task 1: Capture authorized PIs where check-in was yesterday or earlier ──
  const { data: authorizedPayments } = await adminSupabase
    .from("payments")
    .select("*, bookings!inner(id, check_in, status)")
    .eq("status", "authorized")
    .eq("type", "full")
    .lte("bookings.check_in", yesterday.toISOString().split("T")[0]);

  if (authorizedPayments) {
    for (const payment of authorizedPayments) {
      try {
        await stripe.paymentIntents.capture(payment.stripe_payment_intent_id);

        await adminSupabase
          .from("payments")
          .update({
            status: "captured",
            amount_captured_cents: payment.amount_cents,
            captured_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        await adminSupabase
          .from("bookings")
          .update({ status: "captured", payment_status: "paid" })
          .eq("id", payment.booking_id);

        results.captured++;
      } catch (err) {
        results.errors.push(
          `Capture failed for payment ${payment.id}: ${err}`
        );
      }
    }
  }

  // ── Task 2: Create balance PI for split bookings where check-in ≤ 7 days ──
  const { data: splitBookings } = await adminSupabase
    .from("bookings")
    .select("*")
    .eq("payment_type", "split")
    .in("status", ["authorized", "confirmed"])
    .is("stripe_balance_payment_intent_id", null)
    .lte("check_in", sevenDaysFromNow.toISOString().split("T")[0])
    .gt("balance_amount", 0);

  if (splitBookings) {
    for (const booking of splitBookings) {
      try {
        if (!booking.stripe_customer_id) continue;

        // Get saved payment methods for this customer
        const paymentMethods = await stripe.paymentMethods.list({
          customer: booking.stripe_customer_id,
          type: "card",
        });

        if (paymentMethods.data.length === 0) {
          results.errors.push(
            `No saved card for booking ${booking.id}, customer ${booking.stripe_customer_id}`
          );
          continue;
        }

        // Create balance PI with off_session (using saved card)
        const balanceAppFee = calculateApplicationFee(booking.balance_amount);
        const balancePI = await stripe.paymentIntents.create({
          amount: booking.balance_amount,
          currency: "eur",
          customer: booking.stripe_customer_id,
          payment_method: paymentMethods.data[0].id,
          off_session: true,
          confirm: true,
          application_fee_amount: balanceAppFee,
          description: `Saldo 70% - Prenotazione ${booking.id.slice(0, 8)}`,
          metadata: {
            booking_id: booking.id,
            type: "balance",
            platform_fee_cents: balanceAppFee.toString(),
          },
          statement_descriptor_suffix: "LUXURYSTAY",
        });

        // Save on booking
        await adminSupabase
          .from("bookings")
          .update({ stripe_balance_payment_intent_id: balancePI.id })
          .eq("id", booking.id);

        // Create payment record
        await adminSupabase.from("payments").insert({
          booking_id: booking.id,
          stripe_payment_intent_id: balancePI.id,
          type: "balance",
          amount_cents: booking.balance_amount,
          currency: "eur",
          status:
            balancePI.status === "succeeded" ? "captured" : "requires_payment",
          amount_captured_cents:
            balancePI.status === "succeeded" ? booking.balance_amount : 0,
          captured_at:
            balancePI.status === "succeeded"
              ? new Date().toISOString()
              : undefined,
        });

        results.balanceCreated++;
      } catch (err) {
        results.errors.push(
          `Balance PI creation failed for booking ${booking.id}: ${err}`
        );
      }
    }
  }

  // ── Task 3: Expire pending_payment bookings older than 30 minutes ──
  const thirtyMinAgo = new Date(now.getTime() - 30 * 60 * 1000);

  const { data: expiredBookings } = await adminSupabase
    .from("bookings")
    .select("id, stripe_payment_intent_id, stripe_deposit_payment_intent_id")
    .eq("status", "pending_payment")
    .lt("created_at", thirtyMinAgo.toISOString());

  if (expiredBookings) {
    for (const booking of expiredBookings) {
      try {
        // Cancel any pending PIs
        const piId =
          booking.stripe_payment_intent_id ||
          booking.stripe_deposit_payment_intent_id;
        if (piId) {
          try {
            await stripe.paymentIntents.cancel(piId);
          } catch {
            // PI may already be cancelled/captured
          }
        }

        await adminSupabase
          .from("bookings")
          .update({ status: "expired" })
          .eq("id", booking.id);

        // Cancel related payment records
        await adminSupabase
          .from("payments")
          .update({ status: "cancelled" })
          .eq("booking_id", booking.id)
          .eq("status", "requires_payment");

        results.expired++;
      } catch (err) {
        results.errors.push(
          `Expire failed for booking ${booking.id}: ${err}`
        );
      }
    }
  }

  return NextResponse.json({
    success: true,
    ...results,
    timestamp: now.toISOString(),
  });
}
