import "server-only";

import { getAppPool, isDatabaseConfigured } from "./db";
import { DEMO_QUESTS } from "./quests";
import type { QuestProgressEntry, StoryPaymentEntry } from "./types";

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

export async function getAccountPayments(
  userId: string
): Promise<StoryPaymentEntry[]> {
  if (!isDatabaseConfigured()) return [];

  try {
    const { rows } = await getAppPool().query<StoryPaymentEntry>(
      `SELECT payment.id::text,
              payment.quest_slug AS "questSlug",
              payment.quest_title AS "questTitle",
              payment.amount_kopecks AS "amountKopecks",
              payment.currency,
              payment.status,
              payment.provider,
              payment.receipt_url AS "receiptUrl",
              payment.created_at::text AS "createdAt",
              payment.paid_at::text AS "paidAt"
         FROM story_payments payment
        WHERE payment.user_id = $1
        ORDER BY payment.created_at DESC, payment.id DESC`,
      [userId]
    );
    return rows;
  } catch (error) {
    // Старые локальные установки могут ещё не содержать таблицу платежей.
    console.error("Failed to load account payments:", error);
    return [];
  }
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
