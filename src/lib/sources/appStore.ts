import { SOURCES_CONFIG } from "@/lib/config";
import type { NormalizedReview, ReviewSourceAdapter } from "@/lib/types";

// Apple publishes a public, unauthenticated RSS feed of App Store reviews
// per app id. No API key required. Docs: https://developer.apple.com/library/archive/documentation/LanguagesUtilities/Conceptual/iTunesSearchAPI/
const FEED_URL = (appId: string, country: string) =>
  `https://itunes.apple.com/${country}/rss/customerreviews/page=1/id=${appId}/sortby=mostrecent/json`;

interface AppleFeedLabel {
  label?: string;
}

interface AppleFeedEntry {
  id?: AppleFeedLabel;
  author?: { name?: AppleFeedLabel; uri?: AppleFeedLabel };
  "im:rating"?: AppleFeedLabel;
  title?: AppleFeedLabel;
  content?: AppleFeedLabel;
  updated?: AppleFeedLabel;
}

interface AppleFeedResponse {
  feed?: {
    entry?: AppleFeedEntry | AppleFeedEntry[];
  };
}

function asArray<T>(value: T | T[] | undefined): T[] {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
}

export const appStoreAdapter: ReviewSourceAdapter = {
  id: "app_store",
  label: "App Store",
  async fetchReviews(): Promise<NormalizedReview[]> {
    const { appId, country } = SOURCES_CONFIG.appStore;
    const url = FEED_URL(appId, country);

    let json: AppleFeedResponse;
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        // Revalidation is handled by the caller (lib/reviews.ts); avoid
        // double-caching at the fetch layer.
        cache: "no-store",
      });
      if (!res.ok) {
        console.warn(`[appStore] feed request failed: ${res.status}`);
        return [];
      }
      json = await res.json();
    } catch (err) {
      console.warn("[appStore] failed to fetch/parse reviews feed", err);
      return [];
    }

    const entries = asArray(json.feed?.entry).filter(
      // The feed's first "entry" is the app itself when there are reviews;
      // real reviews always carry a rating.
      (entry) => entry["im:rating"]?.label !== undefined,
    );

    return entries.map((entry, index) => {
      const rating = Number(entry["im:rating"]?.label ?? 0);
      const idLabel = entry.id?.label ?? `${appId}-${index}`;
      return {
        id: `app_store:${idLabel}`,
        source: "app_store",
        sourceLabel: "App Store",
        author: entry.author?.name?.label ?? "Anonymous",
        rating: Number.isFinite(rating) ? rating : 0,
        title: entry.title?.label,
        body: entry.content?.label ?? "",
        date: entry.updated?.label ?? new Date(0).toISOString(),
        url: SOURCES_CONFIG.appStore.profileUrl,
      };
    });
  },
};
