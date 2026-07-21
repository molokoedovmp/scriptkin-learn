import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";

export const metadata: Metadata = {
  title: "FAQ — Скрипткин",
  description:
    "Ответы на частые вопросы о Скрипткине: сколько стоит, нужен ли опыт, какой диалект SQL и как сохраняется прогресс.",
};

const faq = [
  {
    q: "Это бесплатно?",
    a: "Да. Все опубликованные квесты доступны бесплатно, регистрация тоже. Планов прятать первый квест за подписку нет — он навсегда останется открытым.",
  },
  {
    q: "Нужен ли опыт программирования?",
    a: "Нет. Квесты уровня «Новичок» начинаются с самого первого SELECT и объясняют всё по ходу истории. Если ты хоть раз работал с таблицами в Excel — этого достаточно, чтобы сесть на «Полночный экспресс».",
  },
  {
    q: "Какой диалект SQL используется?",
    a: "PostgreSQL — самый популярный открытый диалект. Запросы выполняются в настоящей базе Postgres, поэтому всё, что ты выучишь, без изменений работает на реальных проектах. Основные конструкции (SELECT, JOIN, GROUP BY) одинаковы во всех диалектах SQL.",
  },
  {
    q: "Могу ли я сломать базу данных неправильным запросом?",
    a: "Нет. База квеста открыта только на чтение: INSERT, UPDATE, DELETE и DROP отклоняются автоматически. Худшее, что может случиться, — ошибка синтаксиса, и это нормальная часть обучения.",
  },
  {
    q: "Что будет, если я напишу запрос не так, как задумано?",
    a: "Запрос всё равно выполнится, и ты увидишь его результат — исследовать данные любыми способами даже полезно. Шаг засчитывается, когда результат совпадает с эталонным: важны нужные колонки и строки, а порядок строк не важен.",
  },
  {
    q: "Как сохраняется прогресс?",
    a: "Если ты вошёл в аккаунт, прогресс сохраняется на сервере после каждого решённого шага — можно продолжить с другого устройства. Без аккаунта играть тоже можно, но прогресс живёт только до закрытия вкладки.",
  },
  {
    q: "Застрял на шаге. Что делать?",
    a: "У каждого шага есть подсказка с нужной конструкцией SQL — она спрятана под спойлером, чтобы не портить интерес. Ещё помогает просто посмотреть на данные: сделай SELECT * из таблицы, о которой идёт речь, и перечитай задание.",
  },
  {
    q: "Когда появятся новые квесты?",
    a: "В работе три квеста: «Крушение подлодки» (новичок), «Ограбление галереи» (средний уровень) и «Станция „Арес-9“» (продвинутый, оконные функции). Следи за каталогом — новые истории появляются там.",
  },
];

export default function FaqPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[800px] px-6 py-16">
          <h1 className="mb-4 font-feather text-heading font-extrabold text-eager-green">
            частые вопросы
          </h1>
          <p className="mb-12 text-body font-medium text-pencil-gray">
            Всё, что обычно спрашивают перед тем, как написать первый SELECT.
          </p>

          <div className="mb-12 grid gap-4">
            {faq.map((item) => (
              <details
                key={item.q}
                className="group rounded-xl border-2 border-[#e5e5e5] p-5 open:border-eager-green"
              >
                <summary className="cursor-pointer list-none text-subheading font-bold text-charcoal">
                  {item.q}
                </summary>
                <p className="mt-3 text-body font-medium leading-relaxed text-pencil-gray">
                  {item.a}
                </p>
              </details>
            ))}
          </div>

          <div className="rounded-xl bg-storybook-green p-8 text-center">
            <h2 className="mb-3 font-feather text-heading-sm font-extrabold text-charcoal">
              Остались вопросы?
            </h2>
            <p className="mx-auto mb-6 max-w-[480px] text-body font-medium text-charcoal">
              Лучший способ понять Скрипткин — открыть первый квест и
              написать SELECT * FROM passengers.
            </p>
            <Button href="/quests/midnight-express">Попробовать</Button>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
