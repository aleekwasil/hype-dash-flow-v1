import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Smartphone, Wifi, Plus, Receipt, Shield } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { WalletCard } from "@/components/wallet-card";
import { getWallet, getTransactions } from "@/lib/wallet.functions";
import { hasPin } from "@/lib/pin.functions";
import { formatDate, formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — HypeData" }] }),
  component: Dashboard,
});

const QUICK = [
  { to: "/airtime", label: "Airtime", icon: Smartphone, color: "from-primary to-accent" },
  { to: "/data", label: "Data", icon: Wifi, color: "from-accent to-primary" },
  { to: "/fund", label: "Fund", icon: Plus, color: "from-primary to-primary" },
  { to: "/history", label: "History", icon: Receipt, color: "from-accent to-accent" },
] as const;

function Dashboard() {
  const w = useServerFn(getWallet);
  const t = useServerFn(getTransactions);
  const p = useServerFn(hasPin);
  const wallet = useQuery({ queryKey: ["wallet"], queryFn: () => w() });
  const txns = useQuery({ queryKey: ["txns"], queryFn: () => t() });
  const pin = useQuery({ queryKey: ["hasPin"], queryFn: () => p() });

  const balance = Number(wallet.data?.balance ?? 0);
  const recent = (txns.data ?? []).slice(0, 5);

  return (
    <AppShell>
      <WalletCard balance={balance} />

      {pin.data && !pin.data.hasPin && (
        <Link to="/pin" className="mt-4 flex items-center gap-3 rounded-xl border border-warning/40 bg-warning/10 p-3 text-sm">
          <Shield className="h-5 w-5 text-warning" />
          <div className="flex-1">
            <p className="font-medium text-warning">Set your 4-digit PIN</p>
            <p className="text-xs text-muted-foreground">Required to authorize transactions.</p>
          </div>
        </Link>
      )}

      <div className="mt-6 grid grid-cols-4 gap-3">
        {QUICK.map((q) => (
          <Link key={q.to} to={q.to} className="flex flex-col items-center gap-2">
            <div className={`grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br ${q.color} shadow-glow`}>
              <q.icon className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-xs text-muted-foreground">{q.label}</span>
          </Link>
        ))}
      </div>

      <section className="mt-8">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold">Recent activity</h2>
          <Link to="/history" className="text-xs text-primary hover:underline">See all</Link>
        </div>
        {txns.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!txns.isLoading && recent.length === 0 && (
          <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center text-sm text-muted-foreground">
            No transactions yet. Buy airtime or data to get started.
          </div>
        )}
        <ul className="space-y-2">
          {recent.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border border-border/50 bg-card/50 p-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                {r.type === "airtime" ? <Smartphone className="h-5 w-5" /> :
                 r.type === "data" ? <Wifi className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize">
                  {r.type.replace("_", " ")} {r.network ? `· ${r.network.toUpperCase()}` : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">{formatDate(r.created_at)}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-semibold ${r.type === "wallet_funding" ? "text-success" : ""}`}>
                  {r.type === "wallet_funding" ? "+" : "-"}{formatNaira(r.amount)}
                </p>
                <p className={`text-[10px] uppercase tracking-wider ${
                  r.status === "success" ? "text-success" :
                  r.status === "failed" ? "text-destructive" : "text-muted-foreground"
                }`}>{r.status}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
