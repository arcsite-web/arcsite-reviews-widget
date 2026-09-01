import { unstable_cache } from "next/cache";
import { REVIEWS_CACHE_SECONDS } from "@/lib/config";
import { ALL_SOURCE_ADAPTERS } from "@/lib/sources";
import type { NormalizedReview } from "@/lib/types";

export const REVIEWS_CACHE_TAG = "reviews";

async function fetchAllReviews(): Promise<NormalizedReview[]> {
  const results = await Promise.allSettled(
    ALL_SOURCE_ADAPTERS.map((adapter) => adapter.fetchReviews()),
  );

  const reviews: NormalizedReview[] = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") {
      reviews.push(...result.value);
    } else {
      console.warn(
        `[reviews] source "${ALL_SOURCE_ADAPTERS[index].id}" threw`,
        result.reason,
      );
    }
  });

  return reviews.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  );
}

/**
 * Cached across requests/instances via Next's data cache. Refreshes every
 * REVIEWS_CACHE_SECONDS, or on-demand via revalidateTag(REVIEWS_CACHE_TAG)
 * (see app/api/cron/revalidate/route.ts).
 */
export const getCachedReviews = unstable_cache(fetchAllReviews, ["all-reviews"], {
  tags: [REVIEWS_CACHE_TAG],
  revalidate: REVIEWS_CACHE_SECONDS,
});

export interface ReviewsQuery {
  source?: string;
  minRating?: number;
  limit?: number;
}

export function filterReviews(
  reviews: NormalizedReview[],
  query: ReviewsQuery,
): NormalizedReview[] {
  let filtered = reviews;

  if (query.source) {
    filtered = filtered.filter((r) => r.source === query.source);
  }
  if (query.minRating !== undefined) {
    filtered = filtered.filter((r) => r.rating >= query.minRating!);
  }
  if (query.limit !== undefined) {
    filtered = filtered.slice(0, query.limit);
  }

  return filtered;
}
