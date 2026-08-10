"use client";

import { useEffect, useState, useTransition } from "react";
import type { Station } from "@/lib/types/database";
import { endSession, startSession } from "./actions";
import { fetchUpsellSuggestion, logUpsellSale } from "./upsellActions";
import type { UpsellSuggestion } from "@/lib/upsell/engine";

const GAME_OPTIONS = [
  "Valorant", "Counter-Strike 2", "League of Legends", "Fortnite", "GTA V",
  "FIFA", "Call of Duty", "Apex Legends", "Minecraft", "Other",
] as const;

export type ActiveSessionInfo = {
  id: string;
  customer_id: string | null;
  started_at: string;
  game_played: string | null;
  customer: { name: string | null; phone: string } | null;
};

export type StationWithSession = Station & {
  activeSession: ActiveSessionInfo | null;
};

const TIER_LABEL: Record<Station["tier"], string> = {
  standard: "Standard",
  premium: "Premium",
  rtx4090: "RTX 4090",
  console: "Console",
};

function formatElapsed(startedAt: string): string {
  const elapsedMs = Math.max(0, Date.now() - new Date(startedAt).getTime());
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((n) => String(n).padStart(2, "0")).join(":");
}

function LiveTimer({ startedAt }: { startedAt: string }) {
  const [elapsed, setElapsed] = useState(() => formatElapsed(startedAt));
  useEffect(() => {
    setElapsed(formatElapsed(startedAt));
    const interval = setInterval(() => setElapsed(formatElapsed(startedAt)), 1000);
    return () => clearInterval(interval);
  }, [startedAt]);
  return <span className="font-stat text-3xl font-semibold tracking-tight">{elapsed}</span>;
}

export function StationCard({ station }: { station: StationWithSession }) {
  const [showStartForm, setShowStartForm] = useState(false);
  const [phone, setPhone] = useState("");
  const [game, setGame] = useState<string>(GAME_OPTIONS[0]);
  const [customGame, setCustomGame] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [upsell, setUpsell] = useState<UpsellSuggestion | null>(null);
  const [upsellLoading, setUpsellLoading] = useState(false);
  const [upsellLogged, setUpsellLogged] = useState(false);

  async function handleFetchUpsell() {
    if (!station.activeSession?.customer_id) return;
    setUpsellLoading(true);
    const suggestion = await fetchUpsellSuggestion(station.activeSession.customer_id);
    setUpsell(suggestion);
    setUpsellLoading(false);
  }

  async function handleLogUpsell() {
    if (!station.activeSession?.customer_id || !upsell) return;
    await logUpsellSale(
      station.cafe_id, station.activeSession.customer_id,
      station.activeSession.id, upsell.itemName, upsell.suggestedPrice
    );
    setUpsellLogged(true);
  }

  const isMaintenance = station.status === "maintenance";
  const isOccupied = station.status === "occupied" && station.activeSession;
  const gameName = game === "Other" ? customGame : game;

  function handleStart(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await startSession(station.id, phone, gameName);
      if (!result.success) { setError(result.error); return; }
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
      if (!result.success) setError(result.error);
    });
  }

  return (
    <article className={`surface rounded-lg p-6 flex flex-col ${isOccupied ? "surface-active" : ""} ${isMaintenance ? "opacity-40" : ""}`}>
      <header className="flex items-start justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold tracking-tight">{station.label}</h2>
          {station.gpu_model && <p className="text-sm text-[var(--text-dim)] mt-0.5">{station.gpu_model}</p>}
        </div>
        <span className="label">{TIER_LABEL[station.tier]}</span>
      </header>

      {isMaintenance && (
        <div className="flex-1 flex items-center justify-center py-10">
          <p className="label">Under Maintenance</p>
        </div>
      )}

      {isOccupied && station.activeSession && (
        <div className="flex-1 flex flex-col gap-5">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)]" />
            <span className="label text-[var(--accent)]">Live</span>
          </div>

          <LiveTimer startedAt={station.activeSession.started_at} />

          <div className="text-sm space-y-0.5">
            <p>{station.activeSession.customer?.name ?? "Walk-in"}
              <span className="text-[var(--text-dim)]"> &middot; {station.activeSession.customer?.phone ?? "—"}</span>
            </p>
            <p className="text-[var(--text-dim)]">{station.activeSession.game_played ?? "Unknown"}</p>
          </div>

          <div className="pt-4 border-t border-[var(--border)]">
            {!upsell && (
              <button
                type="button" onClick={handleFetchUpsell} disabled={upsellLoading}
                className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors disabled:opacity-50"
              >
                {upsellLoading ? "Checking…" : "Suggest upsell"}
              </button>
            )}
            {upsell && !upsellLogged && (
              <div className="space-y-2">
                <p className="text-sm">{upsell.itemName} &mdash; ₹{upsell.suggestedPrice}</p>
                <p className="text-xs text-[var(--text-dim)]">{upsell.reason}</p>
                <button onClick={handleLogUpsell} className="btn-outline rounded px-3 py-1.5 text-xs">
                  Add to bill
                </button>
              </div>
            )}
            {upsellLogged && <p className="text-sm text-[var(--ok)]">Added to bill</p>}
          </div>

          <button
            type="button" onClick={handleEnd} disabled={isPending}
            className="mt-auto w-full rounded border border-[var(--danger)] text-[var(--danger)] py-2.5 text-sm font-medium transition hover:bg-[var(--danger)]/10 disabled:opacity-50"
          >
            {isPending ? "Ending…" : "End Session"}
          </button>
        </div>
      )}

      {!isMaintenance && !isOccupied && (
        <div className="flex-1 flex flex-col gap-5">
          <div>
            <p className="label mb-1">Hourly Rate</p>
            <p className="font-stat text-2xl font-semibold">
              ₹{station.base_hourly_rate}<span className="text-sm text-[var(--text-dim)] font-normal">/hr</span>
            </p>
          </div>

          {!showStartForm ? (
            <button
              type="button" onClick={() => { setError(null); setShowStartForm(true); }} disabled={isPending}
              className="mt-auto w-full btn-primary rounded py-2.5 text-sm disabled:opacity-50"
            >
              Start Session
            </button>
          ) : (
            <form onSubmit={handleStart} className="mt-auto space-y-3">
              <div>
                <label className="label block mb-1.5">Customer phone</label>
                <input
                  type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210" required
                  className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              </div>
              <div>
                <label className="label block mb-1.5">Game</label>
                <select
                  value={game} onChange={(e) => setGame(e.target.value)}
                  className="w-full rounded border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                >
                  {GAME_OPTIONS.map((g) => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
              {game === "Other" && (
                <input
                  type="text" value={customGame} onChange={(e) => setCustomGame(e.target.value)}
                  placeholder="Enter game name" required
                  className="w-full rounded border border-[var(--border)] bg-transparent px-3 py-2 text-sm focus:border-[var(--accent)] focus:outline-none"
                />
              )}
              <div className="flex gap-2">
                <button
                  type="button" onClick={() => { setShowStartForm(false); setError(null); }} disabled={isPending}
                  className="flex-1 btn-outline rounded py-2 text-sm disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit" disabled={isPending}
                  className="flex-1 btn-primary rounded py-2 text-sm disabled:opacity-50"
                >
                  {isPending ? "Starting…" : "Confirm"}
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {error && <p className="mt-3 text-xs text-[var(--danger)]">{error}</p>}
    </article>
  );
}
