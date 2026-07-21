import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Как это работает — Скрипткин",
  description:
    "Осваивай SQL через сюжетные квесты и банк заданий: настоящий PostgreSQL, подсказки, автоматическая проверка и практика от SELECT до оконных функций.",
};

const topics = [
  {
    level: "Начни с основ",
    number: "01",
    color: "text-eager-green",
    surface: "bg-[#f2ffe9] border-[#cceeb4]",
    items: ["SELECT и WHERE", "ORDER BY и LIMIT", "CASE и работа со строками"],
  },
  {
    level: "Связывай данные",
    number: "02",
    color: "text-spark-blue",
    surface: "bg-[#eef9ff] border-[#c6eafa]",
    items: ["JOIN и LEFT JOIN", "GROUP BY и HAVING", "Подзапросы и EXISTS"],
  },
  {
    level: "Решай сложное",
    number: "03",
    color: "text-night-ink",
    surface: "bg-[#f1f2f8] border-[#d9dbea]",
    items: ["CTE и WITH", "Оконные функции", "Даты, интервалы и аналитика"],
  },
];

export default function HowItWorksPage() {
  return (
    <>
      <Header />
      <main className="flex-1 overflow-hidden bg-[#fbfbfb]">
        <section className="relative bg-night-ink text-paper-white">
          <div className="absolute -left-32 -top-32 h-80 w-80 rounded-full bg-eager-green/15 blur-3xl" />
          <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-spark-blue/15 blur-3xl" />
          <div className="relative mx-auto grid max-w-[1200px] items-center gap-12 px-6 py-16 lg:grid-cols-[1.02fr_0.98fr] lg:py-24">
            <div>
              <p className="mb-5 inline-flex rounded-full border border-[#303665] bg-[#121744] px-4 py-2 text-caption font-extrabold uppercase tracking-[0.12em] text-fresh-leaf">
                SQL-квесты + свободная практика
              </p>
              <h1 className="mb-6 font-feather text-heading font-black leading-[1.08] sm:text-display">
                Не заучивай SQL.
                <span className="block text-eager-green">Расследуй данные.</span>
              </h1>
              <p className="mb-8 max-w-[620px] text-body font-medium leading-relaxed text-[#c8ccea]">
                На Скрипткине каждая команда сразу становится инструментом.
                Находи улики в сюжетных квестах, а потом закрепляй навык в
                банке заданий на тех же базах данных.
              </p>
              <div className="flex flex-wrap gap-3">
                <Link
                  href="/quests/midnight-express"
                  className="inline-flex items-center justify-center rounded-xl bg-eager-green px-6 py-3 text-nav-label font-extrabold uppercase text-paper-white transition-colors hover:bg-[#4cb002]"
                >
                  Начать квест
                </Link>
                <Link
                  href="/practice"
                  className="inline-flex items-center justify-center rounded-xl border-2 border-[#4e568b] px-6 py-3 text-nav-label font-extrabold uppercase text-paper-white transition-colors hover:border-spark-blue hover:text-spark-blue"
                >
                  Открыть банк заданий
                </Link>
              </div>
              <div className="mt-10 flex flex-wrap gap-x-8 gap-y-4 text-caption font-bold uppercase tracking-wide text-[#9ca3cd]">
                <span><b className="mr-2 text-xl text-paper-white">50</b> заданий</span>
                <span><b className="mr-2 text-xl text-paper-white">5</b> таблиц</span>
                <span><b className="mr-2 text-xl text-paper-white">0 ₽</b> для старта</span>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[560px]">
              <div className="absolute -inset-4 rotate-2 rounded-[24px] border border-[#3a4176] bg-[#111642]" />
              <div className="relative overflow-hidden rounded-[20px] border-2 border-[#3a4176] bg-[#080c32] shadow-2xl">
                <div className="flex items-center justify-between border-b border-[#343a6b] px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-[#ffd76a]" />
                    <span className="h-2.5 w-2.5 rounded-full bg-eager-green" />
                  </div>
                  <span className="text-caption font-bold uppercase text-[#8d94be]">
                    Дело №13
                  </span>
                </div>
                <Image
                  src="/quests/midnight-express/prew.png"
                  alt="Ночной поезд из квеста Полночный экспресс"
                  width={900}
                  height={450}
                  priority
                  className="aspect-[2/1] w-full object-cover"
                />
                <div className="grid grid-cols-[1fr_auto] items-center gap-4 p-5">
                  <div>
                    <p className="text-caption font-extrabold uppercase tracking-wide text-fresh-leaf">
                      Полночный экспресс
                    </p>
                    <p className="mt-1 font-mono text-[14px] text-[#dfe3ff]">
                      SELECT * FROM clues WHERE time = &apos;03:12&apos;
                    </p>
                  </div>
                  <span className="flex h-11 w-11 items-center justify-center rounded-full bg-eager-green text-xl font-black">
                    →
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <nav className="border-b-2 border-[#ececec] bg-paper-white">
          <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-6 py-4 text-caption font-extrabold uppercase text-pencil-gray">
            <a href="#quest" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-[#f3f3f3] hover:text-charcoal">1. Выбери историю</a>
            <a href="#editor" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-[#f3f3f3] hover:text-charcoal">2. Напиши SQL</a>
            <a href="#check" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-[#f3f3f3] hover:text-charcoal">3. Получи ответ</a>
            <a href="#practice" className="whitespace-nowrap rounded-full px-4 py-2 hover:bg-[#f3f3f3] hover:text-charcoal">4. Закрепи навык</a>
          </div>
        </nav>

        <section className="mx-auto max-w-[1200px] px-6 py-20 sm:py-28">
          <div className="mx-auto mb-16 max-w-[720px] text-center">
            <p className="mb-3 text-caption font-extrabold uppercase tracking-[0.12em] text-spark-blue">
              Один понятный маршрут
            </p>
            <h2 className="font-feather text-heading-sm font-black text-charcoal sm:text-heading">
              От первой улики до уверенного запроса
            </h2>
            <p className="mt-4 text-body font-medium leading-relaxed text-pencil-gray">
              Теория появляется ровно тогда, когда нужна для решения. Ты сразу
              применяешь её на настоящих данных и видишь результат.
            </p>
          </div>

          <div className="space-y-24 sm:space-y-32">
            <article id="quest" className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <StepLabel number="01" label="Сюжетный квест" />
                <h3 className="mb-4 font-feather text-heading-sm font-black text-charcoal">
                  Выбираешь историю, а не учебник
                </h3>
                <p className="mb-6 text-body font-medium leading-relaxed text-pencil-gray">
                  В ночном поезде найдено тело. Камер нет, связь пропала, а
                  убийца всё ещё среди пассажиров. В твоём распоряжении — база
                  поезда и вопросы, на которые можно ответить только запросами.
                </p>
                <FeatureList items={[
                  "Каждый SQL-запрос двигает сюжет",
                  "Задания начинаются с простого SELECT",
                  "Подсказки объясняют нужную конструкцию",
                ]} />
              </div>
              <div className="order-1 lg:order-2">
                <div className="overflow-hidden rounded-[20px] border-2 border-[#e4e4e4] bg-paper-white p-3 shadow-[0_18px_60px_rgba(0,0,0,0.08)]">
                  <Image
                    src="/quests/midnight-express/prew.png"
                    alt="Обложка квеста Полночный экспресс"
                    width={900}
                    height={450}
                    className="aspect-[2/1] w-full rounded-xl object-cover"
                  />
                  <div className="flex items-center justify-between gap-4 p-4 pb-2">
                    <div>
                      <p className="text-caption font-extrabold uppercase text-eager-green">Квест для новичка</p>
                      <p className="mt-1 text-subheading font-extrabold text-charcoal">Восемь запросов — восемь улик</p>
                    </div>
                    <span className="text-4xl">🚂</span>
                  </div>
                </div>
              </div>
            </article>

            <article id="editor" className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <ScreenshotFrame
                src="/how-it-works/sql-editor.webp"
                alt="SQL-редактор Скрипткина с запросом"
                title="Настоящий SQL-редактор"
              >
                <EditorMockup />
              </ScreenshotFrame>
              <div>
                <StepLabel number="02" label="Практика в браузере" />
                <h3 className="mb-4 font-feather text-heading-sm font-black text-charcoal">
                  Пишешь настоящий PostgreSQL
                </h3>
                <p className="mb-6 text-body font-medium leading-relaxed text-pencil-gray">
                  Это не тест с вариантами ответа. Пиши запрос так, как написал
                  бы его в рабочем проекте: с подсветкой синтаксиса,
                  автодополнением таблиц и быстрым запуском с клавиатуры.
                </p>
                <FeatureList items={[
                  "Подсветка синтаксиса и автодополнение",
                  "Настоящие результаты и ошибки PostgreSQL",
                  "Безопасная база только для чтения",
                ]} />
              </div>
            </article>

            <article id="check" className="grid scroll-mt-24 items-center gap-10 lg:grid-cols-2 lg:gap-16">
              <div className="order-2 lg:order-1">
                <StepLabel number="03" label="Мгновенная обратная связь" />
                <h3 className="mb-4 font-feather text-heading-sm font-black text-charcoal">
                  Видишь данные и понимаешь ошибку
                </h3>
                <p className="mb-6 text-body font-medium leading-relaxed text-pencil-gray">
                  Система проверяет не текст запроса, а его результат. Решение
                  можно написать по-разному. Если ответ не совпал, ты узнаешь,
                  чего не хватает: колонок, строк, фильтра или сортировки.
                </p>
                <FeatureList items={[
                  "Подходят разные правильные решения",
                  "Понятные подсказки без спойлера",
                  "Следующая глава открывается сразу",
                ]} />
              </div>
              <div className="order-1 lg:order-2">
                <CheckMockup />
              </div>
            </article>
          </div>
        </section>

        <section id="practice" className="scroll-mt-20 bg-night-ink py-20 text-paper-white sm:py-28">
          <div className="mx-auto grid max-w-[1200px] items-center gap-12 px-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
            <div>
              <StepLabel number="04" label="Банк заданий" dark />
              <h2 className="mb-5 font-feather text-heading-sm font-black sm:text-heading">
                Сюжет закончился —
                <span className="block text-eager-green">практика продолжается</span>
              </h2>
              <p className="mb-7 text-body font-medium leading-relaxed text-[#c8ccea]">
                В банке заданий можно свободно работать с базами уже знакомых
                квестов. Для «Полуночного экспресса» доступно 50 упражнений —
                от простых фильтров до CTE и оконных функций.
              </p>
              <div className="mb-8 grid grid-cols-3 gap-3">
                <Stat value="16" label="лёгких" />
                <Stat value="18" label="средних" />
                <Stat value="16" label="сложных" />
              </div>
              <Link
                href="/practice"
                className="inline-flex items-center justify-center rounded-xl bg-eager-green px-6 py-3 text-nav-label font-extrabold uppercase text-paper-white transition-colors hover:bg-[#4cb002]"
              >
                Выбрать базу →
              </Link>
            </div>
            <ScreenshotFrame
              src="/how-it-works/task-bank.webp"
              alt="Банк заданий Скрипткина"
              title="50 заданий на базе квеста"
              dark
            >
              <TaskBankMockup />
            </ScreenshotFrame>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-20 sm:py-28">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <ScreenshotFrame
              src="/how-it-works/quest-progress.webp"
              alt="Карта прогресса SQL-квеста"
              title="Прогресс всегда перед глазами"
            >
              <ProgressMockup />
            </ScreenshotFrame>
            <div>
              <StepLabel number="05" label="Твой прогресс" />
              <h2 className="mb-4 font-feather text-heading-sm font-black text-charcoal">
                Возвращайся с того же места
              </h2>
              <p className="mb-6 text-body font-medium leading-relaxed text-pencil-gray">
                С аккаунтом прогресс квестов хранится между устройствами. В
                банке заданий решённые упражнения отмечаются автоматически,
                поэтому всегда понятно, что уже освоено и куда двигаться дальше.
              </p>
              <FeatureList items={[
                "Карта открытых глав квеста",
                "Отдельный прогресс каждой тренировочной базы",
                "Можно тренироваться без регистрации",
              ]} />
            </div>
          </div>
        </section>

        <section className="border-y-2 border-[#ececec] bg-paper-white py-20 sm:py-24">
          <div className="mx-auto max-w-[1200px] px-6">
            <div className="mb-10 max-w-[680px]">
              <p className="mb-3 text-caption font-extrabold uppercase tracking-[0.12em] text-spark-blue">Программа обучения</p>
              <h2 className="font-feather text-heading-sm font-black text-charcoal sm:text-heading">Растёшь вместе со сложностью запросов</h2>
            </div>
            <div className="grid gap-5 md:grid-cols-3">
              {topics.map((topic) => (
                <article key={topic.level} className={`rounded-[20px] border-2 p-6 ${topic.surface}`}>
                  <p className={`mb-8 text-heading-sm font-black ${topic.color}`}>{topic.number}</p>
                  <h3 className="mb-4 text-subheading font-extrabold text-charcoal">{topic.level}</h3>
                  <ul className="space-y-3">
                    {topic.items.map((item) => (
                      <li key={item} className="flex gap-2 text-[15px] font-bold text-pencil-gray">
                        <span className={topic.color}>✓</span> {item}
                      </li>
                    ))}
                  </ul>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-20 sm:py-28">
          <div className="rounded-[24px] bg-storybook-green px-6 py-12 text-center sm:px-12 sm:py-16">
            <p className="mb-3 text-caption font-extrabold uppercase tracking-[0.12em] text-[#3f9900]">Попробуй сейчас</p>
            <h2 className="mx-auto mb-4 max-w-[720px] font-feather text-heading-sm font-black text-charcoal sm:text-heading">
              Первый запрос можно выполнить через минуту
            </h2>
            <p className="mx-auto mb-8 max-w-[620px] text-body font-medium text-charcoal">
              Начни с истории или сразу открой свободную практику. Установка
              PostgreSQL и регистрация для старта не нужны.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href="/quests/midnight-express" className="rounded-xl bg-eager-green px-6 py-3 text-nav-label font-extrabold uppercase text-paper-white hover:bg-[#4cb002]">Начать квест</Link>
              <Link href="/practice" className="rounded-xl border-2 border-[#9dcc79] bg-paper-white px-6 py-3 text-nav-label font-extrabold uppercase text-spark-blue hover:border-spark-blue">Банк заданий</Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function StepLabel({
  number,
  label,
  dark = false,
}: {
  number: string;
  label: string;
  dark?: boolean;
}) {
  return (
    <p className={`mb-4 text-caption font-extrabold uppercase tracking-[0.12em] ${dark ? "text-fresh-leaf" : "text-eager-green"}`}>
      <span className={`mr-2 inline-flex h-8 w-8 items-center justify-center rounded-full ${dark ? "bg-[#1b214f]" : "bg-[#efffdf]"}`}>
        {number}
      </span>
      {label}
    </p>
  );
}

function FeatureList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-3 text-[15px] font-bold text-charcoal">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-storybook-green text-[12px] text-[#3f9900]">✓</span>
          {item}
        </li>
      ))}
    </ul>
  );
}

function ScreenshotFrame({
  src,
  alt,
  title,
  dark = false,
  children,
}: {
  src: string;
  alt: string;
  title: string;
  dark?: boolean;
  children: React.ReactNode;
}) {
  const hasScreenshot = existsSync(join(process.cwd(), "public", src));

  return (
    <figure className={`overflow-hidden rounded-[20px] border-2 shadow-[0_18px_60px_rgba(0,0,0,0.12)] ${dark ? "border-[#343a6b] bg-[#080c32]" : "border-[#e4e4e4] bg-paper-white"}`}>
      <div className={`flex items-center justify-between border-b px-4 py-3 ${dark ? "border-[#343a6b]" : "border-[#e8e8e8]"}`}>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffd76a]" />
          <span className="h-2.5 w-2.5 rounded-full bg-eager-green" />
        </div>
        <figcaption className={`text-caption font-bold ${dark ? "text-[#9ca3cd]" : "text-pencil-gray"}`}>{title}</figcaption>
      </div>
      {hasScreenshot ? (
        <Image src={src} alt={alt} width={1200} height={760} className="h-auto w-full" />
      ) : (
        children
      )}
    </figure>
  );
}

function EditorMockup() {
  return (
    <div className="bg-night-ink p-5 font-mono text-[13px] leading-7 sm:p-6 sm:text-[14px]">
      <p><span className="mr-5 text-[#59618f]">1</span><span className="font-bold text-spark-blue">SELECT</span> <span className="text-[#e8ecff]">p.name, t.purchased_at</span></p>
      <p><span className="mr-5 text-[#59618f]">2</span><span className="font-bold text-spark-blue">FROM</span> <span className="text-fresh-leaf">passengers</span> <span className="text-[#e8ecff]">p</span></p>
      <p><span className="mr-5 text-[#59618f]">3</span><span className="font-bold text-spark-blue">JOIN</span> <span className="text-fresh-leaf">tickets</span> <span className="text-[#e8ecff]">t</span></p>
      <p><span className="mr-5 text-[#59618f]">4</span><span className="font-bold text-spark-blue">ON</span> <span className="text-[#e8ecff]">t.passenger_id = p.id</span></p>
      <p><span className="mr-5 text-[#59618f]">5</span><span className="font-bold text-spark-blue">ORDER BY</span> <span className="text-[#e8ecff]">t.purchased_at</span> <span className="font-bold text-spark-blue">DESC</span>;</p>
      <div className="mt-5 flex items-center justify-between border-t border-[#2c3262] pt-4 font-sans">
        <span className="text-caption font-bold text-[#8f96c0]">⌘ Enter · выполнить</span>
        <span className="rounded-xl bg-eager-green px-4 py-2 text-caption font-extrabold uppercase text-paper-white">Выполнить</span>
      </div>
    </div>
  );
}

function CheckMockup() {
  const rows = [
    ["Софья Белова", "2026-07-16"],
    ["Дарья Соколова", "2026-07-12"],
    ["Николай Крамер", "2026-07-12"],
  ];
  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-[#cceeb4] bg-paper-white shadow-[0_18px_60px_rgba(88,204,2,0.12)]">
      <div className="border-b-2 border-[#cceeb4] bg-[#f2ffe9] p-5">
        <p className="text-body font-extrabold text-[#3f9900]">✓ Задание решено</p>
        <p className="mt-1 text-[14px] font-medium text-[#5e8841]">Результат совпал с эталоном. Открыта новая улика.</p>
      </div>
      <div className="p-5">
        <div className="grid grid-cols-2 border-b-2 border-[#ededed] pb-3 text-caption font-extrabold uppercase text-pencil-gray">
          <span>name</span><span>purchased_at</span>
        </div>
        {rows.map((row) => (
          <div key={row[0]} className="grid grid-cols-2 border-b border-[#ededed] py-3 text-[14px] font-bold text-charcoal">
            <span>{row[0]}</span><span>{row[1]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function TaskBankMockup() {
  const tasks = [
    ["01", "Соседи по вагону", "Легко", "bg-eager-green"],
    ["17", "Поиск по журналу", "Легко", "bg-eager-green"],
    ["33", "Пары соседей", "Средне", "bg-spark-blue"],
    ["45", "Длинные паузы", "Сложно", "bg-[#7a82b5]"],
  ];
  return (
    <div className="bg-[#080c32] p-5 sm:p-6">
      <div className="mb-5 flex items-center justify-between">
        <div><p className="text-caption font-extrabold uppercase text-fresh-leaf">Полночный экспресс</p><p className="mt-1 text-subheading font-extrabold text-paper-white">Выбери задание</p></div>
        <span className="rounded-full bg-[#1b214f] px-3 py-1 text-caption font-bold text-[#bbc1e5]">12 / 50</span>
      </div>
      <div className="space-y-2">
        {tasks.map(([number, title, level, color], index) => (
          <div key={number} className={`flex items-center gap-3 rounded-xl border p-3 ${index === 0 ? "border-eager-green bg-[#17233a]" : "border-[#2d3466] bg-[#111642]"}`}>
            <span className={`flex h-9 w-9 items-center justify-center rounded-full ${color} text-caption font-black text-paper-white`}>{number}</span>
            <span className="grow text-[14px] font-extrabold text-paper-white">{title}</span>
            <span className="text-caption font-bold text-[#949bc6]">{level}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressMockup() {
  return (
    <div className="bg-[#f8f8f8] p-6 sm:p-8">
      <div className="mb-7 flex items-center justify-between">
        <div><p className="text-caption font-extrabold uppercase text-eager-green">Полночный экспресс</p><p className="mt-1 text-subheading font-extrabold text-charcoal">Карта расследования</p></div>
        <span className="text-3xl">🚂</span>
      </div>
      <div className="relative flex items-center justify-between">
        <div className="absolute left-5 right-5 top-5 h-1 bg-[#dcdcdc]" />
        {["✓", "✓", "✓", "4", "5", "🏆"].map((value, index) => (
          <div key={`${value}-${index}`} className={`relative flex h-11 w-11 items-center justify-center rounded-full border-b-4 text-[14px] font-black ${index < 3 ? "border-[#43a300] bg-eager-green text-paper-white" : index === 3 ? "border-[#43a300] bg-paper-white text-eager-green ring-4 ring-storybook-green" : "border-[#cfcfcf] bg-[#e5e5e5] text-faded-gray"}`}>
            {value}
          </div>
        ))}
      </div>
      <div className="mt-7 h-2 overflow-hidden rounded-full bg-[#dfdfdf]"><div className="h-full w-1/2 rounded-full bg-eager-green" /></div>
      <p className="mt-2 text-right text-caption font-bold text-pencil-gray">3 из 8 улик найдено</p>
    </div>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="rounded-xl border border-[#303665] bg-[#111642] p-3 text-center">
      <p className="text-heading-sm font-black text-paper-white">{value}</p>
      <p className="text-caption font-bold text-[#9ca3cd]">{label}</p>
    </div>
  );
}
