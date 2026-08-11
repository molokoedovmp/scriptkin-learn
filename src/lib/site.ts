const configuredSiteUrl =
  process.env.NEXT_PUBLIC_SITE_URL?.trim() || "https://scriptkin.ru";

export const SITE_URL = configuredSiteUrl.replace(/\/+$/, "");

export function absoluteUrl(path = "/") {
  return new URL(path, `${SITE_URL}/`).toString();
}
