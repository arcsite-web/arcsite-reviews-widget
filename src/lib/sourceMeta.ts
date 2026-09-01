import type { SourceId } from "@/lib/types";

// Shared between the React widget (app/widget) and the standalone embed
// bundle (src/widget-embed) so both render sources identically.
export const SOURCE_META: Record<SourceId, { label: string; color: string }> = {
  app_store: { label: "App Store", color: "#0d96f6" },
  google_play: { label: "Google Play", color: "#00c04b" },
  capterra: { label: "Capterra", color: "#ff9d28" },
  getapp: { label: "GetApp", color: "#0075db" },
  software_advice: { label: "Software Advice", color: "#e02020" },
};
