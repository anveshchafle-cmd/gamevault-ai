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

  const byHours = [...(rows ?? [])]
    .sort((a, b) => (b.hours_played ?? 0) - (a.hours_played ?? 0))
    .slice(0, 10);
  const bySpend = [...(rows ?? [])]
    .sort((a, b) => (b.total_spend ?? 0) - (a.total_spend ?? 0))
    .slice(0, 10);
  const byReferrals = [...(rows ?? [])]
    .sort((a, b) => (b.referrals_made ?? 0) - (a.referrals_made ?? 0))
    .slice(0, 10);

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Leaderboards</h1>
          <p className="text-neutral-400 text-sm">This week &middot; refreshed on demand</p>
        </div>
        <RefreshLeaderboardButton />
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load leaderboard: {error.message}
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-6">
        <LeaderboardCard
          title="⏱ Most Hours"
          rows={byHours}
          valueKey="hours_played"
          format={(v) => `${(v ?? 0).toFixed(1)}h`}
        />
        <LeaderboardCard
          title="💰 Biggest Spender"
          rows={bySpend}
          valueKey="total_spend"
          format={(v) => `₹${(v ?? 0).toFixed(0)}`}
        />
        <LeaderboardCard
          title="🤝 Most Referrals"
          rows={byReferrals}
          valueKey="referrals_made"
          format={(v) => `${v ?? 0}`}
        />
      </div>
    </div>
  );
}

function LeaderboardCard({
  title,
  rows,
  valueKey,
  format,
}: {
  title: string;
  rows: LeaderboardRow[];
  valueKey: "hours_played" | "total_spend" | "referrals_made";
  format: (v: number | null) => string;
}) {
  const titles = ["The Grinder", "The Whale", "The Socialite"];

  return (
    <div className="rounded-lg border border-neutral-800 overflow-hidden">
      <div className="bg-neutral-800 px-4 py-3 font-semibold">{title}</div>
      <div className="divide-y divide-neutral-800">
        {rows.length > 0 ? (
          rows.map((r, i) => (
            <div key={r.customer_id} className="flex items-center justify-between px-4 py-2.5">
              <div className="flex items-center gap-3">
                <span
                  className={`text-sm w-5 text-center font-bold ${
                    i === 0
                      ? "text-yellow-400"
                      : i === 1
                      ? "text-neutral-300"
                      : i === 2
                      ? "text-amber-600"
                      : "text-neutral-600"
                  }`}
                >
                  {i + 1}
                </span>
                <span className="text-sm">{r.name ?? "Unknown"}</span>
                {i === 0 && (
                  <span className="text-[10px] bg-emerald-900/50 text-emerald-300 px-1.5 py-0.5 rounded">
                    {titles[["hours_played", "total_spend", "referrals_made"].indexOf(valueKey)]}
                  </span>
                )}
              </div>
              <span className="text-sm text-neutral-400 font-medium">
                {format(r[valueKey])}
              </span>
            </div>
          ))
        ) : (
          <div className="px-4 py-8 text-center text-neutral-500 text-sm">No data yet</div>
        )}
      </div>
    </div>
  );
}