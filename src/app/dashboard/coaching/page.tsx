import { createClient } from "@/lib/supabase/server";
import AddCoachForm from "./AddCoachForm";
import BookSessionForm from "./BookSessionForm";

export default async function CoachingPage() {
  const supabase = await createClient();

  const { data: coaches, error } = await supabase
    .from("coaches")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const { data: bookings } = await supabase
    .from("coaching_bookings")
    .select("*, coaches(display_name), student:student_customer_id(name, phone)")
    .order("scheduled_at", { ascending: false })
    .limit(15);

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  const totalCommission = (bookings ?? []).reduce(
    (sum, b: any) => sum + (Number(b.total_price) * Number(b.cafe_commission_pct)) / 100,
    0
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-5xl mx-auto">
      <div className="flex items-start justify-between mb-10">
        <div>
          <p className="label mb-2">20% Commission, Zero Inventory Risk</p>
          <h1 className="text-3xl font-bold tracking-tight">Coaching Marketplace</h1>
        </div>
        {cafe && <AddCoachForm cafeId={cafe.id} />}
      </div>

      <div className="mb-10 pb-10 border-b border-[var(--border)]">
        <p className="label mb-1">Commission Earned (last 15 bookings)</p>
        <p className="font-stat text-4xl font-bold text-[var(--accent)]">₹{totalCommission.toFixed(0)}</p>
      </div>

      {error && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm mb-6">
          Failed to load coaches: {error.message}
        </div>
      )}

      <section className="mb-14">
        <p className="label mb-4">Available Coaches</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches && coaches.length > 0 ? (
            coaches.map((c) => (
              <div key={c.id} className="surface rounded-lg p-5">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{c.display_name}</h3>
                  <span className="label">{c.game_specialty}</span>
                </div>
                {c.bio && <p className="text-xs text-[var(--text-dim)] mb-3">{c.bio}</p>}
                <p className="font-stat text-lg mb-3">₹{c.hourly_rate}<span className="text-xs text-[var(--text-dim)]">/hr</span></p>
                {cafe && <BookSessionForm coachId={c.id} cafeId={cafe.id} hourlyRate={c.hourly_rate} />}
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-dim)] col-span-full py-4">No coaches yet.</p>
          )}
        </div>
      </section>

      <section>
        <p className="label mb-4">Recent Bookings</p>
        <div className="space-y-0">
          {bookings && bookings.length > 0 ? (
            bookings.map((b: any) => (
              <div key={b.id} className="grid grid-cols-4 gap-4 py-3 border-b border-[var(--border)] text-sm items-center">
                <span>{b.coaches?.display_name}</span>
                <span className="text-[var(--text-dim)]">{b.student?.name ?? b.student?.phone}</span>
                <span className="font-stat">₹{b.total_price}</span>
                <span className="font-stat text-[var(--accent)]">
                  ₹{((Number(b.total_price) * Number(b.cafe_commission_pct)) / 100).toFixed(0)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-sm text-[var(--text-dim)] py-4">No bookings yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
