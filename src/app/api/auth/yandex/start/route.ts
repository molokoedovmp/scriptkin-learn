import { NextRequest, NextResponse } from "next/server";
import {
  getYandexConfig,
  oauthCookieOptions,
  oauthRandom,
  pkceChallenge,
  safeReturnTo,
  YANDEX_RETURN_COOKIE,
  YANDEX_STATE_COOKIE,
  YANDEX_VERIFIER_COOKIE,
} from "@/lib/yandex-oauth";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  let config: ReturnType<typeof getYandexConfig>;
  try {
    config = getYandexConfig();
  } catch (error) {
    console.error("Yandex OAuth is not configured:", error);
    return NextResponse.redirect(absoluteUrl("/login?oauthError=not_configured"));
  }

  const state = oauthRandom();
  const verifier = oauthRandom(48);
  const returnTo = safeReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const authorizeUrl = new URL("https://oauth.yandex.ru/authorize");
  authorizeUrl.searchParams.set("response_type", "code");
  authorizeUrl.searchParams.set("client_id", config.clientId);
  authorizeUrl.searchParams.set("redirect_uri", config.redirectUri);
  authorizeUrl.searchParams.set("state", state);
  authorizeUrl.searchParams.set("code_challenge", pkceChallenge(verifier));
  authorizeUrl.searchParams.set("code_challenge_method", "S256");

  const response = NextResponse.redirect(authorizeUrl);
  response.cookies.set(YANDEX_STATE_COOKIE, state, oauthCookieOptions);
  response.cookies.set(YANDEX_VERIFIER_COOKIE, verifier, oauthCookieOptions);
  response.cookies.set(YANDEX_RETURN_COOKIE, returnTo, oauthCookieOptions);
  return response;
}
