/**
 * 🎨 BRANDING CONFIGURATION
 * ─────────────────────────
 * Single source of truth for app name, tagline, and brand mark.
 *
 * To rebrand the app, edit the values below. Related files:
 *   • Colors / theme    → src/styles.css         (look for `:root { --primary ... }`)
 *   • Favicon           → public/favicon.ico     (replace the file in place)
 *   • Social share img  → src/routes/__root.tsx  (`og:image` meta tag)
 *   • Logo svg/png      → swap <BrandLogo /> in src/components/brand-logo.tsx
 */
export const BRAND = {
  name: "HypeData",
  tagline: "Airtime & Data, Instantly.",
  shortName: "HD",
  supportEmail: "support@hypedata.app",
  currency: "NGN",
  currencySymbol: "₦",
} as const;
