import type { Quest } from "./types";

export const COMING_SOON_PRICE_RUB = 500;

/**
 * Демо-каталог квестов. Используется как fallback, пока база данных
 * не поднята или не заполнена (см. db/seed.sql и db/quests/ — те же данные).
 */
export const DEMO_QUESTS: Quest[] = [
  {
    slug: "midnight-express",
    title: "Полночный экспресс",
    tagline:
      "Ночной поезд Москва — Петербург. В 03:12 в купе №7 нашли тело.",
    intro:
      "23:55, Москва, Ленинградский вокзал. Ночной экспресс №13 отправляется в Петербург: пять вагонов и пять промежуточных остановок. " +
      "В 03:12 пассажира из купе 7 находят мёртвым. Врач говорит — сердечный приступ, но слишком многое не сходится. " +
      "Закрытый поезд, двенадцать попутчиков и база данных. Найди убийцу — запрос за запросом.",
    difficulty: "beginner",
    stepsCount: 7,
    emoji: "🚂",
    status: "available",
    priceKopecks: 0,
    previewUrl: "/quests/midnight-express/preview.webp",
  },
  {
    slug: "prometheus-beginner",
    title: "Прометей · Новичок",
    tagline:
      "Та же катастрофа на «Прометее», но SQL объясняется с самых основ — шаг за шагом.",
    intro:
      "Инженер-механик Артём Вейл прибывает к потерявшему связь грузовому кораблю «Прометей». После стыковки челнок оказывается заблокирован, аварийное освещение едва работает, а экипаж не отвечает. В этой версии расследования каждая команда SQL разбирается отдельно: от первого SELECT и WHERE до более сложных запросов.",
    difficulty: "beginner",
    stepsCount: 18,
    emoji: "🛰️",
    status: "available",
    priceKopecks: 0,
    previewUrl: "/quests/prometheus/preview.webp",
  },
  {
    slug: "submarine-crash",
    title: "Крушение подлодки",
    tagline:
      "Субмарина «Кальмар» легла на грунт. Судовой журнал уцелел — он в базе данных.",
    intro:
      "3:47 ночи. Подлодка «Кальмар» перестала выходить на связь и легла на дно Норвежского моря. " +
      "Ты — аналитик спасательной операции. Всё, что у тебя есть, — резервная копия бортовой базы данных: " +
      "журналы отсеков, датчики, список экипажа. Каждый правильный запрос приближает спасателей к выжившим.",
    difficulty: "beginner",
    stepsCount: 8,
    emoji: "🌊",
    status: "coming_soon",
    priceKopecks: 50000,
    previewUrl: "/quests/submarine-crash/preview.webp",
  },
  {
    slug: "midnight-heist",
    title: "Ограбление галереи",
    tagline:
      "Из галереи исчезла картина. Логи пропусков и камер уже ждут твоих JOIN-ов.",
    intro:
      "Ночью из городской галереи пропало полотно XVII века. Сигнализация молчала. " +
      "У следствия есть база: сотрудники, пропуска, записи камер и график смен. Найди вора раньше, чем он покинет город.",
    difficulty: "intermediate",
    stepsCount: 10,
    emoji: "🖼️",
    status: "coming_soon",
    priceKopecks: 50000,
    previewUrl: "/quests/midnight-heist/preview.webp",
  },
  {
    slug: "mars-station",
    title: "Станция «Арес-9»",
    tagline:
      "Марсианская станция теряет кислород. Ответ спрятан в телеметрии за 400 солов.",
    intro:
      "Датчики станции «Арес-9» фиксируют медленную утечку кислорода, но не могут сказать где. " +
      "Тебе доступна телеметрия за 400 солов: миллионы показаний, оконные функции и очень мало времени.",
    difficulty: "advanced",
    stepsCount: 12,
    emoji: "🚀",
    status: "coming_soon",
    priceKopecks: 50000,
    previewUrl: "/quests/mars-station/preview.webp",
  },
  {
    slug: "prometheus",
    title: "Прометей",
    tagline:
      "Грузовой корабль потерял связь и взял курс на населённую колонию. Останови его раньше, чем рейс станет катастрофой.",
    intro:
      "Инженера-механика Артёма Вейла отправляют на грузовой корабль «Прометей», внезапно прекративший связь возле добывающей станции «Гелиос-9». " +
      "После стыковки челнок Артёма блокируется, а корабль автоматически покидает орбиту. Чтобы выбраться, инженер должен восстановить системы, раскрыть причину катастрофы и найти спасательный аппарат.",
    difficulty: "intermediate",
    stepsCount: 24,
    emoji: "🛰️",
    status: "available",
    priceKopecks: 50000,
    previewUrl: "/quests/prometheus/preview.webp",
  },
];

export function getDemoQuest(slug: string): Quest | undefined {
  return DEMO_QUESTS.find((q) => q.slug === slug);
}
