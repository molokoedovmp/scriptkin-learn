import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { FeedbackForm } from "@/components/FeedbackForm";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";

export const metadata: Metadata = {
  title: "Обратная связь со Скрипткином",
  description:
    "Напишите автору Скрипткина: сообщите об ошибке в задании или на сайте, предложите новую SQL-историю либо задайте вопрос о платформе.",
  alternates: { canonical: "/feedback" },
};

export default function FeedbackPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[#f7f8fa]">
        <div className="mx-auto grid max-w-[1100px] items-start gap-8 px-4 py-10 sm:px-6 sm:py-16 lg:grid-cols-[0.75fr_1.25fr]">
          <Breadcrumbs
            className="lg:col-span-2"
            items={[
              { name: "Главная", path: "/" },
              { name: "Обратная связь", path: "/feedback" },
            ]}
          />
          <section className="lg:sticky lg:top-[100px]">
            <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-eager-green">Обратная связь</p>
            <h1 className="mt-3 font-feather text-heading-sm font-black text-charcoal sm:text-heading">Обратная связь со Скрипткином</h1>
            <p className="mt-5 text-body font-medium text-pencil-gray">
              Сообщи об ошибке, предложи новую историю или задай вопрос. Письмо отправится напрямую автору проекта.
            </p>
            <div className="mt-6 space-y-3">
              {["Ответ придёт на твой email", "Сообщение не публикуется на сайте", "Можно приложить SQL-код прямо в текст"].map((item) => (
                <p key={item} className="flex gap-3 text-[15px] font-bold text-charcoal"><span className="text-eager-green">✓</span>{item}</p>
              ))}
            </div>
          </section>
          <FeedbackForm />
        </div>
      </main>
      <Footer />
    </>
  );
}
