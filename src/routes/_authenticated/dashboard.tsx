import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Smartphone,
  Wifi,
  Plus,
  Receipt,
  Shield,
  ArrowRight,
  TrendingUp,
  ArrowDownLeft,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WalletCard } from "@/components/wallet-card";
import { getWallet, getTransactions } from "@/lib/wallet.functions";
import { hasPin } from "@/lib/pin.functions";
import { getProfile } from "@/lib/profile.functions";
import { formatDate, formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HypeData" }] }),
  component: Dashboard,
});

const QUICK = [
  {
    to: "/airtime",
    label: "Buy Airtime",
    desc: "Top up instantly",
    icon: Smartphone,
    iconBg: "from-primary/90 to-primary/60",
  },
  {
    to: "/data",
    label: "Buy Data",
    desc: "All networks",
    icon: Wifi,
    iconBg: "from-accent/90 to-accent/60",
  },
  {
    to: "/fund",
    label: "Deposit",
    desc: "Fund wallet",
    icon: Plus,
    iconBg: "from-success/90 to-success/60",
  },
  {
    to: "/history",
    label: "History",
    desc: "View activity",
    icon: Receipt,
    iconBg: "from-warning/90 to-warning/60",
  },
] as const;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function initials(name?: string | null, email?: string | null) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

