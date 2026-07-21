import { NextResponse } from "next/server";
import { getAppPool, isDatabaseConfigured } from "@/lib/db";
import { getDemoQuest } from "@/lib/quests";
import type { Quest } from "@/lib/types";

/**
 * GET /api/quests/[slug] — один квест со списком шагов (без ответов).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  if (isDatabaseConfigured()) {
    try {
      const pool = getAppPool();
      const { rows } = await pool.query<Quest>(
        `SELECT slug, title, tagline, intro, difficulty,
                steps_count AS "stepsCount", emoji, status,
                preview_url AS "previewUrl"
           FROM quests
          WHERE slug = $1`,
        [slug]
      );
      if (rows.length > 0) {
        const steps = await pool.query(
          `SELECT step_number AS "stepNumber", title, story, outcome, theory, task, hint
             FROM quest_steps
            WHERE quest_slug = $1
            ORDER BY step_number`,
          [slug]
        );
        return NextResponse.json({
          quest: rows[0],
          steps: steps.rows,
          source: "database",
        });
      }
    } catch (err) {
      console.error("Failed to load quest from database:", err);
    }
  }

  const quest = getDemoQuest(slug);
  if (!quest) {
    return NextResponse.json({ error: "Квест не найден" }, { status: 404 });
  }
  return NextResponse.json({ quest, steps: [], source: "demo" });
}
