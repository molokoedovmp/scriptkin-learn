import "server-only";

import { getAppPool } from "./db";

export interface QuestAccess {
  exists: boolean;
  priceKopecks: number;
  purchased: boolean;
  allowed: boolean;
}

const QUEST_TESTER_EMAILS = new Set(["molokoedovmp@gmail.com"]);

export function hasQuestTesterAccess(email: string | null | undefined): boolean {
  return QUEST_TESTER_EMAILS.has(email?.trim().toLowerCase() ?? "");
}

/**
 * Доступ к бесплатной истории открыт всем. Платная история открывается только
 * пользователю с успешно завершённым платежом.
 */
export async function getQuestAccess(
  userId: string | null | undefined,
  questSlug: string,
  userEmail?: string | null
): Promise<QuestAccess> {
  const { rows } = await getAppPool().query<{
    priceKopecks: number;
    purchased: boolean;
  }>(
    `SELECT q.price_kopecks AS "priceKopecks",
            CASE
              WHEN $2::uuid IS NULL THEN false
              ELSE EXISTS (
                SELECT 1
                  FROM story_payments payment
                 WHERE payment.user_id = $2::uuid
                   AND payment.quest_slug = q.slug
                   AND payment.status = 'paid'
              )
            END AS purchased
       FROM quests q
      WHERE q.slug = $1`,
    [questSlug, userId ?? null]
  );

  const row = rows[0];
  if (!row) {
    return { exists: false, priceKopecks: 0, purchased: false, allowed: false };
  }

  const priceKopecks = Number(row.priceKopecks);
  const purchased = Boolean(row.purchased);
  const testerAccess = hasQuestTesterAccess(userEmail);
  return {
    exists: true,
    priceKopecks,
    purchased,
    allowed: priceKopecks === 0 || purchased || testerAccess,
  };
}
