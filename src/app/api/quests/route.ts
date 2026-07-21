import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { DEMO_QUESTS } from "@/lib/quests";
import type { Quest } from "@/lib/types";

/**
 * GET /api/quests — каталог квестов.
 * Читает из PostgreSQL; если база не настроена или недоступна,
 * отдаёт демо-каталог, чтобы фронтенд работал без инфраструктуры.
 */
export async function GET() {
  if (isDatabaseConfigured()) {
    try {
      const { rows } = await getAppPool().query<Quest>(
        `SELECT slug, title, tagline, intro, difficulty,
                steps_count AS "stepsCount", emoji, status,
                preview_url AS "previewUrl"
           FROM quests
          ORDER BY sort_order`
      );
      return NextResponse.json({ quests: rows, source: "database" });
    } catch (err) {
      console.error("Failed to load quests from database:", err);
    }
  }
  return NextResponse.json({ quests: DEMO_QUESTS, source: "demo" });
}
