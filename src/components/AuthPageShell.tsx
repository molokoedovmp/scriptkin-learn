import Image from "next/image";
import Link from "next/link";
import { ArrowLeft, BookOpen, Database } from "lucide-react";
import type { ReactNode } from "react";

export function AuthPageShell({ mode, children }: { mode: "login" | "register"; children: ReactNode }) {
  const isLogin = mode === "login";

  return (
    <main className="min-h-dvh bg-[#f4f6f8] text-charcoal dark:bg-[#0d1727] dark:text-white lg:grid lg:grid-cols-[minmax(480px,1fr)_minmax(620px,1fr)]">
      <section className="relative hidden min-h-dvh overflow-hidden border-r border-white/10 bg-[#050907] lg:block">
        <Image src="/login.png" alt="Интерактивные истории Скрипткин" fill priority sizes="55vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/35" />
        <Link href="/" className="absolute left-8 top-8 z-10 inline-flex items-center gap-3 rounded-2xl border border-white/15 bg-black/35 px-4 py-3 text-white backdrop-blur-md transition hover:border-eager-green/70 hover:bg-black/55">
          <span className="grid h-10 w-10 place-content-center rounded-xl bg-eager-green font-black shadow-[0_4px_0_#2f8500]">С</span>
          <span>
            <span className="block text-[17px] font-black leading-none">скрипткин</span>
            <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.16em] text-white/60">SQL через истории</span>
          </span>
        </Link>
        <div className="absolute inset-x-0 bottom-0 z-10 p-8 xl:p-12">
          <p className="max-w-[620px] text-[27px] font-black leading-tight text-white xl:text-[34px]">Учись писать SQL внутри историй, где каждый запрос двигает сюжет.</p>
          <div className="mt-6 flex flex-wrap gap-3 text-[13px] font-extrabold text-white/80">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 backdrop-blur-md"><BookOpen className="h-4 w-4 text-eager-green" /> Интерактивные уроки</span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-black/35 px-4 py-2 backdrop-blur-md"><Database className="h-4 w-4 text-spark-blue" /> Практика на реальных базах</span>
          </div>
        </div>
      </section>

      <section className="relative flex min-h-dvh flex-col">
        <div className="relative h-52 overflow-hidden lg:hidden">
          <Image src="/login.png" alt="Истории Скрипткин" fill priority sizes="100vw" className="object-cover object-[center_34%]" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f4f6f8] via-transparent to-black/30 dark:from-[#0d1727]" />
          <Link href="/" className="absolute left-4 top-4 grid h-11 w-11 place-content-center rounded-xl border border-white/20 bg-black/50 font-black text-white backdrop-blur-md" aria-label="На главную">С</Link>
        </div>
        <Link href="/" className="absolute left-6 top-6 z-10 hidden items-center gap-2 rounded-xl px-3 py-2 text-caption font-extrabold text-pencil-gray transition hover:bg-black/5 hover:text-spark-blue dark:text-[#aab7ca] dark:hover:bg-white/5 dark:hover:text-[#61d0ff] lg:inline-flex"><ArrowLeft className="h-4 w-4" /> На главную</Link>
        <div className="relative z-[1] flex flex-1 items-center justify-center px-5 pb-10 lg:px-10 lg:py-20 xl:px-16">
          <div className="w-full max-w-[560px] rounded-[28px] border border-[#dfe4ea] bg-white/95 p-6 shadow-[0_24px_70px_rgba(23,31,45,0.12)] backdrop-blur-xl dark:border-[#2b3c56] dark:bg-[#111d30]/95 dark:shadow-[0_26px_80px_rgba(0,0,0,0.38)] sm:p-9 lg:p-10">
            <div className="mb-7">
              <span className="mb-4 inline-flex rounded-full bg-[#e9ffd9] px-3 py-1 text-[11px] font-black uppercase tracking-[0.14em] text-[#378d00] dark:bg-[#183c18] dark:text-[#8aef46]">{isLogin ? "Продолжить обучение" : "Начать обучение"}</span>
              <h1 className="font-feather text-[32px] font-black leading-tight text-[#202632] dark:text-white">{isLogin ? "С возвращением" : "Создай аккаунт"}</h1>
              <p className="mt-2 text-[15px] font-medium leading-relaxed text-[#6d7684] dark:text-[#aeb9ca]">{isLogin ? "Войди, чтобы продолжить историю с сохранённого шага." : "Сохраняй прогресс и проходи истории на любом устройстве."}</p>
            </div>
            {children}
          </div>
        </div>
      </section>
    </main>
  );
}
