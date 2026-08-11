import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { sendEmailVerificationEmail } from "@/lib/email";
import { issueEmailVerificationToken } from "@/lib/email-verification";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GENERIC_MESSAGE =
  "Если аккаунт существует и ещё не подтверждён, мы отправили новую ссылку.";

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена." },
      { status: 503 }
    );
  }

  let body: { email?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  if (!EMAIL_RE.test(email) || email.length > 320) {
    return NextResponse.json(
      { ok: false, error: "Укажи корректный email." },
      { status: 400 }
    );
  }

  try {
    const { rows } = await getAppPool().query<{
      id: string;
      name: string;
      email_verified_at: string | null;
      recently_sent: boolean;
    }>(
      `SELECT u.id, u.name, u.email_verified_at,
              EXISTS (
                SELECT 1
                  FROM email_verification_tokens token
                 WHERE token.user_id = u.id
                   AND token.created_at > now() - INTERVAL '1 minute'
              ) AS recently_sent
         FROM users u
        WHERE u.email = $1`,
      [email]
    );
    const user = rows[0];

    // Одинаковый ответ не раскрывает наличие аккаунта. Минутная пауза
    // предотвращает многократную отправку писем одной кнопкой.
    if (!user || user.email_verified_at || user.recently_sent) {
      return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
    }

    const client = await getAppPool().connect();
    let token = "";
    try {
      await client.query("BEGIN");
      token = await issueEmailVerificationToken(client, user.id);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    await sendEmailVerificationEmail(email, user.name, token);
    return NextResponse.json({ ok: true, message: GENERIC_MESSAGE });
  } catch (error) {
    console.error("Resend verification failed:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось отправить письмо. Попробуй позже." },
      { status: 500 }
    );
  }
}
