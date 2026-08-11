import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { sendEmailVerificationEmail } from "@/lib/email";
import { issueEmailVerificationToken } from "@/lib/email-verification";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register — регистрация по email и паролю.
 * Создаёт неподтверждённый аккаунт и отправляет одноразовую ссылку.
 */
export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена (DATABASE_URL)." },
      { status: 503 }
    );
  }

  let body: {
    email?: string;
    name?: string;
    password?: string;
    pdConsent?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const name = (body.name ?? "").trim().replace(/\s+/g, " ");
  const password = body.password ?? "";

  if (!EMAIL_RE.test(email)) {
    return NextResponse.json(
      { ok: false, error: "Укажи корректный email." },
      { status: 400 }
    );
  }
  if (name.length < 2 || name.length > 40) {
    return NextResponse.json(
      { ok: false, error: "Никнейм должен содержать от 2 до 40 символов." },
      { status: 400 }
    );
  }
  if (password.length < 8) {
    return NextResponse.json(
      { ok: false, error: "Пароль должен быть не короче 8 символов." },
      { status: 400 }
    );
  }
  // 152-ФЗ: регистрация возможна только с согласием на обработку ПД
  if (body.pdConsent !== true) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Для регистрации необходимо принять пользовательское соглашение и дать согласие на обработку персональных данных.",
      },
      { status: 400 }
    );
  }

  try {
    const passwordHash = await hashPassword(password);
    const client = await getAppPool().connect();
    let userId = "";
    let verificationToken = "";
    try {
      await client.query("BEGIN");
      const { rows } = await client.query<{ id: string }>(
        `INSERT INTO users (
           email, name, password_hash, pd_consent_at, email_verified_at
         ) VALUES ($1, $2, $3, now(), NULL)
         RETURNING id`,
        [email, name, passwordHash]
      );
      userId = rows[0].id;
      verificationToken = await issueEmailVerificationToken(client, userId);
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK").catch(() => {});
      throw error;
    } finally {
      client.release();
    }

    const emailSent = await sendEmailVerificationEmail(
      email,
      name,
      verificationToken
    );

    return NextResponse.json({
      ok: true,
      requiresEmailVerification: true,
      emailSent,
      message: emailSent
        ? "Мы отправили ссылку подтверждения. Она действует 24 часа."
        : "Аккаунт создан, но письмо не удалось отправить. Нажми «Отправить ещё раз».",
      user: { id: userId, email, name },
    });
  } catch (err) {
    // 23505 — нарушение уникальности никнейма или email
    const dbError = err as { code?: string; constraint?: string };
    if (dbError.code === "23505") {
      if (dbError.constraint === "users_name_unique") {
        return NextResponse.json(
          { ok: false, error: "Этот никнейм уже занят." },
          { status: 409 }
        );
      }
      return NextResponse.json(
        { ok: false, error: "Этот email уже зарегистрирован." },
        { status: 409 }
      );
    }
    console.error("Registration failed:", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось создать аккаунт. Попробуй позже." },
      { status: 500 }
    );
  }
}
