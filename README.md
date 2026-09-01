# ArcSite Reviews Widget

Aggregates ArcSite reviews from multiple sources into one normalized API
(`/api/reviews`) and an embeddable widget for arcsite.com.

## Status of each source

| Source | Status |
| --- | --- |
| App Store | **Live.** Pulls from Apple's public customer-reviews RSS feed — no auth needed. |
| Capterra / GetApp / Software Advice | **Live, real data, bulk.** Imported from a CSV exported from the G2 Digital Markets vendor portal. See "Capterra / GetApp / Software Advice import" below. |
| Google Play | **Stub.** Returns `[]`. No public API for reading another app's reviews; needs Play Console access for `com.arcsite.app.android` (official Reviews API) or a decision to scrape the store page (against Google's ToS). |

The Google Play stub lives in [`src/lib/sources/stubs.ts`](src/lib/sources/stubs.ts)
and implements the same `ReviewSourceAdapter` interface as every other
adapter, so wiring up a real integration later is a matter of writing one
`fetchReviews()` function — nothing else in the app needs to change.

## Source badges

Each review card shows the source's real logo instead of a colored text
pill, wherever a logo is available. Logos live in
[`public/logos/`](public/logos) (sourced from ArcSite's Webflow asset
library) and are wired up per source in
[`src/lib/sourceMeta.ts`](src/lib/sourceMeta.ts) — a source with no `logo`
set there just falls back to the colored pill automatically, no code
changes needed elsewhere.

**GetApp still uses the colored pill.** `public/logos/g2.webp` is sitting
in the folder but not wired up in `sourceMeta.ts` — it's G2's corporate
logo, not a GetApp-specific brand mark, so using it for GetApp badges is a
deliberate call to make rather than a default. Wire it up (or swap in a
proper GetApp logo) by adding a `logo` entry for `getapp` in
`sourceMeta.ts`.

## Capterra / GetApp / Software Advice import

G2 Digital Markets (formerly Gartner Digital Markets — the vendor portal
behind Capterra, GetApp, and Software Advice; renamed after G2 acquired it
in Feb 2026) has a self-serve **"Export Reviews"** button on its Reviews
page (`app.g2digitalmarkets.com`), easy to miss next to the pagination
controls. It downloads a CSV with full review text, five sub-ratings, an
NPS-style recommend score, pros/cons, and more — no per-quote manual step,
no unofficial parsing of internal widget markup.

- [`data/gdm-reviews.csv`](data/gdm-reviews.csv) is that exported file,
  committed as project data (it's already-public review content, not a
  secret).
- [`src/lib/sources/gdmExport.ts`](src/lib/sources/gdmExport.ts) parses it
  (`csv-parse`) into normalized reviews at request time (cheap enough not
  to need its own cache layer beyond the shared one in `reviews.ts`).
- The CSV's `Source` column is trusted as the platform of origin — note
  that a review's *display branding* (if you ever generate a one-off quote
  widget from the portal) doesn't always match: one review in this data
  set was rendered as a "GetApp" quote widget despite this export tagging
  its `Source` as "Capterra". GDM syndicates a single submitted review
  across its properties, so this CSV's column is the more authoritative of
  the two.

**This is a static snapshot, not a live feed** — the portal's export has
no automatable/API-backed download, just a button behind your login. To
refresh: click **Export Reviews** again, overwrite `data/gdm-reviews.csv`
with the new file, and redeploy. There's no cron for this source the way
there is for the App Store.

An earlier approach (now removed) parsed the SVG behind the portal's
per-quote iframe embed snippets — that worked, but needed one manually
grabbed snippet id per review and depended on unofficial internal markup.
This CSV import replaced it entirely once the bulk export was found.

## Architecture

- **`src/lib/sources/*`** — one adapter per review source, each returning a
  normalized `NormalizedReview[]` (see `src/lib/types.ts`).
- **`src/lib/reviews.ts`** — fans out to every adapter, merges + sorts
  results, and caches them with Next's data cache (`unstable_cache`, tag
  `reviews`, 6 hour TTL) so a widget load never blocks on the live App
  Store fetch.
- **`src/app/api/reviews/route.ts`** — public `GET /api/reviews` endpoint.
  Query params: `source` (e.g. `app_store`), `minRating`, `limit`. CORS is
  open (`Access-Control-Allow-Origin: *`) since it's read by the embed
  script from a different origin (arcsite.com).
- **`src/app/api/cron/revalidate/route.ts`** — hit by Vercel Cron (see
  `vercel.json`, every 6h) to force a refresh ahead of the passive TTL.
  Protect it by setting a `CRON_SECRET` env var; Vercel sends it
  automatically as a bearer token when calling scheduled functions.
- **`src/app/widget/page.tsx`** — renders the same data as a page (useful
  for previewing, or an iframe embed).
- **`src/widget-embed/index.ts`** → **`public/widget.js`** — the standalone
  embeddable bundle for arcsite.com, built by `npm run build:widget`
  (esbuild, ~4kb minified, no framework dependency). Renders into a shadow
  DOM so host-page styles can't leak in or out.

## Embedding on arcsite.com

```html
<div data-arcsite-reviews data-min-rating="4" data-limit="12"></div>
<script src="https://<deployed-app>/widget.js" async></script>
```

Optional `data-*` attributes on the container: `data-source` (e.g.
`app_store`), `data-min-rating`, `data-limit`, `data-api-base` (override the
API origin — defaults to the script's own origin). Multiple containers on
one page are all initialized automatically. For manual/late init, use
`window.ArcSiteReviews.init(selector, options)`.

## Development

```bash
npm install
npm run dev
```

`npm run dev` and `npm run build` both run `build:widget` first so
`public/widget.js` is always current.

## Environment variables

| Var | Purpose | Default |
| --- | --- | --- |
| `APP_STORE_APP_ID` | Apple app id | `986274256` |
| `APP_STORE_COUNTRY` | Apple storefront | `us` |
| `GOOGLE_PLAY_PACKAGE_ID` | For when Google Play is wired up | `com.arcsite.app.android` |
| `CRON_SECRET` | Verifies calls to `/api/cron/revalidate` | none (unset = unauthenticated) |

## Deploying

Built for Vercel (uses Vercel Cron via `vercel.json`). `next build` /
`vercel deploy` will work as-is; set `CRON_SECRET` in the project's
environment variables before going live.
