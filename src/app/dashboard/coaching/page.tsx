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
    .limit(20);

  const { data: cafe } = await supabase.from("cafes").select("id").limit(1).maybeSingle();

  const totalCommission = (bookings ?? []).reduce(
    (sum, b: any) => sum + (Number(b.total_price) * Number(b.cafe_commission_pct)) / 100,
    0
  );

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Coaching Marketplace</h1>
          <p className="text-neutral-400 text-sm">
            Skilled players coach others — cafe takes a cut, zero inventory risk
          </p>
        </div>
        {cafe && <AddCoachForm cafeId={cafe.id} />}
      </div>

      <div className="mb-6 rounded-lg border border-emerald-800 bg-emerald-950/30 px-5 py-3">
        <p className="text-sm text-neutral-400">Total commission earned (last 20 bookings)</p>
        <p className="text-2xl font-bold text-emerald-400">₹{totalCommission.toFixed(0)}</p>
      </div>

      {error && (
        <div className="mb-6 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-red-300">
          Failed to load coaches: {error.message}
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-lg font-semibold mb-3">Available Coaches</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coaches && coaches.length > 0 ? (
            coaches.map((c) => (
              <div key={c.id} className="rounded-lg border border-neutral-800 bg-neutral-950 p-4">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-semibold">{c.display_name}</h3>
                  <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">
                    {c.game_specialty}
                  </span>
                </div>
                {c.bio && <p className="text-xs text-neutral-500 mb-2">{c.bio}</p>}
                <p className="text-sm text-neutral-300 mb-3">₹{c.hourly_rate}/hour</p>
                {cafe && <BookSessionForm coachId={c.id} cafeId={cafe.id} hourlyRate={c.hourly_rate} />}
              </div>
            ))
          ) : (
            <div className="col-span-full text-center text-neutral-500 py-8">
              No coaches yet — add one above.
            </div>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Recent Bookings</h2>
        <div className="rounded-lg border border-neutral-800 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-800 text-neutral-400">
              <tr>
                <th className="text-left px-4 py-2">Coach</th>
                <th className="text-left px-4 py-2">Student</th>
                <th className="text-left px-4 py-2">When</th>
                <th className="text-left px-4 py-2">Total</th>
                <th className="text-left px-4 py-2">Cafe Cut</th>
              </tr>
            </thead>
            <tbody>
              {bookings && bookings.length > 0 ? (
                bookings.map((b: any) => (
                  <tr key={b.id} className="border-t border-neutral-800">
                    <td className="px-4 py-2">{b.coaches?.display_name}</td>
                    <td className="px-4 py-2">{b.student?.name ?? b.student?.phone}</td>
                    <td className="px-4 py-2 text-neutral-400">
                      {new Date(b.scheduled_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">₹{b.total_price}</td>
                    <td className="px-4 py-2 text-emerald-400">
                      ₹{((Number(b.total_price) * Number(b.cafe_commission_pct)) / 100).toFixed(0)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-neutral-500">
                    No bookings yet.
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
