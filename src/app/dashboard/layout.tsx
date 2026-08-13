import Link from "next/link";
import LogoutButton from "./components/LogoutButton";

const navGroups = [
  { label: "Operations", items: [
    { href: "/dashboard/stations", label: "Stations" },
    { href: "/dashboard/actions", label: "Actions" },
    { href: "/dashboard/ops-agent", label: "Ops Agent" },
  ]},
  { label: "Customers", items: [
    { href: "/dashboard/clv", label: "Customers" },
    { href: "/dashboard/retention", label: "Retention" },
    { href: "/dashboard/squads", label: "Squads" },
  ]},
  { label: "Growth", items: [
    { href: "/dashboard/battlepass", label: "Battle Pass" },
    { href: "/dashboard/leaderboard", label: "Leaderboard" },
    { href: "/dashboard/coaching", label: "Coaching" },
    { href: "/dashboard/dailyspin", label: "Daily Spin" },
  ]},
  { label: "Revenue", items: [
    { href: "/dashboard/pricing", label: "Pricing" },
  ]},
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <nav className="border-b border-[var(--border)] px-8 py-5">
        <div className="flex items-center justify-between mb-4">
          <Link href="/dashboard/actions" className="text-base font-semibold tracking-tight">
            GameVault
          </Link>
          <LogoutButton />
        </div>
        <div className="flex flex-wrap items-start gap-x-10 gap-y-3">
          {navGroups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              <span className="label opacity-60">{group.label}</span>
              <div className="flex flex-wrap items-center gap-x-4">
                {group.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="text-sm text-[var(--text-dim)] hover:text-[var(--text)] transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
      <main>{children}</main>
    </div>
  );
}
