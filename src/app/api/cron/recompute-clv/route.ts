import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { recomputeClvForCafe } from "@/lib/clv/engine";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data: cafes } = await supabase.from("cafes").select("id");

  if (!cafes) {
    return NextResponse.json({ error: "No cafes found" }, { status: 404 });
  }

  let totalScored = 0;
  for (const cafe of cafes) {
    const result = await recomputeClvForCafe(cafe.id);
    totalScored += result.scored;
  }

  return NextResponse.json({ success: true, totalScored, cafesProcessed: cafes.length });
}
