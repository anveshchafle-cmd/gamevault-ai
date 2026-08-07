import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { generateNextBestActions } from "@/lib/nba/engine";

export async function GET() {
  const supabase = createServiceRoleClient();

  const { data: cafes } = await supabase.from("cafes").select("id");

  if (!cafes) {
    return NextResponse.json({ error: "No cafes found" }, { status: 404 });
  }

  let totalGenerated = 0;
  for (const cafe of cafes) {
    const result = await generateNextBestActions(cafe.id);
    totalGenerated += result.generated;
  }

  return NextResponse.json({ success: true, totalGenerated });
}
