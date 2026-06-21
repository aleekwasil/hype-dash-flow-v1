import { useState } from "react";
import { Eye, EyeOff, Plus, ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatNaira } from "@/lib/format";

export function WalletCard({ balance }: { balance: number }) {
  const [show, setShow] = useState(true);
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-card p-5 text-white shadow-glow">
      <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="absolute -bottom-16 -left-10 h-40 w-40 rounded-full bg-accent/30 blur-3xl" />
      <div className="relative flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-white/70">Wallet balance</p>
          <div className="mt-2 flex items-center gap-2">
            <p className="font-display text-3xl font-bold tracking-tight">
              {show ? formatNaira(balance) : "₦ • • • • •"}
            </p>
            <button
              onClick={() => setShow((s) => !s)}
              className="rounded-full p-1 text-white/80 hover:bg-white/10"
              aria-label="Toggle balance"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>
      <div className="relative mt-5 flex gap-2">
        <Link
          to="/fund"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/15 px-3 py-2.5 text-sm font-medium backdrop-blur transition hover:scale-[1.02] hover:bg-white/25 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Deposit
        </Link>
        <Link
          to="/history"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-medium backdrop-blur transition hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]"
        >
          <ArrowUpRight className="h-4 w-4" /> History
        </Link>
      </div>
    </div>
  );
}
