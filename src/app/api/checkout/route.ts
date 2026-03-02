import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

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

    // Cookie-based client to check auth status
    const supabase = await createClient();
    // Admin client to bypass RLS for booking creation
    const adminSupabase = getAdminSupabase();

    // Get authenticated user (may be null for guest bookings)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Fetch property to get host_id
    const { data: property, error: propError } = await adminSupabase
      .from("properties")
      .select("user_id, title")
      .eq("id", property_id)
      .single();

    if (propError || !property) {
      return NextResponse.json(
        { error: "Proprietà non trovata." },
        { status: 404 }
      );
    }

    // Prevent self-booking
    if (user && user.id === property.user_id) {
      return NextResponse.json(
        { error: "Non puoi prenotare il tuo stesso alloggio." },
        { status: 400 }
      );
    }

    // Create booking with pending_payment status
    const bookingData: Record<string, unknown> = {
      property_id,
      host_id: property.user_id,
      check_in,
      check_out,
      guests,
      total_price,
      status: "pending_payment",
      payment_status: "unpaid",
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

    // Build the base URL from the request
    const origin = request.headers.get("origin") || request.nextUrl.origin;

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: property_title || property.title || "Prenotazione LuxuryStay",
              description: `${check_in} → ${check_out} · ${guests} ospite${guests > 1 ? "i" : ""}`,
            },
            unit_amount: Math.round(total_price * 100), // Convert EUR to cents
          },
          quantity: 1,
        },
      ],
      metadata: {
        booking_id: booking.id,
      },
      customer_email: user?.email || guest_email || undefined,
      success_url: `${origin}/booking/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/property/${property_id}/book?checkin=${check_in}&checkout=${check_out}&guests=${guests}`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout error:", err);
    return NextResponse.json(
      { error: "Errore interno del server." },
      { status: 500 }
    );
  }
}
