"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function markActionExecuted(actionId: string) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("next_best_actions")
    .update({ was_executed: true, executed_at: new Date().toISOString() })
    .eq("id", actionId);

  if (error) return { success: false, error: error.message };

  revalidatePath("/dashboard/actions");
  return { success: true };
}
