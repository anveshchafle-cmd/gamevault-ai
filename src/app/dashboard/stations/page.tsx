import { createClient } from "@/lib/supabase/server";
import type { Customer, Station } from "@/lib/types/database";
import { StationCard, type StationWithSession } from "./StationCard";

type ActiveSessionRow = {
  id: string;
  station_id: string;
  customer_id: string | null;
  started_at: string;
  game_played: string | null;
  customers: Pick<Customer, "name" | "phone"> | null;
};

export default async function StationsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: stations, error: stationsError } = await supabase
    .from("stations").select("*").order("label");

  const { data: activeSessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, station_id, customer_id, started_at, game_played, customers(name, phone)")
    .is("ended_at", null);

  const sessionByStation = new Map<string, ActiveSessionRow>();
  for (const session of (activeSessions ?? []) as unknown as ActiveSessionRow[]) {
    sessionByStation.set(session.station_id, session);
  }

  const stationsWithSessions: StationWithSession[] = ((stations ?? []) as Station[]).map((station) => {
    const active = sessionByStation.get(station.id);
    return {
      ...station,
      activeSession: active
        ? {
            id: active.id, customer_id: active.customer_id, started_at: active.started_at,
            game_played: active.game_played, customer: active.customers,
          }
        : null,
    };
  });

  const fetchError = stationsError?.message ?? sessionsError?.message;
  const occupiedCount = stationsWithSessions.filter((s) => s.status === "occupied").length;
  const availableCount = stationsWithSessions.filter((s) => s.status === "available").length;
  const maintenanceCount = stationsWithSessions.filter((s) => s.status === "maintenance").length;

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] px-8 py-12 max-w-6xl mx-auto">
      <p className="label mb-2">Live Floor</p>
      <h1 className="text-3xl font-bold tracking-tight mb-8">Station Command Center</h1>

      {!fetchError && stationsWithSessions.length > 0 && (
        <div className="flex gap-6 mb-10 text-sm text-[var(--text-dim)]">
          <span><span className="font-stat text-[var(--accent)] font-semibold">{occupiedCount}</span> occupied</span>
          <span><span className="font-stat text-[var(--text)] font-semibold">{availableCount}</span> available</span>
          <span><span className="font-stat font-semibold">{maintenanceCount}</span> maintenance</span>
        </div>
      )}

      {fetchError && (
        <div className="surface rounded p-4 border-[var(--danger)] text-[var(--danger)] text-sm">
          Failed to load stations: {fetchError}
        </div>
      )}

      {!fetchError && stationsWithSessions.length === 0 && (
        <div className="surface rounded-lg p-16 text-center">
          <p className="text-lg font-medium mb-2">No stations found</p>
          <p className="text-sm text-[var(--text-dim)]">
            {user ? "Add stations in Supabase or check RLS policies for your cafe." : "Authenticate as cafe staff to view your stations."}
          </p>
        </div>
      )}

      {!fetchError && stationsWithSessions.length > 0 && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {stationsWithSessions.map((station) => (
            <StationCard key={station.id} station={station} />
          ))}
        </div>
      )}
    </div>
  );
}
