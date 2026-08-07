import "server-only";

import { getAppPool } from "./db";
import {
  createYooKassaPayment,
  formatAmount,
  getYooKassaPayment,
  type YooKassaPayment,
  type YooKassaPaymentStatus,
} from "./yookassa";

const PROVIDER = "yookassa";

export type LocalPaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "canceled"
  | "refunded";

export interface PaymentSyncResult {
  localPaymentId: string;
  questSlug: string;
  questTitle: string;
  status: LocalPaymentStatus;
}

export async function createStoryPayment(input: {
  userId: string;
  userEmail: string;
  questSlug: string;
  returnBaseUrl: string;
}): Promise<
  | { alreadyOwned: true; questSlug: string }
  | { alreadyOwned: false; confirmationUrl: string; paymentId: string }
> {
  const pool = getAppPool();
  const { rows: quests } = await pool.query<{
    title: string;
    priceKopecks: number;
    status: string;
  }>(
    `SELECT title, price_kopecks AS "priceKopecks", status
       FROM quests
      WHERE slug = $1`,
    [input.questSlug]
  );
  const quest = quests[0];
  if (!quest) throw new Error("История не найдена.");
  if (quest.status !== "available") throw new Error("История пока недоступна.");

  const priceKopecks = Number(quest.priceKopecks);
  if (priceKopecks <= 0) {
    return { alreadyOwned: true, questSlug: input.questSlug };
  }

  const { rowCount } = await pool.query(
    `SELECT 1
       FROM story_payments
      WHERE user_id = $1 AND quest_slug = $2 AND status = 'paid'
      LIMIT 1`,
    [input.userId, input.questSlug]
  );
  if (rowCount) return { alreadyOwned: true, questSlug: input.questSlug };

  const { rows: created } = await pool.query<{ id: string }>(
    `INSERT INTO story_payments (
       user_id, quest_slug, quest_title, amount_kopecks, currency,
       status, provider
     ) VALUES ($1, $2, $3, $4, 'RUB', 'pending', $5)
     RETURNING id::text`,
    [input.userId, input.questSlug, quest.title, priceKopecks, PROVIDER]
  );
  const localPaymentId = created[0].id;

  try {
    const returnUrl = new URL("/payments/return", input.returnBaseUrl);
    returnUrl.searchParams.set("payment", localPaymentId);
    const payment = await createYooKassaPayment({
      amountKopecks: priceKopecks,
      description: `Доступ к истории «${quest.title}»`,
      customerEmail: input.userEmail,
      returnUrl: returnUrl.toString(),
      idempotenceKey: localPaymentId,
      metadata: {
        local_payment_id: localPaymentId,
        user_id: input.userId,
        quest_slug: input.questSlug,
      },
    });
    const confirmationUrl = payment.confirmation?.confirmation_url;
    if (!confirmationUrl) {
      throw new Error("YooKassa не вернула ссылку на страницу оплаты.");
    }

    await pool.query(
      `UPDATE story_payments
          SET provider_payment_id = $2, updated_at = now()
        WHERE id = $1`,
      [localPaymentId, payment.id]
    );
    return {
      alreadyOwned: false,
      confirmationUrl,
      paymentId: localPaymentId,
    };
  } catch (error) {
    await pool.query(
      `UPDATE story_payments
          SET status = 'failed', updated_at = now()
        WHERE id = $1 AND provider_payment_id IS NULL`,
      [localPaymentId]
    );
    throw error;
  }
}

/**
 * Получает состояние платежа непосредственно из YooKassa и только после этого
 * обновляет локальную покупку. Данные webhook сами по себе не считаются
 * подтверждением оплаты.
 */
export async function syncYooKassaPayment(
  providerPaymentId: string
): Promise<PaymentSyncResult> {
  const remote = await getYooKassaPayment(providerPaymentId);
  return syncRemoteYooKassaPayment(remote);
}

