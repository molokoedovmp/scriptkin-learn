import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { absoluteUrl } from "./site";

export const YANDEX_STATE_COOKIE = "skr_yandex_state";
export const YANDEX_VERIFIER_COOKIE = "skr_yandex_verifier";
export const YANDEX_RETURN_COOKIE = "skr_yandex_return";
export const YANDEX_CALLBACK_PATH = "/api/auth/yandex/callback";

export function getYandexConfig() {
  const clientId = process.env.YANDEX_CLIENT_ID?.trim();
  const clientSecret = process.env.YANDEX_CLIENT_SECRET?.trim();
  if (!clientId || !clientSecret) {
    throw new Error("YANDEX_CLIENT_ID или YANDEX_CLIENT_SECRET не настроены.");
  }
  return {
    clientId,
    clientSecret,
    redirectUri: absoluteUrl(YANDEX_CALLBACK_PATH),
  };
}

export function oauthRandom(bytes = 32) {
  return randomBytes(bytes).toString("base64url");
}

export function pkceChallenge(verifier: string) {
  return createHash("sha256").update(verifier).digest("base64url");
}

export function oauthStateMatches(actual: string, expected: string) {
  const actualBuffer = Buffer.from(actual);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export function safeReturnTo(value: string | null | undefined) {
  return value?.startsWith("/") && !value.startsWith("//") && !value.includes("\\")
    ? value
    : "/account";
}

export const oauthCookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: 10 * 60,
};
