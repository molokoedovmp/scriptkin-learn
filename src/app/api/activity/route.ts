import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getAppPool } from "@/lib/db";
import { getServerPracticeTask } from "@/lib/practice";

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
  }

  let body: { questSlug?: string; practiceTaskId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный JSON." }, { status: 400 });
  }

  const questSlug = body.questSlug ?? "";
  const practiceTaskId = body.practiceTaskId ?? "";
  if (!getServerPracticeTask(questSlug, practiceTaskId)) {
    return NextResponse.json({ ok: false, error: "Задание не найдено." }, { status: 404 });
  }

  await getAppPool().query(
    `INSERT INTO learning_activity (
       user_id, activity_type, reference_key, quest_slug
     ) VALUES ($1, 'practice_task', $2, $3)
     ON CONFLICT (user_id, activity_type, reference_key) DO NOTHING`,
    [user.id, `practice:${questSlug}:${practiceTaskId}`, questSlug]
  );
  return NextResponse.json({ ok: true });
}
