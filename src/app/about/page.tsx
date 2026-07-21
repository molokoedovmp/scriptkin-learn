import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";

export const metadata: Metadata = {
  title: "О проекте — Скрипткин",
  description:
    "Скрипткин — открытая платформа для обучения SQL через детективные квесты с сюжетом. Зачем мы её делаем и что будет дальше.",
};

export default function AboutPage() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <div className="mx-auto max-w-[800px] px-6 py-16">
        <h1 className="mb-4 font-feather text-heading font-extrabold text-eager-green">
          о проекте
        </h1>
        <p className="mb-10 text-body font-medium leading-relaxed text-pencil-gray">
          Скрипткин — платформа для обучения SQL через игровые квесты с
          сюжетом. Мы верим, что запрос к базе данных запоминается не тогда,
          когда его переписал из учебника, а тогда, когда он помог поймать
          преступника.
        </p>

        <section className="mb-10">
          <h2 className="mb-3 text-heading-sm font-extrabold text-charcoal">
            Почему сюжет
          </h2>
          <p className="mb-4 text-body font-medium leading-relaxed text-pencil-gray">
            Классические курсы SQL устроены как справочник: вот SELECT, вот
            JOIN, вот сто упражнений про сотрудников и отделы. Знания есть —
            мотивации нет. Скрипткин переворачивает схему: сначала появляется
            вопрос, на который очень хочется узнать ответ («кто был в вагоне,
            когда хлопнула дверь тамбура?»), а SQL оказывается единственным
            способом его получить.
          </p>
          <p className="text-body font-medium leading-relaxed text-pencil-gray">
            Каждая история продумана так, чтобы сложность росла незаметно: в
            первой главе ты пишешь SELECT *, в последней — уже группируешь,
            джойнишь и ищешь пассажира без билета через LEFT JOIN, не замечая,
            что «прошёл тему».
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-heading-sm font-extrabold text-charcoal">
            Всё по-настоящему
          </h2>
          <p className="text-body font-medium leading-relaxed text-pencil-gray">
            Запросы выполняются в настоящем PostgreSQL — том же, что крутится в
            продакшене у половины интернета. Ошибки — настоящие ошибки
            Postgres, данные — настоящие таблицы, которые можно исследовать
            любыми SELECT-ами, а не только «правильным» способом. Навык,
            который ты получаешь, переносится на работу один в один.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-3 text-heading-sm font-extrabold text-charcoal">
            Что уже работает
          </h2>
          <ul className="grid gap-2 text-body font-medium text-pencil-gray">
            <li>
              — первый квест{" "}
              <Link
                href="/quests/midnight-express"
                className="font-bold text-spark-blue"
              >
                «Полночный экспресс»
              </Link>{" "}
              — детектив на 8 шагов для новичков;
            </li>
            <li>— SQL-терминал с проверкой ответов и подсказками;</li>
            <li>— аккаунты и сохранение прогресса между устройствами;</li>
            <li>— личный кабинет со статистикой.</li>
          </ul>
        </section>

        <section className="mb-12">
          <h2 className="mb-3 text-heading-sm font-extrabold text-charcoal">
            Что дальше
          </h2>
          <ul className="grid gap-2 text-body font-medium text-pencil-gray">
            <li>
              — «Крушение подлодки» — квест про затонувшую субмарину «Кальмар»;
            </li>
            <li>— «Ограбление галереи» — детектив среднего уровня про JOIN-ы;</li>
            <li>
              — «Станция „Арес-9“» — продвинутый квест с оконными функциями;
            </li>
            <li>— рейтинг игроков и конструктор собственных квестов.</li>
          </ul>
        </section>

        <div className="rounded-xl border-2 border-[#e5e5e5] p-8 text-center">
          <h2 className="mb-3 font-feather text-heading-sm font-extrabold text-eager-green">
            присоединяйся
          </h2>
          <p className="mx-auto mb-6 max-w-[480px] text-body font-medium text-pencil-gray">
            Скрипткин бесплатный. Всё, что нужно, — браузер и полчаса на первую
            главу.
          </p>
          <Button href="/register">Создать аккаунт</Button>
        </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
