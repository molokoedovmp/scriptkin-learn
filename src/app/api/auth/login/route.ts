import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import {
  createSession,
  verifyPassword,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/lib/auth";

/**
 * POST /api/auth/login — вход по email и паролю.
 */
export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена (DATABASE_URL)." },
      { status: 503 }
    );
  }

  let body: { email?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON." },
      { status: 400 }
    );
  }

  const email = (body.email ?? "").trim().toLowerCase();
  const password = body.password ?? "";
  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Укажи email и пароль." },
      { status: 400 }
    );
  }

  try {
    const { rows } = await getAppPool().query<{
      id: string;
      name: string;
      password_hash: string;
    }>(`SELECT id, name, password_hash FROM users WHERE email = $1`, [email]);

    const valid =
      rows.length > 0 && (await verifyPassword(password, rows[0].password_hash));
    if (!valid) {
      return NextResponse.json(
        { ok: false, error: "Неверный email или пароль." },
        { status: 401 }
      );
    }

    const session = await createSession(rows[0].id);
    const res = NextResponse.json({
      ok: true,
      user: { id: rows[0].id, email, name: rows[0].name },
    });
    res.cookies.set(
      SESSION_COOKIE,
      session.token,
      sessionCookieOptions(session.expiresAt)
    );
    return res;
  } catch (err) {
    console.error("Login failed:", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось войти. Попробуй позже." },
      { status: 500 }
    );
  }
}
