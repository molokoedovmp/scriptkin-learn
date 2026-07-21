import { createHash, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { sendPasswordResetEmail } from "@/lib/email";

const GENERIC_MESSAGE =
  "Если аккаунт с таким email существует, мы отправили ссылку для восстановления.";

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: false, error: "База данных не настроена." }, { status: 503 });
  }
  let body: { email?: string };
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 }); }
  const email = (body.email ?? "").trim().toLowerCase();
  if (!email || email.length > 320) {
    return NextResponse.json({ ok: false, error: "Укажи корректный email." }, { status: 400 });
  }
  try {
    const { rows } = await getAppPool().query<{ id: string; name: string }>(
      `SELECT id, name FROM users WHERE email = $1`, [email]
    );
    if (rows[0]) {
      const token = randomBytes(32).toString("base64url");
      const tokenHash = createHash("sha256").update(token).digest("hex");
      const client = await getAppPool().connect();
      try {
        await client.query("BEGIN");
        await client.query(`DELETE FROM password_reset_tokens WHERE user_id = $1 AND used_at IS NULL`, [rows[0].id]);
        await client.query(
          `INSERT INTO password_reset_tokens (token_hash, user_id, expires_at)
           VALUES ($1, $2, now() + INTERVAL '1 hour')`,
          [tokenHash, rows[0].id]
        );
        await client.query("COMMIT");
      } catch (error) {
        await client.query("ROLLBACK").catch(() => {});
        throw error;
      } finally { client.release(); }
      await sendPasswordResetEmail(email, rows[0].name, token);
    }
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Password reset request failed:", error);
    return NextResponse.json({ ok: false, error: "Не удалось отправить ссылку. Попробуй позже." }, { status: 500 });
  }
}
