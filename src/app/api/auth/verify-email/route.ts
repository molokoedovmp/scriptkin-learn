import { NextResponse } from "next/server";
import { createSession, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { sendWelcomeEmail } from "@/lib/email";
import { hashEmailVerificationToken } from "@/lib/email-verification";
import { absoluteUrl } from "@/lib/site";

function verificationRedirect(status: string) {
  return NextResponse.redirect(
    absoluteUrl(`/verify-email?status=${encodeURIComponent(status)}`)
  );
}

export async function GET(req: Request) {
  if (!isDatabaseConfigured()) return verificationRedirect("error");

  const token = new URL(req.url).searchParams.get("token") ?? "";
  if (token.length < 20 || token.length > 200) {
    return verificationRedirect("invalid");
  }

  const tokenHash = hashEmailVerificationToken(token);
  const client = await getAppPool().connect();
  let user: { id: string; email: string; name: string } | null = null;

  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{
      user_id: string;
      email: string;
      name: string;
    }>(
      `SELECT token.user_id, users.email, users.name
         FROM email_verification_tokens token
         JOIN users ON users.id = token.user_id
        WHERE token.token_hash = $1
          AND token.used_at IS NULL
          AND token.expires_at > now()
        FOR UPDATE OF token`,
      [tokenHash]
    );

    if (!rows[0]) {
      await client.query("ROLLBACK");
      return verificationRedirect("invalid");
    }

    user = { id: rows[0].user_id, email: rows[0].email, name: rows[0].name };
    await client.query(
      `UPDATE users
          SET email_verified_at = COALESCE(email_verified_at, now())
        WHERE id = $1`,
      [user.id]
    );
    await client.query(
      `UPDATE email_verification_tokens
          SET used_at = now()
        WHERE token_hash = $1`,
      [tokenHash]
    );
    await client.query(
      `DELETE FROM email_verification_tokens
        WHERE user_id = $1 AND token_hash <> $2`,
      [user.id, tokenHash]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Email verification failed:", error);
    return verificationRedirect("error");
  } finally {
    client.release();
  }

  if (!user) return verificationRedirect("error");

  const session = await createSession(user.id);
  sendWelcomeEmail(user.email, user.name).catch((error) =>
    console.error("Welcome email failed:", error)
  );

  const response = verificationRedirect("success");
  response.cookies.set(
    SESSION_COOKIE,
    session.token,
    sessionCookieOptions(session.expiresAt)
  );
  return response;
}
