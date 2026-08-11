import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { getSessionUser } from "@/lib/auth";
import { syncUserPaymentByLocalId, type PaymentSyncResult } from "@/lib/payments";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Результат оплаты — Скрипткин",
  robots: PRIVATE_ROBOTS,
};

export const dynamic = "force-dynamic";

export default async function PaymentReturnPage({
  searchParams,
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const user = await getSessionUser();
  const { payment } = await searchParams;
  let result: PaymentSyncResult | null = null;
  let error: string | null = null;

  if (!user) {
    error = "Войди в аккаунт, чтобы проверить оплату.";
  } else if (!payment || !/^[0-9a-f-]{36}$/i.test(payment)) {
    error = "Не удалось определить номер платежа.";
  } else {
    try {
      result = await syncUserPaymentByLocalId(payment, user.id);
    } catch (caught) {
      console.error("Failed to reconcile returned payment:", caught);
      error = "Платёж пока не подтверждён. Его статус обновится автоматически.";
    }
  }

  const paid = result?.status === "paid";
  const canceled = result?.status === "canceled";

  return (
    <>
      <Header />
      <main className="flex flex-1 items-center bg-[#f7f8fa] px-6 py-16">
        <section className="mx-auto w-full max-w-[640px] rounded-[24px] border-2 border-[#e1e4e8] bg-paper-white p-8 text-center shadow-[0_20px_60px_rgba(15,23,42,0.1)] sm:p-10">
          <span className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl font-black ${paid ? "bg-storybook-green text-[#3d7f12]" : canceled ? "bg-[#fff0f0] text-[#bd3030]" : "bg-[#fff4cf] text-[#8a6400]"}`}>
            {paid ? "✓" : canceled ? "×" : "…"}
          </span>
          <h1 className="mt-5 font-feather text-heading-sm font-black text-charcoal">
            {paid ? "Оплата прошла" : canceled ? "Платёж отменён" : "Проверяем оплату"}
          </h1>
          <p className="mx-auto mt-3 max-w-[500px] text-body font-medium leading-relaxed text-pencil-gray">
            {paid
              ? `История «${result?.questTitle ?? "Прометей"}» открыта в твоём аккаунте.`
              : error ?? "Если деньги уже списались, подтверждение обычно приходит через несколько секунд."}
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            {paid && result ? (
              <Link href={`/account/quests/${result.questSlug}`} className="rounded-xl bg-eager-green px-7 py-3 text-caption font-extrabold uppercase text-paper-white">
                Начать историю
              </Link>
            ) : !user ? (
              <Link href="/login" className="rounded-xl bg-eager-green px-7 py-3 text-caption font-extrabold uppercase text-paper-white">
                Войти
              </Link>
            ) : (
              <Link href="/account/payments" className="rounded-xl bg-eager-green px-7 py-3 text-caption font-extrabold uppercase text-paper-white">
                Проверить в кабинете
              </Link>
            )}
            <Link href="/quests" className="rounded-xl border-2 border-[#d8dce3] px-7 py-3 text-caption font-extrabold uppercase text-charcoal">
              Все истории
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
