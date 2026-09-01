import { SOURCE_META } from "@/lib/sourceMeta";
import type { NormalizedReview } from "@/lib/types";
import styles from "./ReviewsWidget.module.css";

function Stars({ rating }: { rating: number }) {
  const rounded = Math.round(rating);
  return (
    <span className={styles.stars} aria-label={`${rating} out of 5 stars`}>
      {"★".repeat(rounded)}
      {"☆".repeat(Math.max(0, 5 - rounded))}
    </span>
  );
}

function formatDate(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function SourceBadge({ source }: { source: NormalizedReview["source"] }) {
  const meta = SOURCE_META[source];
  if (meta.logo) {
    // eslint-disable-next-line @next/next/no-img-element -- fixed-size brand logo, not a page image
    return <img className={styles.sourceLogo} src={meta.logo} alt={meta.label} />;
  }
  return (
    <span className={styles.sourceBadge} style={{ background: meta.color }}>
      {meta.label}
    </span>
  );
}

export function ReviewsWidget({ reviews }: { reviews: NormalizedReview[] }) {
  if (reviews.length === 0) {
    return <p className={styles.empty}>No reviews to show yet.</p>;
  }

  return (
    <div className={styles.widget}>
      {reviews.map((review) => {
        return (
          <article key={review.id} className={styles.card}>
            <div className={styles.cardHeader}>
              <Stars rating={review.rating} />
              <SourceBadge source={review.source} />
            </div>
            {review.title && <p className={styles.title}>{review.title}</p>}
            <p className={styles.body}>{review.body}</p>
            <div className={styles.footer}>
              <span>
                {review.author} · {formatDate(review.date)}
              </span>
              {review.url && (
                <a href={review.url} target="_blank" rel="noopener noreferrer">
                  Read more
                </a>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
