import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";

/**
 * POST /api/progress — сохраняет прогресс текущего пользователя по квесту.
 * Шаг только растёт (GREATEST), завершение не сбрасывается.
 */
export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Нужно войти, чтобы сохранять прогресс." },
      { status: 401 }
    );
  }

  let body: { questSlug?: string; currentStep?: number; completed?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON." },
      { status: 400 }
    );
  }

  const { questSlug } = body;
  const currentStep = Number(body.currentStep);
  if (
    !questSlug ||
    !Number.isInteger(currentStep) ||
    currentStep < 1 ||
    currentStep > 1000
  ) {
    return NextResponse.json(
      { ok: false, error: "Некорректные данные прогресса." },
      { status: 400 }
    );
  }

  const client = await getAppPool().connect();
  try {
    await client.query("BEGIN");
    await client.query(
      `INSERT INTO quest_progress (user_id, quest_slug, current_step, completed_at)
       VALUES ($1, $2, $3, CASE WHEN $4 THEN now() END)
       ON CONFLICT (user_id, quest_slug) DO UPDATE SET
         current_step = GREATEST(quest_progress.current_step, EXCLUDED.current_step),
         completed_at = COALESCE(quest_progress.completed_at, EXCLUDED.completed_at),
         updated_at = now()`,
      [user.id, questSlug, currentStep, Boolean(body.completed)]
    );
    const solvedStep = body.completed ? currentStep : currentStep - 1;
    if (solvedStep >= 1) {
      await client.query(
        `INSERT INTO learning_activity (
           user_id, activity_type, reference_key, quest_slug
         ) VALUES ($1, 'quest_step', $2, $3)
         ON CONFLICT (user_id, activity_type, reference_key) DO NOTHING`,
        [user.id, `quest:${questSlug}:step:${solvedStep}`, questSlug]
      );
    }
    await client.query("COMMIT");
    return NextResponse.json({ ok: true });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Failed to save progress:", err);
    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить прогресс." },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}
