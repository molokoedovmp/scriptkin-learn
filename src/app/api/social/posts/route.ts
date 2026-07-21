import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAppPool } from "@/lib/db";
import { normalizePostTags } from "@/lib/post-tags";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: { content?: string; tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 });
  }

  const content = (body.content ?? "").trim();
  const tags = normalizePostTags(body.tags);
  if (content.length < 1 || content.length > 5000) {
    return NextResponse.json(
      { ok: false, error: "Пост должен содержать от 1 до 5000 символов." },
      { status: 400 }
    );
  }
  if (!tags) {
    return NextResponse.json({ ok: false, error: "Можно выбрать не больше трёх тегов." }, { status: 400 });
  }

  try {
    const { rows } = await getAppPool().query<{
      id: string;
      content: string;
      tags: string[];
      createdAt: Date;
    }>(
      `INSERT INTO user_posts (user_id, content, tags)
       VALUES ($1, $2, $3)
       RETURNING id, content, tags, created_at AS "createdAt"`,
      [user.id, content, tags]
    );
    return NextResponse.json({
      ok: true,
      post: {
        ...rows[0],
        createdAt: rows[0].createdAt.toISOString(),
        authorId: user.id,
        authorName: user.name,
        isOwn: true,
      },
    });
  } catch (error) {
    console.error("Post creation failed:", error);
    return NextResponse.json({ ok: false, error: "Не удалось опубликовать пост." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: { postId?: string; content?: string; tags?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 });
  }

  const postId = body.postId ?? "";
  const content = (body.content ?? "").trim();
  const tags = normalizePostTags(body.tags);
  if (!UUID_RE.test(postId)) {
    return NextResponse.json({ ok: false, error: "Некорректный пост." }, { status: 400 });
  }
  if (content.length < 1 || content.length > 5000) {
    return NextResponse.json(
      { ok: false, error: "Пост должен содержать от 1 до 5000 символов." },
      { status: 400 }
    );
  }
  if (!tags) {
    return NextResponse.json({ ok: false, error: "Можно выбрать не больше трёх тегов." }, { status: 400 });
  }

  try {
    const { rows } = await getAppPool().query<{
      id: string;
      content: string;
      tags: string[];
      createdAt: Date;
    }>(
      `UPDATE user_posts
          SET content = $1, tags = $2, updated_at = now()
        WHERE id = $3 AND user_id = $4
        RETURNING id, content, tags, created_at AS "createdAt"`,
      [content, tags, postId, user.id]
    );
    if (!rows[0]) {
      return NextResponse.json({ ok: false, error: "Пост не найден." }, { status: 404 });
    }
    return NextResponse.json({
      ok: true,
      post: {
        ...rows[0],
        createdAt: rows[0].createdAt.toISOString(),
        authorId: user.id,
        authorName: user.name,
        isOwn: true,
      },
    });
  } catch (error) {
    console.error("Post update failed:", error);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить публикацию." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return unauthorized();

  let body: { postId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 });
  }
  if (!UUID_RE.test(body.postId ?? "")) {
    return NextResponse.json({ ok: false, error: "Некорректный пост." }, { status: 400 });
  }

  const { rowCount } = await getAppPool().query(
    `DELETE FROM user_posts WHERE id = $1 AND user_id = $2`,
    [body.postId, user.id]
  );
  if (!rowCount) {
    return NextResponse.json({ ok: false, error: "Пост не найден." }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

function unauthorized() {
  return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
}
