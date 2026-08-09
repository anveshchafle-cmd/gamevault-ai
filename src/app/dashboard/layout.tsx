import Link from "next/link";
import LogoutButton from "./components/LogoutButton";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100">
      <nav className="border-b border-neutral-800 px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <span className="font-bold text-emerald-400">GameVault AI</span>
          <Link href="/dashboard/actions" className="text-sm text-emerald-400 hover:text-emerald-300 transition font-medium">
            🎯 Actions
          </Link>
          <Link href="/dashboard/stations" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Stations
          </Link>
          <Link href="/dashboard/retention" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Retention
          </Link>
          <Link href="/dashboard/battlepass" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Battle Pass
          </Link>
          <Link href="/dashboard/leaderboard" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Leaderboard
          </Link>
          <Link href="/dashboard/squads" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Squads
          </Link>
          <Link href="/dashboard/pricing" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Pricing
          </Link>
          <Link href="/dashboard/clv" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Customers
          </Link>
          <Link href="/dashboard/coaching" className="text-sm text-neutral-400 hover:text-neutral-100 transition">
            Coaching
          </Link>
        </div>
        <LogoutButton />
      </nav>
      <main>{children}</main>
    </div>
  );
}
