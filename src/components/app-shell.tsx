import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, Smartphone, Wifi, History, User } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/airtime", label: "Airtime", icon: Smartphone },
  { to: "/data", label: "Data", icon: Wifi },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const router = useRouter();
  const qc = useQueryClient();

  // ensure clean session on protected route mount
  useEffect(() => {
    // nothing — _authenticated layout handles auth gate
  }, []);

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary shadow-glow">
            <span className="text-sm font-bold text-primary-foreground">H</span>
          </div>
          <span className="font-display text-lg font-bold tracking-tight">{title ?? "HypeData"}</span>
        </div>
        <button
          onClick={handleLogout}
          className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
        >
          Sign out
        </button>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      <nav className="fixed bottom-0 left-1/2 z-30 w-full max-w-md -translate-x-1/2 border-t border-border/50 bg-background/95 px-2 pb-[env(safe-area-inset-bottom,0.5rem)] pt-2 backdrop-blur-xl">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = pathname === t.to || (t.to !== "/dashboard" && pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={`flex flex-col items-center gap-1 rounded-lg py-2 text-[11px] font-medium transition ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className={`h-5 w-5 ${active ? "drop-shadow-[0_0_8px_oklch(0.62_0.24_295/0.8)]" : ""}`} />
                  {t.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
