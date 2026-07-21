import "server-only";

import { getAppPool, isDatabaseConfigured } from "./db";
import { DEMO_QUESTS } from "./quests";
import type { QuestProgressEntry } from "./types";

export async function getAccountProgress(
  userId: string
): Promise<QuestProgressEntry[]> {
  try {
    const { rows } = await getAppPool().query<QuestProgressEntry>(
      `SELECT p.quest_slug AS "questSlug",
              q.title,
              q.emoji,
              q.steps_count AS "stepsCount",
              p.current_step AS "currentStep",
              p.completed_at::text AS "completedAt"
         FROM quest_progress p
         JOIN quests q ON q.slug = p.quest_slug
        WHERE p.user_id = $1
        ORDER BY p.updated_at DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    console.error("Failed to load account progress:", error);
    return [];
  }
}

export async function getAvailableQuestsCount(): Promise<number> {
  if (isDatabaseConfigured()) {
    try {
      const { rows } = await getAppPool().query<{ count: string }>(
        `SELECT count(*) FROM quests WHERE status = 'available'`
      );
      return Number(rows[0].count);
    } catch {
      // Используем демо-каталог.
    }
  }
  return DEMO_QUESTS.filter((quest) => quest.status === "available").length;
}

export function calculateQuestStats(progress: QuestProgressEntry[]) {
  return {
    completedQuests: progress.filter((entry) => entry.completedAt).length,
    solvedSteps: progress.reduce(
      (sum, entry) =>
        sum +
        (entry.completedAt
          ? entry.stepsCount
          : Math.max(entry.currentStep - 1, 0)),
      0
    ),
  };
}
