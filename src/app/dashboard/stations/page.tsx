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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: stations, error: stationsError } = await supabase
    .from("stations")
    .select("*")
    .order("label");

  const { data: activeSessions, error: sessionsError } = await supabase
    .from("sessions")
    .select("id, station_id, customer_id, started_at, game_played, customers(name, phone)")
    .is("ended_at", null);

  const sessionByStation = new Map<string, ActiveSessionRow>();
  for (const session of (activeSessions ?? []) as unknown as ActiveSessionRow[]) {
    sessionByStation.set(session.station_id, session);
  }

  const stationsWithSessions: StationWithSession[] = ((stations ?? []) as Station[]).map(
    (station) => {
      const active = sessionByStation.get(station.id);
      return {
        ...station,
        activeSession: active
          ? {
              id: active.id,
              customer_id: active.customer_id,
              started_at: active.started_at,
              game_played: active.game_played,
              customer: active.customers,
            }
          : null,
      };
    }
  );

  const fetchError = stationsError?.message ?? sessionsError?.message;

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 border-b border-neutral-800 pb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600/20 ring-1 ring-emerald-500/30">
              <svg
                className="h-5 w-5 text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">
                Station Command Center
              </h1>
              <p className="text-sm text-neutral-500">
                {user
                  ? "Live floor status · sessions update in real time"
                  : "Sign in to manage stations"}
              </p>
            </div>
          </div>

          {!fetchError && stationsWithSessions.length > 0 && (
            <div className="mt-4 flex gap-4 text-sm">
              <span className="text-neutral-400">
                <span className="font-medium text-emerald-400">
                  {stationsWithSessions.filter((s) => s.status === "occupied").length}
                </span>{" "}
                occupied
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">
                <span className="font-medium text-neutral-200">
                  {stationsWithSessions.filter((s) => s.status === "available").length}
                </span>{" "}
                available
              </span>
              <span className="text-neutral-600">·</span>
              <span className="text-neutral-400">
                <span className="font-medium text-neutral-500">
                  {stationsWithSessions.filter((s) => s.status === "maintenance").length}
                </span>{" "}
                maintenance
              </span>
            </div>
          )}
        </header>

        {fetchError && (
          <div className="rounded-lg border border-red-800/50 bg-red-950/30 px-4 py-3 text-sm text-red-300">
            Failed to load stations: {fetchError}
          </div>
        )}

        {!fetchError && stationsWithSessions.length === 0 && (
          <div className="rounded-xl border border-neutral-800 bg-neutral-800/40 px-6 py-16 text-center">
            <p className="text-lg font-medium text-neutral-300">
              No stations found
            </p>
            <p className="mt-2 text-sm text-neutral-500">
              {user
                ? "Add stations in Supabase or check RLS policies for your cafe."
                : "Authenticate as cafe staff to view your stations."}
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
    </div>
  );
}
