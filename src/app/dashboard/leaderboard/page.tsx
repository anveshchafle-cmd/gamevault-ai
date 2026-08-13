import { createClient } from "@/lib/supabase/server";
import RefreshLeaderboardButton from "./RefreshLeaderboardButton";

type LeaderboardRow = {
  cafe_id: string;
  customer_id: string;
  name: string | null;
  hours_played: number | null;
  total_spend: number | null;
  referrals_made: number | null;
};

export default async function LeaderboardPage() {
  const supabase = await createClient();

  const { data: rows, error } = await supabase
    .from("leaderboard_weekly")
    .select("*")
    .returns<LeaderboardRow[]>();

  const byHours = [...(rows ?? [])].sort((a, b) => (b.hours_played ?? 0) - (a.hours_played ?? 0)).slice(0, 8);
  const bySpend = [...(rows ?? [])].sort((a, b) => (b.total_spend ?? 0) - (a.total_spend ?? 0)).slice(0, 8);
  const byReferrals = [...(rows ?? [])].sort((a, b) => (b.referrals_made ?? 0) - (a.referrals_made ?? 0)).slice(0, 8);

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-6xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="label mb-2">This Week</p>
          <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        </div>
        <RefreshLeaderboardButton />
      </div>

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mb-6">
          Failed to load leaderboard: {error.message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-10">
        <LeaderboardColumn title="The Grinder" subtitle="Most Hours" rows={byHours} valueKey="hours_played" format={(v) => `${(v ?? 0).toFixed(1)}h`} />
        <LeaderboardColumn title="The Whale" subtitle="Biggest Spender" rows={bySpend} valueKey="total_spend" format={(v) => `₹${(v ?? 0).toFixed(0)}`} />
        <LeaderboardColumn title="The Socialite" subtitle="Most Referrals" rows={byReferrals} valueKey="referrals_made" format={(v) => `${v ?? 0}`} />
      </div>
    </div>
  );
}

function LeaderboardColumn({
  title, subtitle, rows, valueKey, format,
}: {
  title: string; subtitle: string; rows: LeaderboardRow[];
  valueKey: "hours_played" | "total_spend" | "referrals_made";
  format: (v: number | null) => string;
}) {
  return (
    <div>
      <p className="label mb-1">{subtitle}</p>
      <h2 className="text-lg font-semibold mb-4">{title}</h2>
      <div className="space-y-0">
        {rows.length > 0 ? (
          rows.map((r, i) => (
            <div key={r.customer_id} className="flex items-center justify-between py-2.5 border-b border-[var(--border)]">
              <div className="flex items-center gap-3">
                <span className={`font-stat text-sm w-4 ${i === 0 ? "text-[var(--accent)] font-semibold" : "text-[var(--text-dim)]"}`}>
                  {i + 1}
                </span>
                <span className="text-sm">{r.name ?? "Unknown"}</span>
              </div>
              <span className="font-stat text-sm text-[var(--text-dim)]">{format(r[valueKey])}</span>
            </div>
          ))
        ) : (
          <p className="text-sm text-[var(--text-dim)] py-4">No data yet</p>
        )}
      </div>
    </div>
  );
}
