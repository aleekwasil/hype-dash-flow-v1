import { Link, useRouterState } from "@tanstack/react-router";
import { Home, History, User } from "lucide-react";
import type { ReactNode } from "react";

const TABS = [
  { to: "/dashboard", label: "Home", icon: Home },
  { to: "/history", label: "History", icon: History },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function AppShell({ children, title }: { children: ReactNode; title?: string }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col bg-background pb-24">
      {title && (
        <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/50 bg-background/80 px-4 py-3 backdrop-blur-xl">
          <span className="font-display text-lg font-bold tracking-tight">{title}</span>
        </header>
      )}

      <main className="flex-1 px-4 py-4">{children}</main>

      <nav className="fixed bottom-3 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 rounded-2xl border border-border/60 bg-background/80 px-2 pb-[env(safe-area-inset-bottom,0.4rem)] pt-2 shadow-card backdrop-blur-xl">
        <ul className="grid grid-cols-3">
          {TABS.map((t) => {
            const active = pathname === t.to || (t.to !== "/dashboard" && pathname.startsWith(t.to));
            const Icon = t.icon;
            return (
              <li key={t.to}>
                <Link
                  to={t.to}
                  className={`relative flex flex-col items-center gap-1 rounded-xl py-1.5 text-[11px] font-medium transition ${
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