async function syncRemoteYooKassaPayment(
  remote: YooKassaPayment
): Promise<PaymentSyncResult> {
  const localPaymentId = remote.metadata?.local_payment_id;
  if (!localPaymentId) throw new Error("В платеже отсутствует номер заказа.");

  const pool = getAppPool();
  const { rows } = await pool.query<{
    id: string;
    userId: string;
    questSlug: string;
    questTitle: string;
    amountKopecks: number;
    currency: string;
    providerPaymentId: string | null;
  }>(
    `SELECT id::text,
            user_id::text AS "userId",
            quest_slug AS "questSlug",
            quest_title AS "questTitle",
            amount_kopecks AS "amountKopecks",
            currency,
            provider_payment_id AS "providerPaymentId"
       FROM story_payments
      WHERE id = $1 AND provider = $2`,
    [localPaymentId, PROVIDER]
  );
  const local = rows[0];
  if (!local) throw new Error("Локальный платёж не найден.");

  const metadataMatches =
    remote.metadata?.user_id === local.userId &&
    remote.metadata?.quest_slug === local.questSlug;
  const amountMatches =
    remote.amount.currency === local.currency &&
    remote.amount.value === formatAmount(Number(local.amountKopecks));
  const providerIdMatches =
    !local.providerPaymentId || local.providerPaymentId === remote.id;
  if (!metadataMatches || !amountMatches || !providerIdMatches) {
    throw new Error("Параметры платежа не совпадают с заказом.");
  }

  const status = mapPaymentStatus(remote.status);
  const { rows: updated } = await pool.query<PaymentSyncResult>(
    `UPDATE story_payments
        SET provider_payment_id = $2,
            status = $3,
            paid_at = CASE
              WHEN $3 = 'paid' THEN COALESCE(paid_at, now())
              ELSE paid_at
            END,
            updated_at = now()
      WHERE id = $1
      RETURNING id::text AS "localPaymentId",
                quest_slug AS "questSlug",
                quest_title AS "questTitle",
                status`,
    [localPaymentId, remote.id, status]
  );
  return updated[0];
}

export async function continueUserPayment(
  localPaymentId: string,
  userId: string
): Promise<
  | { status: "pending"; confirmationUrl: string }
  | { status: "paid"; questSlug: string }
> {
  const { rows } = await getAppPool().query<{
    providerPaymentId: string | null;
  }>(
    `SELECT provider_payment_id AS "providerPaymentId"
       FROM story_payments
      WHERE id = $1 AND user_id = $2 AND provider = $3`,
    [localPaymentId, userId, PROVIDER]
  );
  const providerPaymentId = rows[0]?.providerPaymentId;
  if (!providerPaymentId) throw new Error("Незавершённый платёж не найден.");

  const remote = await getYooKassaPayment(providerPaymentId);
  const synced = await syncRemoteYooKassaPayment(remote);
  if (synced.localPaymentId !== localPaymentId) {
    throw new Error("Платёж не совпадает с выбранной операцией.");
  }
  if (synced.status === "paid") {
    return { status: "paid", questSlug: synced.questSlug };
  }
  if (synced.status === "canceled") {
    throw new Error("Этот платёж уже отменён. Создай новый на странице истории.");
  }
  if (synced.status !== "pending") {
    throw new Error("Этот платёж нельзя продолжить.");
  }

  const confirmationUrl = remote.confirmation?.confirmation_url;
  if (!confirmationUrl) {
    throw new Error("YooKassa больше не принимает подтверждение этого платежа.");
  }
  return { status: "pending", confirmationUrl };
}

export async function syncUserPaymentByLocalId(
  localPaymentId: string,
  userId: string
): Promise<PaymentSyncResult> {
  const { rows } = await getAppPool().query<{ providerPaymentId: string | null }>(
    `SELECT provider_payment_id AS "providerPaymentId"
       FROM story_payments
      WHERE id = $1 AND user_id = $2 AND provider = $3`,
    [localPaymentId, userId, PROVIDER]
  );
  const providerPaymentId = rows[0]?.providerPaymentId;
  if (!providerPaymentId) throw new Error("Платёж не найден или ещё не создан.");
  return syncYooKassaPayment(providerPaymentId);
}

function mapPaymentStatus(status: YooKassaPaymentStatus): LocalPaymentStatus {
  if (status === "succeeded") return "paid";
  if (status === "canceled") return "canceled";
  return "pending";
}
