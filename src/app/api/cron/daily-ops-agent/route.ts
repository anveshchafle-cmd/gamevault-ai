import { NextResponse } from "next/server";
import { createServiceRoleClient } from "@/lib/supabase/server";
import { recomputeClvForCafe } from "@/lib/clv/engine";
import { generateNextBestActions } from "@/lib/nba/engine";
import { rolloverExpiredSquadCycles } from "@/lib/squads/rollover";
import { generateExecutiveSummary } from "@/lib/ai/executiveSummary";
import { sendOwnerReportMessage } from "@/lib/whatsapp/ownerReport";

export async function GET(request: Request) {
  const baseUrl = new URL(request.url).origin;
  const startedAt = new Date();
  const report: Record<string, any> = { startedAt: startedAt.toISOString() };

  const supabase = createServiceRoleClient();
  const { data: cafes } = await supabase.from("cafes").select("id, owner_phone");

  if (!cafes) {
    return NextResponse.json({ error: "No cafes found" }, { status: 404 });
  }

  try {
    const res = await fetch(`${baseUrl}/api/cron/churn-detection`);
    report.churnDetection = await res.json();
  } catch (e) {
    report.churnDetection = { error: String(e) };
  }

  try {
    const res = await fetch(`${baseUrl}/api/cron/birthday-check`);
    report.birthdayCheck = await res.json();
  } catch (e) {
    report.birthdayCheck = { error: String(e) };
  }

  try {
    const res = await fetch(`${baseUrl}/api/cron/refresh-leaderboard`);
    report.leaderboardRefresh = await res.json();
  } catch (e) {
    report.leaderboardRefresh = { error: String(e) };
  }

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

  let totalActionsGenerated = 0;
  for (const cafe of cafes) {
    const result = await generateNextBestActions(cafe.id);
    totalActionsGenerated += result.generated;
  }
  report.nbaGeneration = { totalActionsGenerated };

  try {
    const res = await fetch(`${baseUrl}/api/cron/measure-nba-outcomes`);
    report.nbaOutcomeMeasurement = await res.json();
  } catch (e) {
    report.nbaOutcomeMeasurement = { error: String(e) };
  }

  const finishedAt = new Date();
  report.finishedAt = finishedAt.toISOString();
  report.durationSeconds = Math.round((finishedAt.getTime() - startedAt.getTime()) / 1000);

  const executiveSummary = await generateExecutiveSummary(report);
  report.executiveSummary = executiveSummary;

  let ownerReportsSent = 0;
  for (const cafe of cafes) {
    await supabase.from("customer_events").insert({
      cafe_id: cafe.id,
      customer_id: null,
      event_type: "daily_ops_run",
      event_payload: report,
    });

    // Send the summary straight to the owner's WhatsApp, if they've set a number
    if (cafe.owner_phone && executiveSummary) {
      const sent = await sendOwnerReportMessage(cafe.id, cafe.owner_phone, executiveSummary);
      if (sent) ownerReportsSent++;
    }
  }
  report.ownerReportsSent = ownerReportsSent;

  return NextResponse.json(report);
}
