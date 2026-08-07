"use client";

import { useState } from "react";

export function ContinuePaymentButton({ paymentId }: { paymentId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function continuePayment() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/payments/${paymentId}/continue`, {
        method: "POST",
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        status?: "pending" | "paid";
        confirmationUrl?: string;
        questSlug?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Не удалось продолжить оплату.");
        return;
      }
      if (data.status === "paid" && data.questSlug) {
        window.location.assign(`/quests/${data.questSlug}`);
        return;
      }
      if (!data.confirmationUrl) {
        setError("Платёжная ссылка больше недоступна.");
        return;
      }
      window.location.assign(data.confirmationUrl);
    } catch {
      setError("Не удалось связаться с сервером.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-1.5 md:items-end">
      <button
        type="button"
        onClick={continuePayment}
        disabled={loading}
        className="inline-flex min-h-9 items-center justify-center whitespace-nowrap rounded-lg bg-eager-green px-4 py-2 text-[11px] font-extrabold uppercase text-paper-white transition hover:bg-[#4cb002] disabled:cursor-wait disabled:opacity-65"
      >
        {loading ? "Проверяем…" : "Продолжить оплату"}
      </button>
      {error && (
        <span className="max-w-[260px] text-left text-[11px] font-bold leading-snug text-[#d63b3b] md:text-right">
          {error}
        </span>
      )}
    </div>
  );
}
