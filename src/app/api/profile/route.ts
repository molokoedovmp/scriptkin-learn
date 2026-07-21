import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAppPool } from "@/lib/db";

export async function PATCH(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
  }

  let body: { name?: string; bio?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }

  const name = (body.name ?? "").trim().replace(/\s+/g, " ");
  const bio = (body.bio ?? "").trim();
  if (name.length < 2 || name.length > 40) {
    return NextResponse.json({ ok: false, error: "Никнейм должен содержать от 2 до 40 символов." }, { status: 400 });
  }
  if (bio.length > 500) {
    return NextResponse.json({ ok: false, error: "Описание не должно превышать 500 символов." }, { status: 400 });
  }

  try {
    const { rows } = await getAppPool().query<{
      id: string;
      email: string;
      name: string;
      bio: string | null;
    }>(
      `UPDATE users
          SET name = $1, bio = NULLIF($2, '')
        WHERE id = $3
        RETURNING id, email, name, bio`,
      [name, bio, user.id]
    );
    return NextResponse.json({ ok: true, user: rows[0] });
  } catch (error) {
    const dbError = error as { code?: string; constraint?: string };
    if (dbError.code === "23505" && dbError.constraint === "users_name_unique") {
      return NextResponse.json(
        { ok: false, error: "Этот никнейм уже занят." },
        { status: 409 }
      );
    }
    console.error("Profile update failed:", error);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить профиль." }, { status: 500 });
  }
}
