import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Smartphone, Wifi, Plus } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { getTransactions } from "@/lib/wallet.functions";
import { formatDate, formatNaira } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/history")({
  head: () => ({ meta: [{ title: "History — HypeData" }] }),
  component: History,
});

function History() {
  const fn = useServerFn(getTransactions);
  const q = useQuery({ queryKey: ["txns"], queryFn: () => fn() });
  const list = q.data ?? [];

  return (
    <AppShell title="History">
      {q.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
      {!q.isLoading && list.length === 0 && (
        <div className="rounded-xl border border-border/50 bg-card/50 p-6 text-center text-sm text-muted-foreground">
          No transactions yet.
        </div>
      )}
      <ul className="space-y-2">
        {list.map((r) => (
          <li key={r.id} className="rounded-xl border border-border/50 bg-card/50 p-3">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary/10 text-primary">
                {r.type === "airtime" ? <Smartphone className="h-5 w-5" /> :
                 r.type === "data" ? <Wifi className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium capitalize">
                  {r.type.replace("_", " ")} {r.network ? `· ${r.network.toUpperCase()}` : ""} {r.plan_label ? `· ${r.plan_label}` : ""}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {r.recipient ? `${r.recipient} · ` : ""}{formatDate(r.created_at)}
                </p>
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
            </div>
            <p className="mt-2 truncate font-mono text-[10px] text-muted-foreground">{r.reference}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
