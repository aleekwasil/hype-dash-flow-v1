import { BRAND } from "@/lib/branding";

/**
 * Brand mark. Replace the inner SVG/markup to swap the logo.
 * Sizes via the `size` prop in pixels (defaults to 32).
 */
export function BrandLogo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <div
      className={`grid place-items-center rounded-xl bg-gradient-primary shadow-glow ${className}`}
      style={{ width: size, height: size }}
      aria-label={`${BRAND.name} logo`}
    >
      <span
        className="font-display font-bold text-primary-foreground"
        style={{ fontSize: size * 0.45 }}
      >
        {BRAND.shortName.charAt(0)}
      </span>
    </div>
  );
}

export function BrandLockup({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      <BrandLogo size={size} />
      <span className="font-display text-lg font-bold tracking-tight">{BRAND.name}</span>
    </div>
  );
}
