import type { NextConfig } from "next";

/**
 * Art in /public is served with `max-age=0` by default, so every visit
 * re-validates every image. These folders hold the site's art and change only
 * when a deploy changes them: a week in the browser, a year on the CDN (which
 * Vercel clears on each deploy), and a day of stale-while-revalidate so a
 * replaced image refreshes in the background rather than blocking a paint.
 *
 * Not `immutable` — the file names carry no content hash, so a replaced image
 * must still be able to reach returning visitors.
 */
const ART_CACHE = "public, max-age=604800, s-maxage=31536000, stale-while-revalidate=86400";

const nextConfig: NextConfig = {
  async headers() {
    return ["/scene/:path*", "/home/:path*", "/mobile/:path*", "/petals/:path*"].map((source) => ({
      source,
      headers: [{ key: "Cache-Control", value: ART_CACHE }],
    }));
  },
};

export default nextConfig;
