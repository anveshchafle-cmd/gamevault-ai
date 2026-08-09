"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCoach(formData: {
  cafeId: string;
  displayName: string;
  gameSpecialty: string;
  hourlyRate: number;
  bio: string;
  coachPhone: string;
}) {
  const supabase = await createClient();

  let coachCustomerId: string | null = null;
  if (formData.coachPhone) {
    const { data: existing } = await supabase
      .from("customers")
      .select("id")
      .eq("cafe_id", formData.cafeId)
      .eq("phone", formData.coachPhone)
      .maybeSingle();
    coachCustomerId = existing?.id ?? null;

    if (!coachCustomerId) {
      const { data: newCustomer } = await supabase
        .from("customers")
        .insert({ cafe_id: formData.cafeId, phone: formData.coachPhone, name: formData.displayName })
        .select("id")
        .single();
      coachCustomerId = newCustomer?.id ?? null;
    }
  }

  const { error } = await supabase.from("coaches").insert({
    cafe_id: formData.cafeId,
    customer_id: coachCustomerId,
    display_name: formData.displayName,
    game_specialty: formData.gameSpecialty,
    hourly_rate: formData.hourlyRate,
    bio: formData.bio || null,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/coaching");
  return { success: true };
}

export async function bookCoachingSession(formData: {
  cafeId: string;
  coachId: string;
  studentPhone: string;
  durationHours: number;
  totalPrice: number;
}) {
  const supabase = await createClient();

  const { data: existingCustomer } = await supabase
    .from("customers")
    .select("id")
    .eq("cafe_id", formData.cafeId)
    .eq("phone", formData.studentPhone)
    .maybeSingle();

  let studentId = existingCustomer?.id;
  if (!studentId) {
    const { data: newCustomer, error: customerError } = await supabase
      .from("customers")
      .insert({ cafe_id: formData.cafeId, phone: formData.studentPhone })
      .select("id")
      .single();
    if (customerError || !newCustomer) {
      return { success: false, error: customerError?.message ?? "Failed to create student" };
    }
    studentId = newCustomer.id;
  }

  const { error } = await supabase.from("coaching_bookings").insert({
    cafe_id: formData.cafeId,
    coach_id: formData.coachId,
    student_customer_id: studentId,
    scheduled_at: new Date().toISOString(),
    duration_hours: formData.durationHours,
    total_price: formData.totalPrice,
    cafe_commission_pct: 20,
  });

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/coaching");
  return { success: true };
}
