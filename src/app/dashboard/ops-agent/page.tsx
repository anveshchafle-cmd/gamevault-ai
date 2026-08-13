import { createClient } from "@/lib/supabase/server";
import RunAgentButton from "./RunAgentButton";

export default async function OpsAgentPage() {
  const supabase = await createClient();

  const { data: runs } = await supabase
    .from("customer_events")
    .select("*")
    .eq("event_type", "daily_ops_run")
    .order("occurred_at", { ascending: false })
    .limit(10);

  const lastRun = runs && runs.length > 0 ? runs[0] : null;
  const payload = lastRun?.event_payload as any;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-4xl mx-auto">
      <p className="label mb-2">Automated Every Morning</p>
      <h1 className="text-3xl font-bold tracking-tight mb-10">Daily Ops Agent</h1>

      <p className="text-sm text-[var(--text-dim)] mb-8">
        Runs churn detection, birthday messages, leaderboard refresh, CLV scoring, squad renewals,
        and Next-Best-Action generation &mdash; one click, full report below.
      </p>

      <RunAgentButton />

      {lastRun && payload && (
        <div className="mt-10">
          <p className="label mb-1">Last Run</p>
          <p className="text-sm text-[var(--text-dim)] mb-6">
            {new Date(lastRun.occurred_at).toLocaleString()} &middot; took {payload.durationSeconds}s
          </p>

          <div className="space-y-0">
            <ReportRow
              label="Churn Recovery"
              detail={`Scanned ${payload.churnDetection?.scanned ?? 0} customers, sent ${payload.churnDetection?.messagesSent ?? 0} messages`}
            />
            <ReportRow
              label="Birthday Messages"
              detail={`${payload.birthdayCheck?.sent ?? 0} sent`}
            />
            <ReportRow
              label="Leaderboard"
              detail={payload.leaderboardRefresh?.success ? "Refreshed" : "Failed"}
            />
            <ReportRow
              label="CLV Scoring"
              detail={`${payload.clvRecompute?.totalScored ?? 0} customers scored`}
            />
            <ReportRow
              label="Squad Renewals"
              detail={`${payload.squadRollover?.squadsRolledOver ?? 0} cycles rolled over`}
            />
            <ReportRow
              label="Next-Best-Actions"
              detail={`${payload.nbaGeneration?.totalActionsGenerated ?? 0} generated`}
            />
            <ReportRow
              label="Outcome Measurement"
              detail={`${payload.nbaOutcomeMeasurement?.measured ?? 0} measured`}
            />
          </div>
        </div>
      )}

      {runs && runs.length > 1 && (
        <div className="mt-14">
          <p className="label mb-4">Run History</p>
          <div className="space-y-0">
            {runs.slice(1).map((r) => {
              const p = r.event_payload as any;
              return (
                <div key={r.id} className="flex items-center justify-between py-3 border-b border-[var(--border)] text-sm">
                  <span className="text-[var(--text-dim)]">{new Date(r.occurred_at).toLocaleString()}</span>
                  <span>{p.churnDetection?.messagesSent ?? 0} churn msgs &middot; {p.nbaGeneration?.totalActionsGenerated ?? 0} actions</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function ReportRow({ label, detail }: { label: string; detail: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[var(--border)] text-sm">
      <span className="font-medium">{label}</span>
      <span className="text-[var(--text-dim)]">{detail}</span>
    </div>
  );
}
