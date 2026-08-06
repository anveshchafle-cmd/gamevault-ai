"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

type SignupResult = { success: true } | { success: false; error: string };

export async function signUpCafeOwner(formData: {
  email: string;
  password: string;
  cafeName: string;
  city: string;
  whatsappNumber: string;
}): Promise<SignupResult> {
  const { email, password, cafeName, city, whatsappNumber } = formData;

  if (!email || !password || !cafeName) {
    return { success: false, error: "Email, password, and cafe name are required." };
  }
  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters." };
  }

  const supabase = createServiceRoleClient();

  // 1. Create the auth user (service role can auto-confirm, skipping the
  // email verification step for now — add real email verification before
  // this goes to real customers).
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });

  if (authError || !authData.user) {
    return { success: false, error: authError?.message ?? "Failed to create account." };
  }

  const userId = authData.user.id;

  // 2. Create the cafe. If this fails, we should ideally roll back the
  // auth user too — Supabase JS doesn't support real transactions across
  // auth + database, so we manually clean up on failure.
  const { data: cafe, error: cafeError } = await supabase
    .from("cafes")
    .insert({
      name: cafeName,
      city,
      whatsapp_business_number: whatsappNumber || null,
    })
    .select()
    .single();

  if (cafeError || !cafe) {
    await supabase.auth.admin.deleteUser(userId); // rollback
    return { success: false, error: cafeError?.message ?? "Failed to create cafe." };
  }

  // 3. Link the user to the cafe as owner.
  const { error: staffError } = await supabase.from("cafe_staff").insert({
    cafe_id: cafe.id,
    user_id: userId,
    role: "owner",
  });

  if (staffError) {
    // rollback both prior steps to avoid an orphaned cafe/user
    await supabase.from("cafes").delete().eq("id", cafe.id);
    await supabase.auth.admin.deleteUser(userId);
    return { success: false, error: staffError.message };
  }

  return { success: true };
}
