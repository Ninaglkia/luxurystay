import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { getAdminSupabase } from "@/lib/admin-supabase";
import { createClient } from "@/lib/supabase/server";
import {
  shouldSplitPayment,
  calculateSplitAmounts,
} from "@/lib/payment-utils";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      property_id,
      check_in,
      check_out,
      guests,
      total_price,
      guest_name,
      guest_email,
      guest_phone,
      property_title,
    } = body;

    if (!property_id || !check_in || !check_out || !guests || !total_price) {
      return NextResponse.json(
        { error: "Dati mancanti per la prenotazione." },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    const adminSupabase = getAdminSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch property with cancellation_policy
    const { data: property, error: propError } = await adminSupabase
      .from("properties")
      .select("user_id, title, cancellation_policy")
      .eq("id", property_id)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: "Proprietà non trovata." },
        { status: 404 }
      );
    }

    if (user && user.id === property.user_id) {
      return NextResponse.json(
        { error: "Non puoi prenotare il tuo stesso alloggio." },
        { status: 400 }
      );
    }

    const totalCents = Math.round(total_price * 100);
    const isSplit = shouldSplitPayment(check_in);
    const { depositCents, balanceCents } = calculateSplitAmounts(totalCents);

    // Create or reuse Stripe Customer
    const customerEmail = user?.email || guest_email;
    const customerName = guest_name || undefined;
    const customer = await stripe.customers.create({
      email: customerEmail || undefined,
      name: customerName,
      metadata: { supabase_user_id: user?.id || "guest" },
    });

    // Build booking data
    const bookingData: Record<string, unknown> = {
      property_id,
      host_id: property.user_id,
      check_in,
      check_out,
      guests,
      total_price,
      status: "pending_payment",
      payment_status: "unpaid",
      payment_type: isSplit ? "split" : "full",
      deposit_amount: isSplit ? depositCents : 0,
      balance_amount: isSplit ? balanceCents : 0,
      cancellation_policy: property.cancellation_policy,
      stripe_customer_id: customer.id,
    };

    if (user) {
      bookingData.guest_id = user.id;
    } else {
      bookingData.guest_id = null;
      bookingData.guest_name = guest_name;
      bookingData.guest_email = guest_email;
      bookingData.guest_phone = guest_phone;
    }

    const { data: booking, error: bookingError } = await adminSupabase
      .from("bookings")
      .insert(bookingData)
      .select("id")
      .single();

    if (bookingError || !booking) {
      console.error("Booking insert error:", bookingError);
      return NextResponse.json(
        { error: "Errore nella creazione della prenotazione." },
        { status: 500 }
      );
    }

    const productName =
      property_title || property.title || "Prenotazione LuxuryStay";
    const description = `${check_in} → ${check_out} · ${guests} ospite${guests > 1 ? "i" : ""}`;

    let clientSecret: string;

    if (isSplit) {
      // Split payment: deposit with automatic capture + save card for balance
      const depositPI = await stripe.paymentIntents.create({
        amount: depositCents,
        currency: "eur",
        customer: customer.id,
        capture_method: "automatic",
        setup_future_usage: "off_session",
        description: `Acconto 30% - ${productName}`,
        metadata: {
          booking_id: booking.id,
          type: "deposit",
          total_cents: totalCents.toString(),
          balance_cents: balanceCents.toString(),
        },
        statement_descriptor_suffix: "LUXURYSTAY",
      });

      // Save deposit PI on booking
      await adminSupabase
        .from("bookings")
        .update({ stripe_deposit_payment_intent_id: depositPI.id })
        .eq("id", booking.id);

      // Create payment record for deposit
      await adminSupabase.from("payments").insert({
        booking_id: booking.id,
        stripe_payment_intent_id: depositPI.id,
        type: "deposit",
        amount_cents: depositCents,
        currency: "eur",
        status: "requires_payment",
      });

      clientSecret = depositPI.client_secret!;
    } else {
      // Full payment with manual capture (authorize only)
      const fullPI = await stripe.paymentIntents.create({
        amount: totalCents,
        currency: "eur",
        customer: customer.id,
        capture_method: "manual",
        description: productName,
        metadata: {
          booking_id: booking.id,
          type: "full",
        },
        statement_descriptor_suffix: "LUXURYSTAY",
      });

      // Save PI on booking
      await adminSupabase
        .from("bookings")
        .update({ stripe_payment_intent_id: fullPI.id })
        .eq("id", booking.id);

      // Create payment record
      await adminSupabase.from("payments").insert({
        booking_id: booking.id,
        stripe_payment_intent_id: fullPI.id,
        type: "full",
        amount_cents: totalCents,
        currency: "eur",
        status: "requires_payment",
      });

      clientSecret = fullPI.client_secret!;
    }

    return NextResponse.json({
      clientSecret,
      bookingId: booking.id,
      paymentType: isSplit ? "split" : "full",
      depositAmount: isSplit ? depositCents : undefined,
      balanceAmount: isSplit ? balanceCents : undefined,
      totalCents,
      cancellationPolicy: property.cancellation_policy,
    });
  } catch (err) {
    console.error("Create payment intent error:", err);
    return NextResponse.json(
      { error: "Errore interno del server." },
      { status: 500 }
    );
  }
}
