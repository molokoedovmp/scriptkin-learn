import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAppPool } from "@/lib/db";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
  }

  let body: { action?: string; targetUserId?: string; friendshipId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 });
  }

  try {
    if (body.action === "request") {
      const targetUserId = body.targetUserId ?? "";
      if (!UUID_RE.test(targetUserId) || targetUserId === user.id) {
        return NextResponse.json({ ok: false, error: "Некорректный пользователь." }, { status: 400 });
      }
      const { rowCount } = await getAppPool().query(
        `INSERT INTO friendships (requester_id, addressee_id)
         SELECT $1, id FROM users WHERE id = $2
         ON CONFLICT DO NOTHING`,
        [user.id, targetUserId]
      );
      if (!rowCount) {
        return NextResponse.json(
          { ok: false, error: "Запрос уже отправлен или пользователь не найден." },
          { status: 409 }
        );
      }
      return NextResponse.json({ ok: true });
    }

    const friendshipId = body.friendshipId ?? "";
    if (!UUID_RE.test(friendshipId)) {
      return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
    }

    if (body.action === "accept") {
      const { rowCount } = await getAppPool().query(
        `UPDATE friendships
            SET status = 'accepted', updated_at = now()
          WHERE id = $1 AND addressee_id = $2 AND status = 'pending'`,
        [friendshipId, user.id]
      );
      if (!rowCount) return forbidden();
      return NextResponse.json({ ok: true });
    }

    if (body.action === "decline") {
      const { rowCount } = await getAppPool().query(
        `DELETE FROM friendships
          WHERE id = $1 AND status = 'pending'
            AND (requester_id = $2 OR addressee_id = $2)`,
        [friendshipId, user.id]
      );
      if (!rowCount) return forbidden();
      return NextResponse.json({ ok: true });
    }

    if (body.action === "remove") {
      const { rowCount } = await getAppPool().query(
        `DELETE FROM friendships
          WHERE id = $1 AND status = 'accepted'
            AND (requester_id = $2 OR addressee_id = $2)`,
        [friendshipId, user.id]
      );
      if (!rowCount) return forbidden();
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ ok: false, error: "Неизвестное действие." }, { status: 400 });
  } catch (error) {
    console.error("Friend action failed:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось изменить список друзей." },
      { status: 500 }
    );
  }
}

function forbidden() {
  return NextResponse.json(
    { ok: false, error: "Запрос не найден или уже обработан." },
    { status: 404 }
  );
}
