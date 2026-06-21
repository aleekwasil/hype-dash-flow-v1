import type { Network } from "@/lib/networks";

const STYLES: Record<Network, { bg: string; fg: string; label: string; sub?: string }> = {
  mtn:     { bg: "#FFCC00", fg: "#000000", label: "MTN" },
  airtel:  { bg: "#E40000", fg: "#FFFFFF", label: "airtel" },
  glo:     { bg: "#00B140", fg: "#FFFFFF", label: "glo" },
  "9mobile": { bg: "#006E3C", fg: "#9FCC3B", label: "9", sub: "mobile" },
};

/** Brand-faithful network mark (color + wordmark). */
export function NetworkLogo({ network, size = 40 }: { network: Network; size?: number }) {
  const s = STYLES[network];
  return (
    <div
      className="grid place-items-center rounded-xl font-bold shadow-sm"
      style={{
        width: size,
        height: size,
        background: s.bg,
        color: s.fg,
        fontSize: network === "9mobile" ? size * 0.5 : size * 0.32,
        letterSpacing: network === "mtn" ? "0.02em" : "-0.01em",
        fontFamily: "system-ui, -apple-system, Segoe UI, sans-serif",
      }}
      aria-label={`${network} logo`}
    >
      {network === "9mobile" ? (
        <span style={{ lineHeight: 1 }}>
          9<span style={{ fontSize: size * 0.18, color: "#FFFFFF", marginLeft: 1 }}>mobile</span>
        </span>
      ) : (
        s.label
      )}
    </div>
  );
}
