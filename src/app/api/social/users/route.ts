import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAppPool } from "@/lib/db";

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
  }

  const query = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if ((query.length > 0 && query.length < 2) || query.length > 100) {
    return NextResponse.json({ ok: true, users: [] });
  }

  try {
    const { rows } = await getAppPool().query<{
      id: string;
      name: string;
      joinedAt: string;
    }>(
      `SELECT u.id,
              u.name,
              u.created_at::text AS "joinedAt"
         FROM users u
        WHERE u.id <> $1
          AND ($2 = '' OR u.name ILIKE '%' || $2 || '%' OR lower(u.email) = lower($2))
          AND NOT EXISTS (
            SELECT 1 FROM friendships f
             WHERE (f.requester_id = $1 AND f.addressee_id = u.id)
                OR (f.addressee_id = $1 AND f.requester_id = u.id)
          )
        ORDER BY CASE WHEN $2 <> '' AND lower(u.name) = lower($2) THEN 0 ELSE 1 END,
                 u.created_at DESC,
                 u.name
        LIMIT 12`,
      [user.id, query]
    );
    return NextResponse.json({ ok: true, users: rows });
  } catch (error) {
    console.error("User search failed:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось выполнить поиск." },
      { status: 500 }
    );
  }
}
