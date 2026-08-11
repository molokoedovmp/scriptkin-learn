import type { NextConfig } from "next";

const siteUrl = (
  process.env.SITE_URL ??
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://scriptkin.ru"
).replace(/\/+$/, "");
const canonicalHost = new URL(siteUrl).hostname;
const escapedCanonicalHost = canonicalHost.replace(/\./g, "\\.");

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    formats: ["image/webp"],
    minimumCacheTTL: 2_678_400,
  },
  async redirects() {
    return [
      {
        source: "/how-it-works",
        destination: "/",
        statusCode: 301,
      },
      {
        source: "/quests/:slug",
        destination: "/stories/:slug",
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [{ type: "host", value: `www\\.${escapedCanonicalHost}` }],
        destination: `${siteUrl}/:path*`,
        statusCode: 301,
      },
      {
        source: "/:path*",
        has: [
          { type: "host", value: escapedCanonicalHost },
          { type: "header", key: "x-forwarded-proto", value: "http" },
        ],
        destination: `${siteUrl}/:path*`,
        statusCode: 301,
      },
    ];
  },
  async headers() {
    const imageCacheHeaders = [
      {
        key: "Cache-Control",
        value: "public, max-age=604800, stale-while-revalidate=2592000",
      },
    ];
    const noIndexHeaders = [
      {
        key: "X-Robots-Tag",
        value: "noindex, nofollow, noarchive",
      },
    ];

    return [
      { source: "/quests/:path*.webp", headers: imageCacheHeaders },
      { source: "/admin/:path*", headers: noIndexHeaders },
      { source: "/account/:path*", headers: noIndexHeaders },
      { source: "/api/:path*", headers: noIndexHeaders },
      { source: "/login", headers: noIndexHeaders },
      { source: "/register", headers: noIndexHeaders },
      { source: "/forgot-password", headers: noIndexHeaders },
      { source: "/reset-password", headers: noIndexHeaders },
      { source: "/verify-email", headers: noIndexHeaders },
      { source: "/payments/:path*", headers: noIndexHeaders },
    ];
  },
};

export default nextConfig;