function Dashboard() {
  const w = useServerFn(getWallet);
  const t = useServerFn(getTransactions);
  const p = useServerFn(hasPin);
  const pr = useServerFn(getProfile);
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => w() });
  const txns = useQuery({ queryKey: ["txns"], queryFn: () => t() });
  const pin = useQuery({ queryKey: ["hasPin"], queryFn: () => p() });
  const profile = useQuery({ queryKey: ["profile"], queryFn: () => pr() });

  const balance = Number(wallet.data?.balance ?? 0);
  const all = txns.data ?? [];
  const recent = all.slice(0, 5);

  const firstName = (profile.data?.full_name || "").split(" ")[0] || "there";

  const totals = all.reduce(
    (acc, r) => {
      if (r.status !== "success") return acc;
      const amt = Number(r.amount) || 0;
      if (r.type === "wallet_funding") acc.deposits += amt;
      else if (r.type === "airtime") acc.airtime += amt;
      else if (r.type === "data") acc.data += amt;
      return acc;
    },
    { deposits: 0, airtime: 0, data: 0 },
  );

  return (
    <AppShell>
      {/* Header */}
      <header className="mb-5 flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground">{greeting()},</p>
          <h1 className="truncate font-display text-xl font-bold tracking-tight">
            {firstName} 👋
          </h1>
        </div>
        <Link
          to="/profile"
          aria-label="Profile"
          className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-gradient-to-br from-primary to-accent text-sm font-bold text-primary-foreground shadow-glow ring-2 ring-background transition hover:scale-105"
        >
          {initials(profile.data?.full_name, profile.data?.email)}
        </Link>
      </header>

      {/* Wallet */}
      <WalletCard balance={balance} walletId={profile.data?.id} />

      {/* PIN nudge */}
      {pin.data && !pin.data.hasPin && (
        <Link
          to="/pin"
          className="mt-4 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm transition hover:bg-warning/15"
        >
          <Shield className="h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="font-medium text-warning">Set your 4-digit PIN</p>
            <p className="text-xs text-muted-foreground">Required to authorize transactions.</p>
          </div>
          <ArrowRight className="h-4 w-4 text-warning" />
        </Link>
      )}

      {/* Quick actions */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">
          Quick actions
        </h2>
        <div className="grid grid-cols-2 gap-3">
          {QUICK.map((q, i) => (
            <Link
              key={q.to}
              to={q.to}
              style={{ animationDelay: `${i * 60}ms` }}
              className="group animate-fade-in rounded-2xl border border-border/60 bg-card/60 p-4 backdrop-blur transition hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card active:scale-[0.98]"
            >
              <div
                className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${q.iconBg} shadow-glow transition group-hover:scale-110`}
              >
                <q.icon className="h-5 w-5 text-primary-foreground" />
              </div>
              <p className="mt-3 text-sm font-semibold">{q.label}</p>
              <p className="text-xs text-muted-foreground">{q.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Promo banner */}
      <section className="mt-6">
        <div className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent p-4">
          <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent/20 blur-2xl" />
          <div className="relative flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-primary to-accent shadow-glow">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-display text-sm font-semibold">
                Instant delivery, nationwide.
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Enjoy instant airtime and data delivery on all networks.
              </p>
              <Link
                to="/airtime"
                className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground shadow-glow transition hover:scale-[1.03] active:scale-95"
              >
                Buy now <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="mt-6">
        <h2 className="mb-3 font-display text-sm font-semibold text-muted-foreground">
          Your activity
        </h2>
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="Deposits" amount={totals.deposits} icon={ArrowDownLeft} tone="success" />
          <StatCard label="Airtime" amount={totals.airtime} icon={Smartphone} tone="primary" />
          <StatCard label="Data" amount={totals.data} icon={Wifi} tone="accent" />
        </div>
      </section>

      {/* Recent */}
      <section className="mt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-sm font-semibold text-muted-foreground">
            Recent transactions
          </h2>
          <Link to="/history" className="text-xs font-medium text-primary hover:underline">
            See all
          </Link>
        </div>
        {txns.isLoading && (
          <div className="space-y-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-14 animate-pulse rounded-xl bg-card/50" />
            ))}
          </div>
        )}
        {!txns.isLoading && recent.length === 0 && (
          <div className="rounded-xl border border-dashed border-border/60 bg-card/40 p-6 text-center">
            <TrendingUp className="mx-auto mb-2 h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No transactions yet. Buy airtime or data to get started.
            </p>
          </div>
        )}
        <ul className="space-y-2">
          {recent.map((r, i) => {
            const credit = r.type === "wallet_funding";
            return (
              <li
                key={r.id}
                style={{ animationDelay: `${i * 40}ms` }}
                className="flex animate-fade-in items-center gap-3 rounded-xl border border-border/50 bg-card/60 p-3 transition hover:border-primary/30 hover:bg-card"
              >
                <div
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-lg ${
                    credit ? "bg-success/15 text-success" : "bg-primary/10 text-primary"
                  }`}
                >
                  {r.type === "airtime" ? (
                    <Smartphone className="h-5 w-5" />
                  ) : r.type === "data" ? (
                    <Wifi className="h-5 w-5" />
                  ) : (
                    <ArrowDownLeft className="h-5 w-5" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium capitalize">
                    {r.type.replace("_", " ")}
                    {r.network ? ` · ${r.network.toUpperCase()}` : ""}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {formatDate(r.created_at)}
                  </p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-semibold ${credit ? "text-success" : ""}`}>
                    {credit ? "+" : "-"}
                    {formatNaira(r.amount)}
                  </p>
                  <StatusBadge status={r.status} />
                </div>
              </li>
            );
          })}
        </ul>
      </section>
    </AppShell>
  );
}

function StatCard({
  label,
  amount,
  icon: Icon,
  tone,
}: {
  label: string;
  amount: number;
  icon: React.ComponentType<{ className?: string }>;
  tone: "success" | "primary" | "accent";
}) {
  const toneClass =
    tone === "success"
      ? "text-success bg-success/10"
      : tone === "primary"
      ? "text-primary bg-primary/10"
      : "text-accent bg-accent/10";
  return (
    <div className="rounded-2xl border border-border/50 bg-card/60 p-3">
      <div className={`grid h-8 w-8 place-items-center rounded-lg ${toneClass}`}>
        <Icon className="h-4 w-4" />
      </div>
      <p className="mt-2 text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="truncate font-display text-sm font-bold">{formatNaira(amount)}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const tone =
    status === "success"
      ? "bg-success/15 text-success"
      : status === "failed"
      ? "bg-destructive/15 text-destructive"
      : "bg-muted text-muted-foreground";
  return (
    <span
      className={`mt-0.5 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider ${tone}`}
    >
      {status}
    </span>
  );
}
