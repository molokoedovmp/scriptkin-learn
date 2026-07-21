import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/Button";
import { QuestCard } from "@/components/QuestCard";
import { DEMO_QUESTS } from "@/lib/quests";

const steps = [
  {
    number: "01",
    title: "Выбери квест",
    text: "Убийство в ночном экспрессе, затонувшая подлодка, ограбленная галерея — у каждой истории своя база данных и свой уровень сложности.",
  },
  {
    number: "02",
    title: "Пиши настоящий SQL",
    text: "Никаких симуляций: твои запросы выполняются в настоящем PostgreSQL прямо в браузере. Ошибся — читай ошибку и пробуй снова.",
  },
  {
    number: "03",
    title: "Продвигай историю",
    text: "Правильный запрос открывает новую главу сюжета и следующее задание. Дочитать историю можно только через данные.",
  },
];

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex-1">
        <section className="mx-auto flex max-w-[1200px] flex-col items-center gap-12 px-6 py-20 md:flex-row md:py-28">
          <div className="max-w-[540px]">
            <h1 className="mb-6 font-feather text-heading font-extrabold text-eager-green md:text-display">
              Учи SQL, проходя квесты
            </h1>
            <p className="mb-8 max-w-[480px] text-body font-medium text-pencil-gray">
              В купе ночного экспресса нашли мёртвого антиквара, подлодка легла
              на дно, из галереи исчезла картина. Единственный способ узнать
              правду — написать правильный SQL-запрос.
            </p>
            <div className="flex flex-wrap gap-4">
              <Button href="/quests/midnight-express">Начать бесплатно</Button>
              <Button href="/how-it-works" variant="outline">
                Как это работает
              </Button>
            </div>
          </div>
          <div className="w-full max-w-[480px]">
            <div className="rounded-xl border-2 border-night-ink bg-night-ink p-5 font-mono text-[15px] leading-relaxed">
              <p className="mb-2 text-fresh-leaf">
                -- Шаг 5: что видел проводник?
              </p>
              <p className="text-paper-white">
                SELECT event_time, note
                <br />
                FROM conductor_log
                <br />
                WHERE wagon = 4;
              </p>
              <p className="mt-4 text-spark-blue">
                ✓ 4 строки · открыта глава «Дверь тамбура»
              </p>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="mb-12 font-feather text-heading font-extrabold text-eager-green">
            сюжет. запрос. результат.
          </h2>
          <div className="grid gap-10 md:grid-cols-3">
            {steps.map((step) => (
              <div key={step.number}>
                <p className="mb-3 text-heading-sm font-extrabold text-fresh-leaf">
                  {step.number}
                </p>
                <h3 className="mb-2 text-subheading font-bold text-charcoal">
                  {step.title}
                </h3>
                <p className="text-body font-medium text-pencil-gray">
                  {step.text}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Button href="/how-it-works" variant="outline">
              Подробнее о платформе
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-20">
          <div className="overflow-hidden rounded-[24px] bg-night-ink px-6 py-10 text-paper-white sm:px-10 lg:flex lg:items-center lg:justify-between lg:gap-12">
            <div className="max-w-[650px]">
              <p className="mb-3 text-caption font-extrabold uppercase tracking-[0.12em] text-fresh-leaf">
                Банк заданий
              </p>
              <h2 className="font-feather text-heading-sm font-extrabold sm:text-heading">
                50 упражнений на базе квеста
              </h2>
              <p className="mt-4 text-body font-medium text-[#b9c0e6]">
                Тренируй SELECT, фильтрацию, сортировку, агрегаты, GROUP BY,
                JOIN и подзапросы на данных «Полуночного экспресса». Выбирай
                сложность, запускай запросы и открывай решение после попытки.
              </p>
            </div>
            <div className="mt-7 shrink-0 lg:mt-0">
              <Button href="/practice">Открыть банк заданий</Button>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-20">
          <h2 className="mb-4 font-feather text-heading font-extrabold text-eager-green">
            выбери свою историю
          </h2>
          <p className="mb-12 max-w-[480px] text-body font-medium text-pencil-gray">
            Начни с «Полночного экспресса» — детектив в духе Агаты Кристи для
            новичков: от первого SELECT до GROUP BY за одну ночную поездку.
            Остальные квесты уже в пути.
          </p>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {DEMO_QUESTS.map((quest) => (
              <QuestCard key={quest.slug} quest={quest} />
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-[1200px] px-6 py-20 text-center">
          <h2 className="mb-6 font-feather text-heading font-extrabold text-eager-green">
            поезд отправляется
          </h2>
          <p className="mx-auto mb-8 max-w-[480px] text-body font-medium text-pencil-gray">
            Первый запрос можно написать через минуту — бесплатно, без
            регистрации и установки базы данных.
          </p>
          <Button href="/quests/midnight-express">Сесть на экспресс</Button>
        </section>
      </main>
      <Footer />
    </>
  );
}
