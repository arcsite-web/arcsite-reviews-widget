import { SOURCE_META } from "@/lib/sourceMeta";
import type { NormalizedReview } from "@/lib/types";

/**
 * Standalone embeddable widget. Bundled by esbuild (see package.json
 * "build:widget") into public/widget.js as a single self-executing script
 * with no framework dependency, so it can be dropped into any page:
 *
 *   <div data-arcsite-reviews data-min-rating="4" data-limit="12"></div>
 *   <script src="https://<this-app>/widget.js" async></script>
 *
 * Renders inside a shadow root so host-page CSS can't leak in or out.
 */

interface WidgetOptions {
  apiBase: string;
  source?: string;
  minRating?: number;
  limit?: number;
}

const STYLES = `
  :host { all: initial; }
  * { box-sizing: border-box; }
  .widget {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    font-family: system-ui, -apple-system, "Segoe UI", sans-serif;
    color: #1a1a1a;
  }
  .card {
    border: 1px solid #e5e5e5;
    border-radius: 12px;
    padding: 1rem 1.25rem;
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    background: #fff;
  }
  .card-header { display: flex; align-items: center; justify-content: space-between; gap: 0.5rem; }
  .stars { color: #f5a623; letter-spacing: 1px; font-size: 0.9rem; }
  .source-badge { font-size: 0.7rem; font-weight: 600; padding: 0.15rem 0.5rem; border-radius: 999px; color: #fff; white-space: nowrap; }
  .title { font-weight: 600; font-size: 0.95rem; margin: 0; }
  .body { font-size: 0.875rem; line-height: 1.4; color: #444; margin: 0; display: -webkit-box; -webkit-line-clamp: 4; -webkit-box-orient: vertical; overflow: hidden; }
  .footer { display: flex; align-items: center; justify-content: space-between; font-size: 0.75rem; color: #777; margin-top: auto; }
  .footer a { color: inherit; }
  .empty, .error { color: #777; font-size: 0.9rem; font-family: system-ui, sans-serif; }
`;

function stars(rating: number): string {
  const rounded = Math.round(rating);
  return "★".repeat(rounded) + "☆".repeat(Math.max(0, 5 - rounded));
}

function formatDate(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(value: string): string {
  const div = document.createElement("div");
  div.textContent = value;
  return div.innerHTML;
}

function renderReviews(reviews: NormalizedReview[]): string {
  if (reviews.length === 0) {
    return `<p class="empty">No reviews to show yet.</p>`;
  }

  const cards = reviews
    .map((review) => {
      const meta = SOURCE_META[review.source];
      const titleHtml = review.title
        ? `<p class="title">${escapeHtml(review.title)}</p>`
        : "";
      const linkHtml = review.url
        ? `<a href="${escapeHtml(review.url)}" target="_blank" rel="noopener noreferrer">Read more</a>`
        : "";
      return `
        <article class="card">
          <div class="card-header">
            <span class="stars" aria-label="${review.rating} out of 5 stars">${stars(review.rating)}</span>
            <span class="source-badge" style="background:${meta.color}">${escapeHtml(meta.label)}</span>
          </div>
          ${titleHtml}
          <p class="body">${escapeHtml(review.body)}</p>
          <div class="footer">
            <span>${escapeHtml(review.author)} · ${formatDate(review.date)}</span>
            ${linkHtml}
          </div>
        </article>`;
    })
    .join("");

  return `<div class="widget">${cards}</div>`;
}

interface ReviewsResponse {
  reviews: NormalizedReview[];
}

async function fetchData(options: WidgetOptions): Promise<ReviewsResponse> {
  const url = new URL("/api/reviews", options.apiBase);
  if (options.source) url.searchParams.set("source", options.source);
  if (options.minRating !== undefined)
    url.searchParams.set("minRating", String(options.minRating));
  if (options.limit !== undefined) url.searchParams.set("limit", String(options.limit));

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
}

function mountShadowRoot(container: HTMLElement): ShadowRoot {
  const existing = container.shadowRoot;
  if (existing) return existing;
  return container.attachShadow({ mode: "open" });
}

async function renderInto(container: HTMLElement, options: WidgetOptions) {
  const root = mountShadowRoot(container);
  root.innerHTML = `<style>${STYLES}</style><p class="empty">Loading reviews…</p>`;

  try {
    const { reviews } = await fetchData(options);
    root.innerHTML = `<style>${STYLES}</style>${renderReviews(reviews)}`;
  } catch (err) {
    console.error("[ArcSiteReviews] failed to load reviews", err);
    root.innerHTML = `<style>${STYLES}</style><p class="error">Couldn't load reviews right now.</p>`;
  }
}

function optionsFromElement(el: HTMLElement, defaultApiBase: string): WidgetOptions {
  return {
    apiBase: el.dataset.apiBase || defaultApiBase,
    source: el.dataset.source || undefined,
    minRating: el.dataset.minRating ? Number(el.dataset.minRating) : undefined,
    limit: el.dataset.limit ? Number(el.dataset.limit) : undefined,
  };
}

function getDefaultApiBase(): string {
  const script = document.currentScript as HTMLScriptElement | null;
  if (script?.src) return new URL(script.src).origin;
  return window.location.origin;
}

function autoInit() {
  const defaultApiBase = getDefaultApiBase();
  const containers = document.querySelectorAll<HTMLElement>("[data-arcsite-reviews]");
  containers.forEach((container) => {
    void renderInto(container, optionsFromElement(container, defaultApiBase));
  });
}

declare global {
  interface Window {
    ArcSiteReviews?: {
      init: (selector: string, options?: Partial<WidgetOptions>) => void;
    };
  }
}

window.ArcSiteReviews = {
  init(selector: string, options: Partial<WidgetOptions> = {}) {
    const defaultApiBase = getDefaultApiBase();
    document.querySelectorAll<HTMLElement>(selector).forEach((container) => {
      void renderInto(container, {
        ...optionsFromElement(container, defaultApiBase),
        ...options,
        apiBase: options.apiBase || optionsFromElement(container, defaultApiBase).apiBase,
      });
    });
  },
};

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoInit);
} else {
  autoInit();
}
