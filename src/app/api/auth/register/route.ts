import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import {
  createSession,
  hashPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";
import { sendWelcomeEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/auth/register — регистрация по email и паролю.
 * Сразу создаёт сессию и ставит httpOnly-cookie.
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
    const { rows } = await getAppPool().query<{ id: string }>(
      `INSERT INTO users (email, name, password_hash, pd_consent_at)
       VALUES ($1, $2, $3, now())
       RETURNING id`,
      [email, name, passwordHash]
    );

    // Приветственное письмо — не блокирует ответ и не ломает регистрацию
    sendWelcomeEmail(email, name).catch((err) =>
      console.error("Welcome email failed:", err)
    );

    const session = await createSession(rows[0].id);
    const res = NextResponse.json({
      ok: true,
      user: { id: rows[0].id, email, name },
    });
    res.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session.expiresAt)
    );
    return res;
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
