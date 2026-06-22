import { useState } from "react";
import { Eye, EyeOff, Plus, ArrowUpRight, Copy, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { formatNaira } from "@/lib/format";

export function WalletCard({ balance, walletId }: { balance: number; walletId?: string }) {
  const [show, setShow] = useState(true);
  const [copied, setCopied] = useState(false);
  const shortId = walletId ? `HD-${walletId.replace(/-/g, "").slice(0, 10).toUpperCase()}` : "HD-••••••";

  async function copyId() {
    if (!walletId) return;
    try {
      await navigator.clipboard.writeText(shortId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-card p-6 text-white shadow-glow">
      <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-12 h-48 w-48 rounded-full bg-accent/30 blur-3xl" />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06]"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
          backgroundSize: "18px 18px",
        }}
      />

      <div className="relative flex items-center justify-between">
        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-white/70">
          Wallet balance
        </p>
        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider backdrop-blur">
          NGN
        </span>
      </div>

      <div className="relative mt-3 flex items-end gap-2">
        <p className="font-display text-4xl font-bold leading-none tracking-tight">
          {show ? formatNaira(balance) : "₦ • • • • •"}
        </p>
        <button
          onClick={() => setShow((s) => !s)}
          className="mb-1 rounded-full p-1 text-white/80 transition hover:bg-white/10"
          aria-label="Toggle balance"
        >
          {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>

      <button
        onClick={copyId}
        className="relative mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-mono tracking-wide text-white/85 backdrop-blur transition hover:bg-white/15"
      >
        <span>{shortId}</span>
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      </button>

      <div className="relative mt-5 flex gap-2">
        <Link
          to="/fund"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/20 px-3 py-2.5 text-sm font-semibold backdrop-blur transition hover:scale-[1.02] hover:bg-white/30 active:scale-[0.98]"
        >
          <Plus className="h-4 w-4" /> Deposit
        </Link>
        <Link
          to="/history"
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white/10 px-3 py-2.5 text-sm font-semibold backdrop-blur transition hover:scale-[1.02] hover:bg-white/20 active:scale-[0.98]"
        >
          <ArrowUpRight className="h-4 w-4" /> History
        </Link>
      </div>
    </div>
  );
}
