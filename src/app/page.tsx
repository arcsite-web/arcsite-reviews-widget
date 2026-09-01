import { ALL_SOURCE_ADAPTERS } from "@/lib/sources";

export default function Home() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "3rem 1.5rem" }}>
      <h1>ArcSite Reviews</h1>
      <p>
        <code>GET /api/reviews</code> returns normalized reviews aggregated
        from every configured source. Optional query params:{" "}
        <code>source</code>, <code>minRating</code>, <code>limit</code>.
      </p>
      <p>
        <code>/widget</code> renders the same data as a page (useful for an
        iframe embed or previewing). The embeddable script bundle is served
        from <code>/widget.js</code> — see the README for the embed snippet.
      </p>
      <h2>Sources</h2>
      <ul>
        {ALL_SOURCE_ADAPTERS.map((adapter) => (
          <li key={adapter.id}>{adapter.label}</li>
        ))}
      </ul>
    </main>
  );
}
