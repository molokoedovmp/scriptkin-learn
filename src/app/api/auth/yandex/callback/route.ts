import { NextRequest, NextResponse } from "next/server";
import type { PoolClient } from "pg";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";
import {
  getYandexConfig,
  oauthStateMatches,
  safeReturnTo,
  YANDEX_RETURN_COOKIE,
  YANDEX_STATE_COOKIE,
  YANDEX_VERIFIER_COOKIE,
} from "@/lib/yandex-oauth";

export const dynamic = "force-dynamic";

type YandexProfile = {
  id?: string;
  psuid?: string;
  login?: string;
  display_name?: string;
  real_name?: string;
  first_name?: string;
  last_name?: string;
  default_email?: string;
  emails?: string[];
  default_avatar_id?: string;
  is_avatar_empty?: boolean;
};

function clearOAuthCookies(response: NextResponse) {
  for (const name of [YANDEX_STATE_COOKIE, YANDEX_VERIFIER_COOKIE, YANDEX_RETURN_COOKIE]) {
    response.cookies.set(name, "", { path: "/", maxAge: 0 });
  }
}

function fail(code: string) {
  const response = NextResponse.redirect(absoluteUrl(`/login?oauthError=${encodeURIComponent(code)}`));
  clearOAuthCookies(response);
  return response;
}

function yandexAvatar(profile: YandexProfile) {
  if (profile.is_avatar_empty || !profile.default_avatar_id) return null;
  return `https://avatars.yandex.net/get-yapic/${encodeURIComponent(profile.default_avatar_id)}/islands-200`;
}

function profileName(profile: YandexProfile) {
  const fullName = [profile.first_name, profile.last_name].filter(Boolean).join(" ");
  return (profile.display_name || profile.real_name || fullName || profile.login || "Пользователь Яндекса")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 40);
}

async function uniqueName(client: PoolClient, requested: string, providerId: string) {
  const base = requested.length >= 2 ? requested : "Пользователь Яндекса";
  const { rows } = await client.query<{ name: string }>(
    `SELECT name FROM users
      WHERE lower(regexp_replace(btrim(name), '[[:space:]]+', ' ', 'g')) =
            lower(regexp_replace(btrim($1), '[[:space:]]+', ' ', 'g'))
      LIMIT 1`,
    [base]
  );
  if (rows.length === 0) return base;
  const suffix = ` · ${providerId.slice(-6)}`;
  return `${base.slice(0, Math.max(2, 40 - suffix.length))}${suffix}`;
}

export async function GET(request: NextRequest) {
  if (!isDatabaseConfigured()) return fail("database");
  if (request.nextUrl.searchParams.get("error")) return fail("denied");

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  const expectedState = request.cookies.get(YANDEX_STATE_COOKIE)?.value;
  const verifier = request.cookies.get(YANDEX_VERIFIER_COOKIE)?.value;
  const returnTo = safeReturnTo(request.cookies.get(YANDEX_RETURN_COOKIE)?.value);
  if (!code || !state || !expectedState || !oauthStateMatches(state, expectedState) || !verifier) {
    return fail("invalid_state");
  }

  try {
    const config = getYandexConfig();
    const tokenResponse = await fetch("https://oauth.yandex.ru/token", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: config.redirectUri,
        code_verifier: verifier,
      }),
      cache: "no-store",
    });
    const token = (await tokenResponse.json()) as { access_token?: string; error?: string };
    if (!tokenResponse.ok || !token.access_token) {
      console.error("Yandex token exchange failed:", token.error);
      return fail("token");
    }

    const profileResponse = await fetch("https://login.yandex.ru/info?format=json", {
      headers: { Authorization: `OAuth ${token.access_token}` },
      cache: "no-store",
    });
    const profile = (await profileResponse.json()) as YandexProfile;
    const providerId = profile.id || profile.psuid;
    const email = (profile.default_email || profile.emails?.[0] || "").trim().toLowerCase();
    if (!profileResponse.ok || !providerId || !email) {
      console.error("Yandex profile lacks required id/email.");
      return fail("profile");
    }

    const client = await getAppPool().connect();
    let userId: string;
    try {
      await client.query("BEGIN");
      const linked = await client.query<{ id: string }>(
        `SELECT u.id
           FROM oauth_accounts oa
           JOIN users u ON u.id = oa.user_id
          WHERE oa.provider = 'yandex' AND oa.provider_user_id = $1
          FOR UPDATE OF u`,
        [providerId]
      );

      if (linked.rows[0]) {
        userId = linked.rows[0].id;
        await client.query(
          `UPDATE users SET avatar_url = COALESCE($1, avatar_url), email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $2`,
          [yandexAvatar(profile), userId]
        );
      } else {
        const existing = await client.query<{ id: string }>(
          `SELECT id FROM users WHERE lower(email) = $1 FOR UPDATE`,
          [email]
        );
        if (existing.rows[0]) {
          userId = existing.rows[0].id;
          await client.query(
            `UPDATE users SET avatar_url = COALESCE($1, avatar_url), email_verified_at = COALESCE(email_verified_at, now()) WHERE id = $2`,
            [yandexAvatar(profile), userId]
          );
        } else {
          const name = await uniqueName(client, profileName(profile), providerId);
          const inserted = await client.query<{ id: string }>(
            `INSERT INTO users (email, name, password_hash, avatar_url, pd_consent_at, email_verified_at)
             VALUES ($1, $2, NULL, $3, now(), now()) RETURNING id`,
            [email, name, yandexAvatar(profile)]
          );
          userId = inserted.rows[0].id;
        }
        await client.query(
          `INSERT INTO oauth_accounts (provider, provider_user_id, user_id)
           VALUES ('yandex', $1, $2)
           ON CONFLICT (provider, provider_user_id) DO UPDATE SET updated_at = now()`,
          [providerId, userId]
        );
      }
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    const session = await createSession(userId);
    const response = NextResponse.redirect(absoluteUrl(returnTo));
    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
    clearOAuthCookies(response);
    return response;
  } catch (error) {
    console.error("Yandex OAuth callback failed:", error);
    return fail("server");
  }
}
