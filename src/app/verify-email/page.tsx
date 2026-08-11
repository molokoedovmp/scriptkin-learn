import type { Metadata } from "next";
import Link from "next/link";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PRIVATE_ROBOTS } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Подтверждение email — Скрипткин",
  robots: PRIVATE_ROBOTS,
};
export const dynamic = "force-dynamic";

const states = {
  success: {
    icon: "✓",
    title: "Email подтверждён",
    text: "Аккаунт активирован, вход уже выполнен. Можно продолжать обучение.",
    href: "/account",
    action: "Перейти в кабинет",
  },
  invalid: {
    icon: "!",
    title: "Ссылка недействительна",
    text: "Ссылка истекла или уже была использована. Войди в аккаунт и запроси новое письмо.",
    href: "/login",
    action: "Вернуться ко входу",
  },
  error: {
    icon: "!",
    title: "Не удалось подтвердить email",
    text: "Произошла техническая ошибка. Попробуй открыть ссылку ещё раз немного позже.",
    href: "/login",
    action: "Вернуться ко входу",
  },
  pending: {
    icon: "✉",
    title: "Проверь почту",
    text: "Открой письмо от Скрипткина и нажми кнопку подтверждения. Ссылка действует 24 часа.",
    href: "/login",
    action: "Перейти ко входу",
  },
} as const;

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const state =
    status === "success" || status === "invalid" || status === "error"
      ? states[status]
      : states.pending;

  return (
    <>
      <Header />
      <main className="flex-1 px-6 py-20">
        <section className="mx-auto max-w-[520px] rounded-[24px] border-2 border-[#dfe5eb] bg-paper-white p-8 text-center shadow-[0_18px_55px_rgba(15,23,42,0.1)] sm:p-10">
          <span className="mx-auto grid h-16 w-16 place-content-center rounded-2xl bg-storybook-green text-[34px] font-black text-eager-green">
            {state.icon}
          </span>
          <h1 className="mt-6 font-feather text-heading-sm font-black text-charcoal">
            {state.title}
          </h1>
          <p className="mt-3 text-body font-medium leading-relaxed text-pencil-gray">
            {state.text}
          </p>
          <Link
            href={state.href}
            className="mt-7 inline-flex rounded-xl bg-eager-green px-7 py-3 text-caption font-extrabold uppercase text-paper-white shadow-[0_4px_0_#3e9900]"
          >
            {state.action}
          </Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
