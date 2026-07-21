import { getAppPool, isDatabaseConfigured } from "./db";
import { getDemoQuest } from "./quests";
import type { Quest, QuestSceneFrame, QuestStep } from "./types";

export interface QuestWithSteps {
  quest: Quest;
  /** Шаги без эталонных ответов — их видит клиент */
  steps: QuestStep[];
  /** Кадры сцен визуальной новеллы между уровнями */
  scenes: QuestSceneFrame[];
}

/**
 * Квест со списком шагов: из базы, с fallback'ом на демо-каталог
 * (у демо-квестов шагов нет — страница покажет заглушку).
 */
export async function getQuestWithSteps(
  slug: string
): Promise<QuestWithSteps | null> {
  if (isDatabaseConfigured()) {
    try {
      const pool = getAppPool();
      const { rows } = await pool.query<Quest>(
        `SELECT slug, title, tagline, intro, finale, difficulty,
                steps_count AS "stepsCount", emoji, status,
                preview_url AS "previewUrl"
           FROM quests
          WHERE slug = $1`,
        [slug]
      );
      if (rows.length > 0) {
        const [steps, scenes] = await Promise.all([
          pool.query<QuestStep>(
            `SELECT quest_slug AS "questSlug", step_number AS "stepNumber",
                    title, story, outcome, theory, task, hint
               FROM quest_steps
              WHERE quest_slug = $1
              ORDER BY step_number`,
            [slug]
          ),
          pool.query<QuestSceneFrame>(
            `SELECT after_step AS "afterStep", frame_order AS "frameOrder",
                    image_url AS "imageUrl", speaker, text
               FROM quest_scenes
              WHERE quest_slug = $1
              ORDER BY after_step, frame_order`,
            [slug]
          ),
        ]);
        return { quest: rows[0], steps: steps.rows, scenes: scenes.rows };
      }
    } catch (err) {
      console.error("Failed to load quest from database:", err);
    }
  }

  const quest = getDemoQuest(slug);
  return quest ? { quest, steps: [], scenes: [] } : null;
}

export interface UserQuestProgress {
  currentStep: number;
  completedAt: string | null;
}

export async function getUserQuestProgress(
  userId: string,
  questSlug: string
): Promise<UserQuestProgress | null> {
  try {
    const { rows } = await getAppPool().query<UserQuestProgress>(
      `SELECT current_step AS "currentStep", completed_at AS "completedAt"
         FROM quest_progress
        WHERE user_id = $1 AND quest_slug = $2`,
      [userId, questSlug]
    );
    return rows[0] ?? null;
  } catch (err) {
    console.error("Failed to load quest progress:", err);
    return null;
  }
}
