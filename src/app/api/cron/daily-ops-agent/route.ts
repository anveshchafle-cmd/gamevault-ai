import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { recomputeClvForCafe } from "@/lib/clv/engine";
import { generateNextBestActions } from "@/lib/nba/engine";
import { rolloverExpiredSquadCycles } from "@/lib/squads/rollover";

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const startedAt = new Date();
  const report: Record<string, any> = { startedAt: startedAt.toISOString() };

  const supabase = createServiceRoleClient();
  const { data: cafes } = await supabase.from("cafes").select("id");

  if (!cafes) {
    return NextResponse.json({ error: "No cafes found" }, { status: 404 });
  }

  // 1. Churn detection + WhatsApp
  try {
    const res = await fetch(`${baseUrl}/api/cron/churn-detection`);
    report.churnDetection = await res.json();
  } catch (e) {
    report.churnDetection = { error: String(e) };
  }

  // 2. Birthday check
  try {
    const res = await fetch(`${baseUrl}/api/cron/birthday-check`);
    report.birthdayCheck = await res.json();
  } catch (e) {
    report.birthdayCheck = { error: String(e) };
  }

  // 3. Leaderboard refresh
  try {
    const res = await fetch(`${baseUrl}/api/cron/refresh-leaderboard`);
    report.leaderboardRefresh = await res.json();
  } catch (e) {
    report.leaderboardRefresh = { error: String(e) };
  }

  // 4. CLV recompute (per cafe, direct call — no extra HTTP hop)
  let totalScored = 0;
  let squadsRolledOver = 0;
  for (const cafe of cafes) {
    const clvResult = await recomputeClvForCafe(cafe.id);
    totalScored += clvResult.scored;

    const rolloverResult = await rolloverExpiredSquadCycles(cafe.id);
    squadsRolledOver += rolloverResult.rolledOver;
  }
  report.clvRecompute = { totalScored };
  report.squadRollover = { squadsRolledOver };

  // 5. Next-Best-Action generation (depends on fresh CLV, so runs after step 4)
  let totalActionsGenerated = 0;
  for (const cafe of cafes) {
    const result = await generateNextBestActions(cafe.id);
    totalActionsGenerated += result.generated;
  }
  report.nbaGeneration = { totalActionsGenerated };

  // 6. NBA outcome measurement
  try {
    const res = await fetch(`${baseUrl}/api/cron/measure-nba-outcomes`);
    report.nbaOutcomeMeasurement = await res.json();
  } catch (e) {
    report.nbaOutcomeMeasurement = { error: String(e) };
  }

  const finishedAt = new Date();
  report.finishedAt = finishedAt.toISOString();
  report.durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);

  // Log this run for the owner report history
  await supabase.from("customer_events").insert({
    cafe_id: cafes[0].id,
    customer_id: null,
    event_type: "daily_ops_run",
    event_payload: report,
  });

  return NextResponse.json(report);
}
