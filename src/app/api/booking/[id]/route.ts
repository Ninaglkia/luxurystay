import { NextRequest, NextResponse } from "next/server";
import { getAdminSupabase } from "@/lib/admin-supabase";
import { createClient } from "@/lib/supabase/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminSupabase = getAdminSupabase();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Non autenticato." }, { status: 401 });
    }

    // Fetch booking with property info
    const { data: booking, error } = await adminSupabase
      .from("bookings")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !booking) {
      return NextResponse.json(
        { error: "Prenotazione non trovata." },
        { status: 404 }
      );
    }

    // Check authorization
    if (booking.guest_id !== user.id && booking.host_id !== user.id) {
      return NextResponse.json({ error: "Non autorizzato." }, { status: 403 });
    }

    // Fetch property
    const { data: property } = await adminSupabase
      .from("properties")
      .select("title, address, photos, price, cancellation_policy")
      .eq("id", booking.property_id)
      .single();

    // Fetch payments
    const { data: payments } = await adminSupabase
      .from("payments")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: true });

    // Fetch refunds
    const { data: refunds } = await adminSupabase
      .from("refunds")
      .select("*")
      .eq("booking_id", id)
      .order("created_at", { ascending: true });

    // Fetch guest/host profile
    const { data: guestProfile } = booking.guest_id
      ? await adminSupabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", booking.guest_id)
          .single()
      : { data: null };

    const { data: hostProfile } = await adminSupabase
      .from("profiles")
      .select("full_name, avatar_url")
      .eq("id", booking.host_id)
      .single();

    return NextResponse.json({
      booking,
      property,
      payments: payments || [],
      refunds: refunds || [],
      guestProfile,
      hostProfile,
    });
  } catch (err) {
    console.error("Get booking error:", err);
    return NextResponse.json(
      { error: "Errore interno del server." },
      { status: 500 }
    );
  }
}
