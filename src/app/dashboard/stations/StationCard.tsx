"use client";

import { useEffect, useState, useTransition } from "react";
import type { Station } from "@/lib/types/database";
import { endSession, startSession } from "./actions";

const GAME_OPTIONS = [
  "Valorant",
  "Counter-Strike 2",
  "League of Legends",
  "Fortnite",
  "GTA V",
  "FIFA",
  "Call of Duty",
  "Apex Legends",
  "Minecraft",
  "Other",
] as const;

export type ActiveSessionInfo = {
  id: string;
  started_at: string;
  game_played: string | null;
  customer: {
    name: string | null;
    phone: string;
  } | null;
};

export type StationWithSession = Station & {
  activeSession: ActiveSessionInfo | null;
};

const TIER_STYLES: Record<Station["tier"], string> = {
  standard: "bg-neutral-700 text-neutral-200",
  premium: "bg-blue-900/80 text-blue-200 border border-blue-700/50",
  rtx4090: "bg-purple-900/80 text-purple-200 border border-purple-600/50",
  console: "bg-amber-900/80 text-amber-200 border border-amber-700/50",
};

function formatElapsed(startedAt: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return [hours, minutes, seconds]
    .map((n) => String(n).padStart(2, "0"))
    .join(":");
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(startedAt));

  useEffect(() => {
    setElapsed(formatElapsed(startedAt));
    const interval = setInterval(() => {
      setElapsed(formatElapsed(startedAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt]);

  return (
    <span className="font-mono text-2xl font-semibold tracking-wider text-emerald-400 tabular-nums">
      {elapsed}
    </span>
  );
}

export function StationCard({ station }: { station: StationWithSession }) {
  const [showStartForm, setShowStartForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [game, setGame] = useState<string>(GAME_OPTIONS[0]);
  const [customGame, setCustomGame] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isMaintenance = station.status === "maintenance";
  const isOccupied = station.status === "occupied" && station.activeSession;
  const gameName = game === "Other" ? customGame : game;

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    startTransition(async () => {
      const result = await startSession(station.id, phone, gameName);
      if (!result.success) {
        setError(result.error);
        return;
      }
      setShowStartForm(false);
      setPhone("");
      setGame(GAME_OPTIONS[0]);
      setCustomGame("");
    });
  }

  function handleEnd() {
    if (!station.activeSession) return;
    setError(null);

    startTransition(async () => {
      const result = await endSession(station.activeSession!.id);
      if (!result.success) {
        setError(result.error);
      }
    });
  }

  const cardBorder = isMaintenance
    ? "border-neutral-700/50 opacity-50"
    : isOccupied
      ? "border-emerald-500/60 shadow-[0_0_24px_rgba(16,185,129,0.15)]"
      : "border-neutral-700/80";

  return (
    <article
      className={`flex flex-col rounded-xl border bg-neutral-800/60 p-5 backdrop-blur-sm transition-shadow ${cardBorder}`}
    >
      <header className="mb-4 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">
            {station.label}
          </h2>
          {station.gpu_model && (
            <p className="mt-0.5 text-xs text-neutral-500">{station.gpu_model}</p>
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium uppercase tracking-wide ${TIER_STYLES[station.tier]}`}
        >
          {station.tier}
        </span>
      </header>

      {isMaintenance && (
        <div className="flex flex-1 flex-col items-center justify-center py-8 text-center">
          <div className="mb-2 text-neutral-500">
            <svg
              className="mx-auto h-8 w-8"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
              />
            </svg>
          </div>
          <p className="text-sm font-medium text-neutral-400">
            Under Maintenance
          </p>
        </div>
      )}

      {isOccupied && station.activeSession && (
        <div className="flex flex-1 flex-col gap-4">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Live
            </span>
          </div>

          <LiveTimer startedAt={station.activeSession.started_at} />

          <div className="space-y-1 text-sm">
            <p className="text-neutral-300">
              {station.activeSession.customer?.name ?? "Walk-in"}{" "}
              <span className="text-neutral-500">
                · {station.activeSession.customer?.phone ?? "—"}
              </span>
            </p>
            <p className="text-neutral-400">
              Playing{" "}
              <span className="text-neutral-200">
                {station.activeSession.game_played ?? "Unknown"}
              </span>
            </p>
          </div>

          <button
            type="button"
            onClick={handleEnd}
            disabled={isPending}
            className="mt-auto w-full rounded-lg border border-red-800/60 bg-red-950/40 px-4 py-2.5 text-sm font-medium text-red-300 transition hover:bg-red-900/50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Ending…" : "End Session"}
          </button>
        </div>
      )}

      {!isMaintenance && !isOccupied && (
        <div className="flex flex-1 flex-col gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-neutral-500">
              Hourly Rate
            </p>
            <p className="text-2xl font-semibold text-neutral-100">
              ₹{station.base_hourly_rate}
              <span className="text-sm font-normal text-neutral-500">/hr</span>
            </p>
          </div>

          {!showStartForm ? (
            <button
              type="button"
              onClick={() => {
                setError(null);
                setShowStartForm(true);
              }}
              disabled={isPending}
              className="mt-auto w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Start Session
            </button>
          ) : (
            <form onSubmit={handleStart} className="mt-auto space-y-3">
              <div>
                <label
                  htmlFor={`phone-${station.id}`}
                  className="mb-1 block text-xs text-neutral-400"
                >
                  Customer phone
                </label>
                <input
                  id={`phone-${station.id}`}
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  required
                  className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label
                  htmlFor={`game-${station.id}`}
                  className="mb-1 block text-xs text-neutral-400"
                >
                  Game
                </label>
                <select
                  id={`game-${station.id}`}
                  value={game}
                  onChange={(e) => setGame(e.target.value)}
                  className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                >
                  {GAME_OPTIONS.map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              {game === "Other" && (
                <input
                  type="text"
                  value={customGame}
                  onChange={(e) => setCustomGame(e.target.value)}
                  placeholder="Enter game name"
                  required
                  className="w-full rounded-lg border border-neutral-600 bg-neutral-900 px-3 py-2 text-sm text-neutral-100 placeholder:text-neutral-600 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowStartForm(false);
                    setError(null);
                  }}
                  disabled={isPending}
                  className="flex-1 rounded-lg border border-neutral-600 px-3 py-2 text-sm text-neutral-400 transition hover:bg-neutral-700/50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isPending}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending ? "Starting…" : "Confirm"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-red-400" role="alert">
          {error}
        </p>
      )}
    </article>
  );
}
