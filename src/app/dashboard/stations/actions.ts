"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/types/database";

type ActionResult = { success: true } | { success: false; error: string };

export async function startSession(
  stationId: string,
  customerPhone: string,
  gameName: string
): Promise<ActionResult> {
  const phone = customerPhone.trim();
  const game = gameName.trim();

  if (!phone) {
    return { success: false, error: "Phone number is required." };
  }
  if (!game) {
    return { success: false, error: "Please select or enter a game." };
  }

  const supabase = await createClient();

  const { data: station, error: stationError } = await supabase
    .from("stations")
    .select("id, cafe_id, base_hourly_rate, status")
    .eq("id", stationId)
    .single();

  if (stationError || !station) {
    return { success: false, error: "Station not found." };
  }

  if (station.status !== "available") {
    return { success: false, error: "Station is not available." };
  }

  const { data: existingSession } = await supabase
    .from("sessions")
    .select("id")
    .eq("station_id", stationId)
    .is("ended_at", null)
    .maybeSingle();

  if (existingSession) {
    return { success: false, error: "Station already has an active session." };
  }

  let customerId: string;

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("cafe_id", station.cafe_id)
    .eq("phone", phone)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
  } else {
    const customerInsert: Database["public"]["Tables"]["customers"]["Insert"] =
      {
        cafe_id: station.cafe_id,
        phone,
      };

    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert(customerInsert)
      .select("id")
      .single();

    if (customerError || !newCustomer) {
      return {
        success: false,
        error: customerError?.message ?? "Failed to create customer.",
      };
    }

    customerId = newCustomer.id;
  }

  const sessionInsert: Database["public"]["Tables"]["sessions"]["Insert"] = {
    cafe_id: station.cafe_id,
    station_id: stationId,
    customer_id: customerId,
    game_played: game,
    rate_applied: station.base_hourly_rate,
    rate_reason: "base",
  };

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .insert(sessionInsert)
    .select("id")
    .single();

  if (sessionError || !session) {
    return {
      success: false,
      error: sessionError?.message ?? "Failed to start session.",
    };
  }

  const eventInsert: Database["public"]["Tables"]["customer_events"]["Insert"] =
    {
      cafe_id: station.cafe_id,
      customer_id: customerId,
      event_type: "visit",
      event_payload: { session_id: session.id, station_id: stationId, game },
    };

  const { error: eventError } = await supabase
    .from("customer_events")
    .insert(eventInsert);

  if (eventError) {
    return {
      success: false,
      error: eventError.message ?? "Session started but failed to log visit.",
    };
  }

  const { error: statusError } = await supabase
    .from("stations")
    .update({ status: "occupied" })
    .eq("id", stationId);

  if (statusError) {
    return {
      success: false,
      error: statusError.message ?? "Session started but failed to update station.",
    };
  }

  revalidatePath("/dashboard/stations");
  return { success: true };
}

export async function endSession(sessionId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { data: session, error: sessionError } = await supabase
    .from("sessions")
    .select(
      "id, cafe_id, station_id, customer_id, game_played, started_at, rate_applied, ended_at"
    )
    .eq("id", sessionId)
    .single();

  if (sessionError || !session) {
    return { success: false, error: "Session not found." };
  }

  if (session.ended_at) {
    return { success: false, error: "Session has already ended." };
  }

  const endedAt = new Date();
  const startedAt = new Date(session.started_at);
  const durationMs = Math.max(0, endedAt.getTime() - startedAt.getTime());
  const durationMinutes = Math.ceil(durationMs / 60000);
  const durationHours = durationMs / (1000 * 60 * 60);
  const totalAmount =
    Math.round(durationHours * session.rate_applied * 100) / 100;

  const sessionUpdate: Database["public"]["Tables"]["sessions"]["Update"] = {
    ended_at: endedAt.toISOString(),
    
    ended_reason: "manual",
  };

  const { error: updateError } = await supabase
    .from("sessions")
    .update(sessionUpdate)
    .eq("id", sessionId);

  if (updateError) {
    return {
      success: false,
      error: updateError.message ?? "Failed to end session.",
    };
  }

  const transactionInsert: Database["public"]["Tables"]["transactions"]["Insert"] =
    {
      cafe_id: session.cafe_id,
      customer_id: session.customer_id,
      session_id: session.id,
      item_type: "session_time",
      item_name: session.game_played,
      quantity: Math.round(durationHours * 100) / 100,
      unit_price: session.rate_applied,
      total_amount: totalAmount,
    };

  const { error: transactionError } = await supabase
    .from("transactions")
    .insert(transactionInsert);

  if (transactionError) {
    return {
      success: false,
      error: transactionError.message ?? "Failed to record transaction.",
    };
  }

  const { error: statusError } = await supabase
    .from("stations")
    .update({ status: "available" })
    .eq("id", session.station_id);

  if (statusError) {
    return {
      success: false,
      error:
        statusError.message ?? "Session ended but failed to update station.",
    };
  }

  revalidatePath("/dashboard/stations");
  return { success: true };
}
