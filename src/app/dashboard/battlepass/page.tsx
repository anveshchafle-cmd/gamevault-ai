import { createClient } from "@/lib/supabase/server";
import PrestigeButton from "./PrestigeButton";

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
        .select("*, customers(id, name, phone, prestige_level)")
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
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-5xl mx-auto">
      <p className="label mb-2">{season ? season.season_name : "No active season"}</p>
      <h1 className="text-3xl font-bold tracking-tight mb-10">Battle Pass</h1>

      {!season && (
        <div className="surface rounded p-4 text-sm text-[var(--text-dim)] mb-8">
          No active Battle Pass season found. Run the seed script to create one.
        </div>
      )}

      {season && (
        <>
          <section className="mb-14">
            <p className="label mb-4">Player Progress</p>
            <div className="space-y-0">
              {progress && progress.length > 0 ? (
                progress.map((p: any) => (
                  <div key={p.id} className="grid grid-cols-5 gap-4 py-3 border-b border-[var(--border)] items-center text-sm">
                    <span>{p.customers?.name ?? p.customers?.phone ?? "Unknown"}</span>
                    <span className="font-stat text-[var(--accent)]">{p.current_xp} XP</span>
                    <span className="text-[var(--text-dim)]">Tier {p.current_tier} / {maxTier}</span>
                    <div className="h-1 rounded-full bg-[var(--border)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent)]"
                        style={{ width: `${Math.min(100, (p.current_tier / maxTier) * 100)}%` }}
                      />
                    </div>
                    {p.customers && (
                      <PrestigeButton
                        customerId={p.customers.id}
                        progressId={p.id}
                        currentTier={p.current_tier}
                        maxTier={maxTier}
                        prestigeLevel={p.customers.prestige_level ?? 0}
                      />
                    )}
                  </div>
                ))
              ) : (
                <p className="text-sm text-[var(--text-dim)]">No progress yet &mdash; XP is earned automatically as customers play.</p>
              )}
            </div>
          </section>

          <section className="mb-14">
            <p className="label mb-4">Season Tiers</p>
            <div className="flex overflow-x-auto gap-3 pb-2">
              {tiers?.map((t) => (
                <div key={t.id} className="surface rounded p-4 min-w-[180px] shrink-0">
                  <p className="label mb-2">Tier {t.tier_number} &middot; {t.xp_required} XP</p>
                  <p className="text-sm mb-1">{t.free_reward}</p>
                  <p className="text-xs text-[var(--accent)]">&#9733; {t.premium_reward}</p>
                </div>
              ))}
            </div>
          </section>
        </>
      )}

      <section>
        <p className="label mb-4">Recent Achievements</p>
        <div className="space-y-0">
          {recentAchievements && recentAchievements.length > 0 ? (
            recentAchievements.map((a: any) => (
              <div key={a.id} className="grid grid-cols-3 gap-4 py-3 border-b border-[var(--border)] text-sm items-center">
                <span>{a.customers?.name ?? a.customers?.phone ?? "Unknown"}</span>
                <span className="text-[var(--accent)]">{a.achievement_definitions?.name}</span>
                <span className="text-[var(--text-dim)] text-xs">{new Date(a.earned_at).toLocaleDateString()}</span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-dim)]">No achievements earned yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
