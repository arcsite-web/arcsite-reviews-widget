import { NextRequest, NextResponse } from "next/server";
import { filterReviews, getCachedReviews } from "@/lib/reviews";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  const source = searchParams.get("source") ?? undefined;
  const minRatingParam = searchParams.get("minRating");
  const limitParam = searchParams.get("limit");

  const minRating = minRatingParam ? Number(minRatingParam) : undefined;
  const limit = limitParam ? Number(limitParam) : undefined;

  if (minRatingParam && Number.isNaN(minRating)) {
    return NextResponse.json(
      { error: "minRating must be a number" },
      { status: 400 },
    );
  }
  if (limitParam && Number.isNaN(limit)) {
    return NextResponse.json({ error: "limit must be a number" }, { status: 400 });
  }

  const allReviews = await getCachedReviews();
  const reviews = filterReviews(allReviews, { source, minRating, limit });

  return NextResponse.json(
    { reviews, count: reviews.length, total: allReviews.length },
    {
      headers: {
        // CORS: this API is fetched by the embeddable script from arcsite.com
        // (a different origin than wherever this app is deployed).
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
      },
    },
  );
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}
