"use client";

import Link from "next/link";
import { useState } from "react";

export function PurchaseCard({
  questSlug,
  questTitle,
  priceKopecks,
  isAuthed,
}: {
  questSlug: string;
  questTitle: string;
  priceKopecks: number;
  isAuthed: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function startPayment() {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/payments/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questSlug }),
      });
      const data = (await response.json()) as {
        ok: boolean;
        error?: string;
        alreadyOwned?: boolean;
        confirmationUrl?: string;
        questSlug?: string;
      };
      if (!response.ok || !data.ok) {
        setError(data.error ?? "Не удалось перейти к оплате.");
        return;
      }
      if (data.alreadyOwned) {
        window.location.reload();
        return;
      }
      if (!data.confirmationUrl) {
        setError("YooKassa не вернула ссылку на оплату.");
        return;
      }
      window.location.assign(data.confirmationUrl);
    } catch {
      setError("Не удалось связаться с сервером. Попробуй позже.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-[22px] border-2 border-[#dfe3e8] bg-paper-white p-6 text-center shadow-[0_18px_50px_rgba(15,23,42,0.08)] sm:p-8">
      <p className="text-caption font-extrabold uppercase tracking-[0.1em] text-spark-blue">
        Полная история
      </p>
      <h2 className="mt-2 font-feather text-heading-sm font-black text-charcoal">
        Открыть «{questTitle}»
      </h2>
      <p className="mx-auto mt-3 max-w-[540px] text-body font-medium leading-relaxed text-pencil-gray">
        Однократная оплата открывает все этапы истории в твоём аккаунте.
      </p>
      <p className="mt-6 text-[36px] font-black leading-none text-charcoal">
        {formatMoney(priceKopecks)}
      </p>

      {isAuthed ? (
        <button
          type="button"
          onClick={startPayment}
          disabled={loading}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-eager-green px-8 py-3 text-nav-label font-extrabold uppercase text-paper-white shadow-[0_5px_0_#3e9900] transition hover:-translate-y-0.5 disabled:cursor-wait disabled:opacity-65"
        >
          {loading ? "Создаём платёж…" : "Оплатить через YooKassa"}
        </button>
      ) : (
        <Link
          href={`/login?returnTo=${encodeURIComponent(`/quests/${questSlug}`)}`}
          className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-eager-green px-8 py-3 text-nav-label font-extrabold uppercase text-paper-white shadow-[0_5px_0_#3e9900]"
        >
          Войти и купить
        </Link>
      )}

      {error && (
        <p className="mx-auto mt-4 max-w-[520px] text-body font-bold text-[#d63b3b]">
          {error}
        </p>
      )}
      <p className="mx-auto mt-5 max-w-[560px] text-[12px] font-medium leading-relaxed text-faded-gray">
        Оплата проходит на защищённой странице YooKassa. Нажимая кнопку, ты
        принимаешь условия <Link href="/legal/offer" className="font-bold text-spark-blue hover:underline">публичной оферты</Link>.
        Чек будет отправлен на email, указанный в аккаунте.
      </p>
    </section>
  );
}

function formatMoney(amountKopecks: number) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
  }).format(amountKopecks / 100);
}
