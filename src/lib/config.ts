// Identifiers for each ArcSite listing, so real adapters (or a future export/
// partner-API integration) have everything they need without re-deriving it
// from URLs. Override via env vars if these ever change.

export const SOURCES_CONFIG = {
  appStore: {
    appId: process.env.APP_STORE_APP_ID ?? "986274256",
    country: process.env.APP_STORE_COUNTRY ?? "us",
    profileUrl:
      "https://apps.apple.com/us/app/arcsite-quick-cad-floor-plans/id986274256",
  },
  googlePlay: {
    packageId: process.env.GOOGLE_PLAY_PACKAGE_ID ?? "com.arcsite.app.android",
    country: process.env.GOOGLE_PLAY_COUNTRY ?? "us",
    lang: process.env.GOOGLE_PLAY_LANG ?? "en",
    profileUrl:
      "https://play.google.com/store/apps/details?id=com.arcsite.app.android&hl=en_US",
  },
  capterra: {
    productId: "156735",
    slug: "ArcSite",
    profileUrl: "https://www.capterra.com/p/156735/ArcSite/",
  },
  getApp: {
    profileUrl: "https://www.getapp.com/construction-software/a/arcsite/",
  },
  softwareAdvice: {
    profileUrl:
      "https://www.softwareadvice.com/physical-security/arc-site-profile/",
  },
} as const;

/** How long the aggregated reviews cache stays fresh before revalidating. */
export const REVIEWS_CACHE_SECONDS = 6 * 60 * 60; // 6 hours
