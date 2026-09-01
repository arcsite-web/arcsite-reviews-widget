import { ReviewsWidget } from "@/components/ReviewsWidget";
import { filterReviews, getCachedReviews } from "@/lib/reviews";

export const metadata = {
  title: "ArcSite Reviews Widget",
};

interface WidgetPageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function WidgetPage({ searchParams }: WidgetPageProps) {
  const params = await searchParams;
  const source = typeof params.source === "string" ? params.source : undefined;
  const minRating = params.minRating ? Number(params.minRating) : undefined;
  const limit = params.limit ? Number(params.limit) : undefined;

  const allReviews = await getCachedReviews();
  const reviews = filterReviews(allReviews, { source, minRating, limit });

  return (
    <main style={{ padding: "1rem" }}>
      <ReviewsWidget reviews={reviews} />
    </main>
  );
}
