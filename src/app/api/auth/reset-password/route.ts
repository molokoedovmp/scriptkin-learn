import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { createSession, hashPassword, SESSION_COOKIE, sessionCookieOptions } from "@/lib/auth";
import { getAppPool } from "@/lib/db";

export async function POST(req: Request) {
  let body: { token?: string; password?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 }); }
  const token = body.token ?? "";
  const password = body.password ?? "";
  if (token.length < 20 || token.length > 200) {
    return NextResponse.json({ ok: false, error: "Ссылка восстановления недействительна." }, { status: 400 });
  }
  if (password.length < 8 || password.length > 200) {
    return NextResponse.json({ ok: false, error: "Пароль должен содержать от 8 до 200 символов." }, { status: 400 });
  }
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const passwordHash = await hashPassword(password);
  const client = await getAppPool().connect();
  let userId = "";
  try {
    await client.query("BEGIN");
    const { rows } = await client.query<{ user_id: string }>(
      `SELECT user_id FROM password_reset_tokens
        WHERE token_hash = $1 AND used_at IS NULL AND expires_at > now()
        FOR UPDATE`, [tokenHash]
    );
    if (!rows[0]) {
      await client.query("ROLLBACK");
      return NextResponse.json({ ok: false, error: "Ссылка истекла или уже была использована." }, { status: 400 });
    }
    userId = rows[0].user_id;
    await client.query(`UPDATE users SET password_hash = $1 WHERE id = $2`, [passwordHash, userId]);
    await client.query(`UPDATE password_reset_tokens SET used_at = now() WHERE token_hash = $1`, [tokenHash]);
    await client.query(`DELETE FROM sessions WHERE user_id = $1`, [userId]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Password reset failed:", error);
    return NextResponse.json({ ok: false, error: "Не удалось изменить пароль." }, { status: 500 });
  } finally { client.release(); }

  const session = await createSession(userId);
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions(session.expiresAt));
  return response;
}
