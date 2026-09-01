import type { SourceId } from "@/lib/types";

// Shared between the React widget (app/widget) and the standalone embed
// bundle (src/widget-embed) so both render sources identically.
//
// `logo` is a root-relative path under public/logos — served same-origin
// for the React app, and resolved against the embed script's own origin
// for the standalone widget.js bundle (see src/widget-embed/index.ts).
// Sources without a logo fall back to a colored text pill.
export const SOURCE_META: Record<SourceId, { label: string; color: string; logo?: string }> = {
  app_store: { label: "App Store", color: "#0d96f6", logo: "/logos/app-store.webp" },
  google_play: { label: "Google Play", color: "#00c04b", logo: "/logos/play-store.webp" },
  capterra: { label: "Capterra", color: "#ff9d28", logo: "/logos/capterra.png" },
  getapp: { label: "GetApp", color: "#0075db" },
  software_advice: {
    label: "Software Advice",
    color: "#e02020",
    logo: "/logos/software-advice.svg",
  },
};
