import { absoluteUrl, SITE_URL } from "@/lib/site";

export const dynamic = "force-static";

export function GET() {
  const trackingParams = [
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
    "yclid",
    "from",
    "ref",
  ].join("&");

  const rules = [
    "User-agent: Yandex",
    "Allow: /",
    "Allow: /stories/",
    "Disallow: /api/",
    "Disallow: /admin/",
    `Clean-param: ${trackingParams} /`,
    "Clean-param: tag /community",
    "",
    "User-agent: *",
    "Allow: /",
    "Allow: /stories/",
    "Disallow: /api/",
    "Disallow: /admin/",
    "",
    `Sitemap: ${absoluteUrl("/sitemap.xml")}`,
    `# Main host: ${SITE_URL}`,
    "",
  ].join("\n");

  return new Response(rules, {
    headers: {
      "Cache-Control": "public, max-age=3600, s-maxage=86400",
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
