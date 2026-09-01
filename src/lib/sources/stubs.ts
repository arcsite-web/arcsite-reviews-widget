import { SOURCES_CONFIG } from "@/lib/config";
import type { NormalizedReview, ReviewSourceAdapter, SourceId } from "@/lib/types";

/**
 * Placeholder adapters for sources with no public reviews API and no
 * vendor-portal access yet.
 *
 * Capterra, GetApp, and Software Advice are all G2 Digital Markets
 * properties (formerly Gartner Digital Markets) — see
 * src/lib/sources/gdmExport.ts, which is real, not a stub.
 *
 * Google Play has no public endpoint for reading another app's reviews;
 * the official Play Developer API is OAuth-gated to the app's own owner.
 */
function makeStubAdapter(id: SourceId, label: string, note: string): ReviewSourceAdapter {
  return {
    id,
    label,
    async fetchReviews(): Promise<NormalizedReview[]> {
      console.warn(`[${id}] not yet implemented: ${note}`);
      return [];
    },
  };
}

export const googlePlayAdapter = makeStubAdapter(
  "google_play",
  "Google Play",
  `no public reviews endpoint for ${SOURCES_CONFIG.googlePlay.packageId}; needs Play Console API access or a decision to scrape.`,
);
