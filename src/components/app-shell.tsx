import { Link, useRouter, useRouterState } from "@tanstack/react-router";
import { Home, Smartphone, Wifi, History, User, Shield } from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BrandLockup } from "@/components/brand-logo";
import { isAdmin } from "@/lib/profile.functions";

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
  const a = useServerFn(isAdmin);
  const admin = useQuery({ queryKey: ["isAdmin"], queryFn: () => a(), staleTime: 60_000 });

  useEffect(() => {}, []);

  async function handleLogout() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
        {title ? (
          <span className="font-display text-lg font-bold tracking-tight">{title}</span>
        ) : (
          <BrandLockup size={32} />
        )}
        <div className="flex items-center gap-1">
          {admin.data?.isAdmin && (
            <Link to="/admin" className="rounded-md p-1.5 text-primary transition hover:bg-primary/10" aria-label="Admin">
              <Shield className="h-4 w-4" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:text-foreground"
          >
            Sign out
          </button>
        </div>
      </header>

      <main className="flex-1 px-4 py-4">{children}</main>

      <nav className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border/60 bg-background/80 px-2 pb-[env(safe-area-inset-bottom,0.4rem)] pt-2 shadow-card backdrop-blur-xl">
        <ul className="grid grid-cols-5">
          {TABS.map((t) => {
            const active = pathname === t.to || (t.to !== "/dashboard" && pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[10px] font-medium transition ${
                    active ? "text-primary" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span
                    className={`grid h-9 w-9 place-items-center rounded-xl transition ${
                      active ? "bg-primary/15 scale-105" : ""
                    }`}
                  >
                    <Icon
                      className={`h-5 w-5 transition ${
                        active ? "drop-shadow-[0_0_8px_oklch(0.62_0.24_295/0.8)]" : ""
                      }`}
                    />
                  </span>
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
