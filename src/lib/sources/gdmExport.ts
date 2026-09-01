import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { parse } from "csv-parse/sync";
import { SOURCES_CONFIG } from "@/lib/config";
import type { NormalizedReview, ReviewSourceAdapter, SourceId } from "@/lib/types";

/**
 * Imports the "Export Reviews" CSV from the G2 Digital Markets vendor
 * portal (app.g2digitalmarkets.com → Reviews → Export Reviews). Unlike the
 * per-quote snippet trick this replaced, this is a real bulk export with
 * full review text, sub-ratings, pros/cons, and hundreds of rows at once —
 * no per-quote manual step at all.
 *
 * This is a static, manually-refreshed file, not a live feed: the portal
 * has no automatable download endpoint (it's a button behind your login),
 * so there's nothing for this app to poll. To refresh: click "Export
 * Reviews" in the portal again, overwrite data/gdm-reviews.csv with the
 * new file, and redeploy.
 */

const CSV_PATH = join(process.cwd(), "data", "gdm-reviews.csv");

interface GdmExportRow {
  "Review Date": string;
  Source: string;
  "Reviewer Name": string;
  Title: string;
  "Overall Quality": string;
  "Review Title": string;
  Comments: string;
  Pros: string;
  Cons: string;
}

const SOURCE_LABEL_TO_ID: Record<string, SourceId> = {
  capterra: "capterra",
  getapp: "getapp",
  "software advice": "software_advice",
};

const PROFILE_URL_BY_SOURCE: Partial<Record<SourceId, string>> = {
  capterra: SOURCES_CONFIG.capterra.profileUrl,
  getapp: SOURCES_CONFIG.getApp.profileUrl,
  software_advice: SOURCES_CONFIG.softwareAdvice.profileUrl,
};

function stableId(source: SourceId, date: string, reviewer: string, title: string): string {
  const hash = createHash("sha1").update(`${date}|${reviewer}|${title}`).digest("hex").slice(0, 12);
  return `${source}:csv-${hash}`;
}

function toReview(row: GdmExportRow): NormalizedReview | null {
  const sourceLabel = row.Source?.trim();
  const source = SOURCE_LABEL_TO_ID[sourceLabel?.toLowerCase()];
  if (!source) {
    console.warn(`[gdmExport] unrecognized Source "${sourceLabel}", skipping row`);
    return null;
  }

  const reviewerName = row["Reviewer Name"]?.trim() || "Anonymous";
  const role = row.Title?.trim();
  const author = role ? `${reviewerName} — ${role}` : reviewerName;

  const rating = parseFloat(row["Overall Quality"]);

  const body =
    row.Comments?.trim() ||
    [row.Pros?.trim(), row.Cons?.trim()].filter(Boolean).join(" ") ||
    "(no written comments)";

  const date = new Date(row["Review Date"]);

  return {
    id: stableId(source, row["Review Date"], reviewerName, row["Review Title"]),
    source,
    sourceLabel,
    author,
    rating: Number.isFinite(rating) ? rating : 0,
    title: row["Review Title"]?.trim() || undefined,
    body,
    date: Number.isNaN(date.getTime()) ? new Date(0).toISOString() : date.toISOString(),
    url: PROFILE_URL_BY_SOURCE[source],
  };
}

export const gdmExportAdapter: ReviewSourceAdapter = {
  id: "gdm_export",
  label: "G2 Digital Markets export (Capterra / GetApp / Software Advice)",
  async fetchReviews(): Promise<NormalizedReview[]> {
    let raw: string;
    try {
      raw = readFileSync(CSV_PATH, "utf-8");
    } catch (err) {
      console.warn(`[gdmExport] couldn't read ${CSV_PATH}`, err);
      return [];
    }

    const rows = parse(raw, { columns: true, skip_empty_lines: true }) as GdmExportRow[];
    return rows.map(toReview).filter((r): r is NormalizedReview => r !== null);
  },
};
