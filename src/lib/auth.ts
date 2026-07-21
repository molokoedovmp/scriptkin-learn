import { randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { cookies } from "next/headers";
import { getAppPool, isDatabaseConfigured } from "./db";
import type { SessionUser } from "./types";

const scrypt = promisify(scryptCb) as (
  password: string,
  salt: string,
  keylen: number
) => Promise<Buffer>;

export const SESSION_COOKIE = "sq_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 дней

// --- Пароли: scrypt со случайной солью, формат "salt:hash" -----------------

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}

export async function verifyPassword(
  password: string,
  stored: string
): Promise<boolean> {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(hash, "hex");
  return (
    actual.length === expected.length && timingSafeEqual(actual, expected)
  );
}

// --- Сессии ----------------------------------------------------------------

export interface NewSession {
  token: string;
  expiresAt: Date;
}

export async function createSession(userId: string): Promise<NewSession> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);
  await getAppPool().query(
    `INSERT INTO sessions (token, user_id, expires_at) VALUES ($1, $2, $3)`,
    [token, userId, expiresAt]
  );
  return { token, expiresAt };
}

export async function destroySession(token: string): Promise<void> {
  await getAppPool().query(`DELETE FROM sessions WHERE token = $1`, [token]);
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  };
}

/**
 * Текущий пользователь по cookie сессии. Возвращает null, если
 * не залогинен, сессия истекла или база недоступна.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  // cookies() — первым: это помечает страницу как динамическую,
  // иначе без DATABASE_URL на этапе сборки страница пререндерится.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !isDatabaseConfigured()) return null;

  try {
    const { rows } = await getAppPool().query<SessionUser>(
      `SELECT u.id, u.email, u.name, u.bio
         FROM sessions s
         JOIN users u ON u.id = s.user_id
        WHERE s.token = $1 AND s.expires_at > now()`,
      [token]
    );
    return rows[0] ?? null;
  } catch (err) {
    console.error("Failed to load session:", err);
    return null;
  }
}
