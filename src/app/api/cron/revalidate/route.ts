import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import { REVIEWS_CACHE_TAG } from "@/lib/reviews";

// Triggered by Vercel Cron (see vercel.json) to force a fresh pull from all
// review sources ahead of the passive REVIEWS_CACHE_SECONDS expiry.
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  // Called from Vercel Cron, not a Server Action, so there's no `updateTag`
  // available — expire immediately per Next's guidance for external callers.
  revalidateTag(REVIEWS_CACHE_TAG, { expire: 0 });
  return NextResponse.json({ revalidated: true, tag: REVIEWS_CACHE_TAG });
}
