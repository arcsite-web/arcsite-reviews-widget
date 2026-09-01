export type SourceId =
  | "app_store"
  | "google_play"
  | "capterra"
  | "getapp"
  | "software_advice";

export interface NormalizedReview {
  /** Stable unique id, namespaced by source: `${source}:${sourceReviewId}` */
  id: string;
  source: SourceId;
  sourceLabel: string;
  author: string;
  rating: number; // 1-5
  title?: string;
  body: string;
  /** ISO 8601 */
  date: string;
  /** Link back to the original review or listing */
  url?: string;
  verified?: boolean;
}

export interface ReviewSourceAdapter {
  /** Identifies the adapter itself for logs/UI — not necessarily a single SourceId, since one adapter (e.g. gdmExport) can emit reviews tagged with several. */
  id: string;
  label: string;
  /** Returns [] and logs a warning if the source isn't wired up yet or the fetch fails. */
  fetchReviews(): Promise<NormalizedReview[]>;
}
