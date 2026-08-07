import { createClient } from "@/lib/supabase/server";

export default async function BattlePassPage() {
  const supabase = await createClient();

  const { data: season } = await supabase
    .from("battle_pass_seasons")
    .select("*")
    .eq("is_active", true)
    .maybeSingle();

  const { data: tiers } = season
    ? await supabase
        .from("battle_pass_tiers")
        .select("*")
        .eq("season_id", season.id)
        .order("tier_number", { ascending: true })
    : { data: null };

  const { data: progress } = season
    ? await supabase
        .from("customer_battle_pass_progress")
        .select("*, customers(name, phone)")
        .eq("season_id", season.id)
        .order("current_xp", { ascending: false })
        .limit(20)
    : { data: null };

  const { data: recentAchievements } = await supabase
    .from("customer_achievements")
    .select("*, customers(name, phone), achievement_definitions(name, description)")
    .order("earned_at", { ascending: false })
    .limit(15);

  const maxTier = tiers && tiers.length > 0 ? tiers[tiers.length - 1].tier_number : 10;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <h1 className="text-2xl font-bold mb-1">Battle Pass & Achievements</h1>
      <p className="text-neutral-400 text-sm mb-6">
        {season ? season.season_name : "No active season"}
      </p>

      {!season && (
        <div className="rounded-md border border-yellow-700 bg-yellow-950/40 px-4 py-3 text-sm text-yellow-300 mb-6">
          No active Battle Pass season found. Run the seed script to create one.
        </div>
      )}

      {season && (
        <>
          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Player Progress</h2>
            <div className="rounded-lg border border-neutral-800 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-neutral-800 text-neutral-400">
                  <tr>
                    <th className="text-left px-4 py-2">Customer</th>
                    <th className="text-left px-4 py-2">XP</th>
                    <th className="text-left px-4 py-2">Tier</th>
                    <th className="text-left px-4 py-2">Progress</th>
                  </tr>
                </thead>
                <tbody>
                  {progress && progress.length > 0 ? (
                    progress.map((p: any) => (
                      <tr key={p.id} className="border-t border-neutral-800">
                        <td className="px-4 py-2">
                          {p.customers?.name ?? p.customers?.phone ?? "Unknown"}
                        </td>
                        <td className="px-4 py-2 text-emerald-400 font-medium">{p.current_xp}</td>
                        <td className="px-4 py-2">
                          Tier {p.current_tier} / {maxTier}
                        </td>
                        <td className="px-4 py-2 w-48">
                          <div className="h-2 rounded-full bg-neutral-800 overflow-hidden">
                            <div
                              className="h-full bg-emerald-600"
                              style={{
                                width: `${Math.min(100, (p.current_tier / maxTier) * 100)}%`,
                              }}
                            />
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-neutral-500">
                        No progress yet — XP is earned automatically as customers complete
                        sessions.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-lg font-semibold mb-3">Season Tiers</h2>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {tiers?.map((t) => (
                <div
                  key={t.id}
                  className="rounded-lg border border-neutral-800 bg-neutral-950 p-3"
                >
                  <div className="text-xs text-neutral-500 mb-1">
                    Tier {t.tier_number} · {t.xp_required} XP
                  </div>
                  <div className="text-sm text-neutral-200">{t.free_reward}</div>
                  <div className="text-xs text-emerald-400 mt-1">★ {t.premium_reward}</div>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Achievements</h2>
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="text-left px-4 py-2">Customer</th>
                <th className="text-left px-4 py-2">Achievement</th>
                <th className="text-left px-4 py-2">Earned At</th>
              </tr>
            </thead>
            <tbody>
              {recentAchievements && recentAchievements.length > 0 ? (
                recentAchievements.map((a: any) => (
                  <tr key={a.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">
                      {a.customers?.name ?? a.customers?.phone ?? "Unknown"}
                    </td>
                    <td className="px-4 py-2">
                      <span className="rounded bg-emerald-900/50 text-emerald-300 px-2 py-0.5 text-xs">
                        {a.achievement_definitions?.name}
                      </span>
                      <span className="text-neutral-500 text-xs ml-2">
                        {a.achievement_definitions?.description}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-neutral-400">
                      {new Date(a.earned_at).toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-neutral-500">
                    No achievements earned yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
