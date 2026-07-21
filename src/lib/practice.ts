import "server-only";

import type { PracticeDatabase, PracticeTask } from "./types";

interface ServerPracticeTask extends PracticeTask {
  expectedSql: string;
}

interface ServerPracticeDatabase extends Omit<PracticeDatabase, "tasks"> {
  tasks: ServerPracticeTask[];
}

const MIDNIGHT_EXPRESS: ServerPracticeDatabase = {
  questSlug: "midnight-express",
  title: "Полночный экспресс",
  emoji: "🚂",
  description:
    "Пять связанных таблиц ночного поезда: пассажиры, билеты, багаж, маршрут и журнал проводника. Задания не меняют прогресс квеста — здесь можно спокойно экспериментировать.",
  tables: [
    {
      name: "passengers",
      description: "12 пассажиров поезда",
      columns: ["id", "name", "age", "occupation", "wagon", "compartment"],
    },
    {
      name: "tickets",
      description: "Купленные билеты",
      columns: [
        "id",
        "passenger_id",
        "from_station",
        "to_station",
        "price",
        "purchased_at",
      ],
    },
    {
      name: "stations",
      description: "Остановки по маршруту",
      columns: ["id", "name", "arrival_time", "stop_minutes"],
    },
    {
      name: "conductor_log",
      description: "Ночные записи проводника",
      columns: ["id", "wagon", "event_time", "note"],
    },
    {
      name: "luggage",
      description: "Зарегистрированный багаж",
      columns: ["id", "passenger_id", "description", "weight_kg"],
    },
  ],
  tasks: [
    {
      id: "wagon-four",
      number: 1,
      title: "Соседи по вагону",
      difficulty: "easy",
      description:
        "Выведи имена и номера купе всех пассажиров вагона №4. Назови колонки `name` и `compartment`, отсортируй сначала по купе, затем по имени.",
      hint: "Нужны WHERE wagon = 4 и ORDER BY по двум колонкам.",
      starterSql: "SELECT\n  \nFROM passengers",
      solution:
        "SELECT name, compartment\nFROM passengers\nWHERE wagon = 4\nORDER BY compartment, name",
      expectedSql:
        "SELECT name, compartment FROM passengers WHERE wagon = 4 ORDER BY compartment, name",
      orderMatters: true,
    },
    {
      id: "long-stops",
      number: 2,
      title: "Долгие остановки",
      difficulty: "easy",
      description:
        "Найди станции, где поезд стоит не меньше двух минут. Верни `name` и `stop_minutes` в хронологическом порядке прибытия.",
      hint: "Сравни stop_minutes с 2, а сортируй по arrival_time.",
      starterSql: "SELECT\n  \nFROM stations",
      solution:
        "SELECT name, stop_minutes\nFROM stations\nWHERE stop_minutes >= 2\nORDER BY arrival_time",
      expectedSql:
        "SELECT name, stop_minutes FROM stations WHERE stop_minutes >= 2 ORDER BY arrival_time",
      orderMatters: true,
    },
    {
      id: "heavy-luggage",
      number: 3,
      title: "Тяжёлый багаж",
      difficulty: "easy",
      description:
        "Покажи багаж тяжелее 8 кг: имя владельца, описание и вес. Колонки — `name`, `description`, `weight_kg`; самые тяжёлые вещи должны быть первыми.",
      hint: "Свяжи luggage с passengers по passenger_id и id.",
      starterSql:
        "SELECT\n  \nFROM luggage AS l\nJOIN passengers AS p ON ...",
      solution:
        "SELECT p.name, l.description, l.weight_kg\nFROM luggage AS l\nJOIN passengers AS p ON p.id = l.passenger_id\nWHERE l.weight_kg > 8\nORDER BY l.weight_kg DESC",
      expectedSql:
        "SELECT p.name, l.description, l.weight_kg FROM luggage AS l JOIN passengers AS p ON p.id = l.passenger_id WHERE l.weight_kg > 8 ORDER BY l.weight_kg DESC",
      orderMatters: true,
    },
    {
      id: "age-groups",
      number: 4,
      title: "Возрастные группы",
      difficulty: "easy",
      description:
        "Раздели пассажиров на группы: младше 30 — `до 30`, от 30 до 49 — `30–49`, остальные — `50+`. Верни `name`, `age`, вычисленную колонку `age_group`; сортировка по возрасту и имени.",
      hint: "Используй CASE WHEN ... THEN ... ELSE ... END AS age_group.",
      starterSql: "SELECT\n  name,\n  age,\n  CASE\n    \n  END AS age_group\nFROM passengers",
      solution:
        "SELECT name, age,\n  CASE\n    WHEN age < 30 THEN 'до 30'\n    WHEN age < 50 THEN '30–49'\n    ELSE '50+'\n  END AS age_group\nFROM passengers\nORDER BY age, name",
      expectedSql:
        "SELECT name, age, CASE WHEN age < 30 THEN 'до 30' WHEN age < 50 THEN '30–49' ELSE '50+' END AS age_group FROM passengers ORDER BY age, name",
      orderMatters: true,
    },
    {
      id: "ticketless-passenger",
      number: 5,
      title: "Безбилетный пассажир",
      difficulty: "medium",
      description:
        "Найди пассажиров, которым не соответствует ни одного билета. Верни `name`, `wagon`, `compartment` по алфавиту.",
      hint: "Сохрани всех пассажиров через LEFT JOIN, затем найди строки, где билет отсутствует.",
      starterSql:
        "SELECT\n  \nFROM passengers AS p\nLEFT JOIN tickets AS t ON ...",
      solution:
        "SELECT p.name, p.wagon, p.compartment\nFROM passengers AS p\nLEFT JOIN tickets AS t ON t.passenger_id = p.id\nWHERE t.id IS NULL\nORDER BY p.name",
      expectedSql:
        "SELECT p.name, p.wagon, p.compartment FROM passengers AS p LEFT JOIN tickets AS t ON t.passenger_id = p.id WHERE t.id IS NULL ORDER BY p.name",
      orderMatters: true,
    },
    {
      id: "wagon-load",
      number: 6,
      title: "Загрузка вагонов",
      difficulty: "medium",
      description:
        "Посчитай пассажиров в каждом вагоне. Верни `wagon` и `passenger_count`, отсортируй по номеру вагона.",
      hint: "Сгруппируй строки по wagon и примени COUNT(*). Не забудь псевдоним.",
      starterSql: "SELECT\n  wagon,\n  COUNT(*) AS passenger_count\nFROM passengers",
      solution:
        "SELECT wagon, COUNT(*) AS passenger_count\nFROM passengers\nGROUP BY wagon\nORDER BY wagon",
      expectedSql:
        "SELECT wagon, COUNT(*) AS passenger_count FROM passengers GROUP BY wagon ORDER BY wagon",
      orderMatters: true,
    },
    {
      id: "popular-destinations",
      number: 7,
      title: "Популярные направления",
      difficulty: "medium",
      description:
        "Для направлений, куда купили хотя бы два билета, выведи `to_station`, число билетов `ticket_count` и округлённую среднюю цену `avg_price`. Самая высокая средняя цена — первой.",
      hint: "Фильтр по результату COUNT задаётся через HAVING, а не WHERE.",
      starterSql:
        "SELECT\n  to_station,\n  COUNT(*) AS ticket_count,\n  \nFROM tickets",
      solution:
        "SELECT to_station,\n  COUNT(*) AS ticket_count,\n  ROUND(AVG(price)) AS avg_price\nFROM tickets\nGROUP BY to_station\nHAVING COUNT(*) >= 2\nORDER BY avg_price DESC",
      expectedSql:
        "SELECT to_station, COUNT(*) AS ticket_count, ROUND(AVG(price)) AS avg_price FROM tickets GROUP BY to_station HAVING COUNT(*) >= 2 ORDER BY avg_price DESC",
      orderMatters: true,
    },
    {
      id: "critical-timeline",
      number: 8,
      title: "Критический отрезок",
      difficulty: "medium",
      description:
        "Восстанови события четвёртого вагона с 02:40 до 03:15 включительно. Верни `event_time` и `note` по времени.",
      hint: "Для границ времени подойдут BETWEEN и литералы TIME '02:40'.",
      starterSql:
        "SELECT event_time, note\nFROM conductor_log\nWHERE wagon = 4",
      solution:
        "SELECT event_time, note\nFROM conductor_log\nWHERE wagon = 4\n  AND event_time BETWEEN TIME '02:40' AND TIME '03:15'\nORDER BY event_time",
      expectedSql:
        "SELECT event_time, note FROM conductor_log WHERE wagon = 4 AND event_time BETWEEN TIME '02:40' AND TIME '03:15' ORDER BY event_time",
      orderMatters: true,
    },
    {
      id: "last-ticket",
      number: 9,
      title: "Последняя покупка",
      difficulty: "hard",
      description:
        "Определи, кто купил билет последним. Верни ровно одну строку с колонками `name` и `purchased_at`.",
      hint: "Соедини билеты с пассажирами, отсортируй дату по убыванию и возьми LIMIT 1.",
      starterSql:
        "SELECT\n  \nFROM tickets AS t\nJOIN passengers AS p ON ...",
      solution:
        "SELECT p.name, t.purchased_at\nFROM tickets AS t\nJOIN passengers AS p ON p.id = t.passenger_id\nORDER BY t.purchased_at DESC, t.id DESC\nLIMIT 1",
      expectedSql:
        "SELECT p.name, t.purchased_at FROM tickets AS t JOIN passengers AS p ON p.id = t.passenger_id ORDER BY t.purchased_at DESC, t.id DESC LIMIT 1",
      orderMatters: true,
    },
    {
      id: "luggage-totals",
      number: 10,
      title: "Вес на пассажира",
      difficulty: "hard",
      description:
        "Посчитай общий вес багажа каждого пассажира, включая тех, у кого его нет. Верни `name` и `total_weight_kg`; используй 0 вместо NULL. Сортировка — по весу вниз, затем по имени.",
      hint: "Нужны LEFT JOIN, SUM, GROUP BY и COALESCE(SUM(...), 0).",
      starterSql:
        "SELECT\n  p.name,\n  \nFROM passengers AS p\nLEFT JOIN luggage AS l ON ...",
      solution:
        "SELECT p.name, COALESCE(SUM(l.weight_kg), 0) AS total_weight_kg\nFROM passengers AS p\nLEFT JOIN luggage AS l ON l.passenger_id = p.id\nGROUP BY p.id, p.name\nORDER BY total_weight_kg DESC, p.name",
      expectedSql:
        "SELECT p.name, COALESCE(SUM(l.weight_kg), 0) AS total_weight_kg FROM passengers AS p LEFT JOIN luggage AS l ON l.passenger_id = p.id GROUP BY p.id, p.name ORDER BY total_weight_kg DESC, p.name",
      orderMatters: true,
    },
    {
      id: "above-average-luggage",
      number: 11,
      title: "Тяжелее среднего",
      difficulty: "hard",
      description:
        "Сначала посчитай общий вес багажа для каждого владельца, затем найди тех, чей суммарный вес выше среднего среди владельцев багажа. Верни `name` и `total_weight_kg`, самые большие значения первыми.",
      hint: "Собери суммы в CTE, а среднее по ним вычисли во вложенном SELECT.",
      starterSql:
        "WITH luggage_totals AS (\n  SELECT\n    passenger_id,\n    SUM(weight_kg) AS total_weight_kg\n  FROM luggage\n  GROUP BY passenger_id\n)\nSELECT ...",
      solution:
        "WITH luggage_totals AS (\n  SELECT passenger_id, SUM(weight_kg) AS total_weight_kg\n  FROM luggage\n  GROUP BY passenger_id\n)\nSELECT p.name, lt.total_weight_kg\nFROM luggage_totals AS lt\nJOIN passengers AS p ON p.id = lt.passenger_id\nWHERE lt.total_weight_kg > (\n  SELECT AVG(total_weight_kg) FROM luggage_totals\n)\nORDER BY lt.total_weight_kg DESC, p.name",
      expectedSql:
        "WITH luggage_totals AS (SELECT passenger_id, SUM(weight_kg) AS total_weight_kg FROM luggage GROUP BY passenger_id) SELECT p.name, lt.total_weight_kg FROM luggage_totals AS lt JOIN passengers AS p ON p.id = lt.passenger_id WHERE lt.total_weight_kg > (SELECT AVG(total_weight_kg) FROM luggage_totals) ORDER BY lt.total_weight_kg DESC, p.name",
      orderMatters: true,
    },
    {
      id: "event-intervals",
      number: 12,
      title: "Интервалы в журнале",
      difficulty: "hard",
      description:
        "Для событий четвёртого вагона покажи `event_time`, `note` и время с предыдущей записи в колонке `since_previous`. Первая строка может содержать NULL. Порядок — хронологический.",
      hint: "Вычти LAG(event_time) OVER (ORDER BY event_time) из текущего времени.",
      starterSql:
        "SELECT\n  event_time,\n  note,\n  \nFROM conductor_log\nWHERE wagon = 4",
      solution:
        "SELECT event_time, note,\n  event_time - LAG(event_time) OVER (ORDER BY event_time) AS since_previous\nFROM conductor_log\nWHERE wagon = 4\nORDER BY event_time",
      expectedSql:
        "SELECT event_time, note, event_time - LAG(event_time) OVER (ORDER BY event_time) AS since_previous FROM conductor_log WHERE wagon = 4 ORDER BY event_time",
      orderMatters: true,
    },
    {
      id: "young-passengers",
      number: 13,
      title: "Младше тридцати",
      difficulty: "easy",
      description:
        "Найди пассажиров младше 30 лет. Верни `name` и `age`, отсортируй по возрасту и имени.",
      hint: "Используй условие age < 30.",
      starterSql: "SELECT name, age\nFROM passengers",
      solution:
        "SELECT name, age\nFROM passengers\nWHERE age < 30\nORDER BY age, name",
      expectedSql:
        "SELECT name, age FROM passengers WHERE age < 30 ORDER BY age, name",
      orderMatters: true,
    },
    {
      id: "occupation-list",
      number: 14,
      title: "Список профессий",
      difficulty: "easy",
      description:
        "Получи уникальный список профессий пассажиров в колонке `occupation` по алфавиту.",
      hint: "Убрать повторения поможет DISTINCT.",
      starterSql: "SELECT\nFROM passengers",
      solution:
        "SELECT DISTINCT occupation\nFROM passengers\nORDER BY occupation",
      expectedSql:
        "SELECT DISTINCT occupation FROM passengers ORDER BY occupation",
      orderMatters: true,
    },
    {
      id: "ticket-price-range",
      number: 15,
      title: "Билеты среднего диапазона",
      difficulty: "easy",
      description:
        "Покажи билеты ценой от 3000 до 4000 включительно: `id`, `passenger_id`, `price`. Сначала дорогие, при равной цене — по id.",
      hint: "Для закрытого диапазона подходит BETWEEN.",
      starterSql: "SELECT id, passenger_id, price\nFROM tickets",
      solution:
        "SELECT id, passenger_id, price\nFROM tickets\nWHERE price BETWEEN 3000 AND 4000\nORDER BY price DESC, id",
      expectedSql:
        "SELECT id, passenger_id, price FROM tickets WHERE price BETWEEN 3000 AND 4000 ORDER BY price DESC, id",
      orderMatters: true,
    },
    {
      id: "july-purchases",
      number: 16,
      title: "Покупки второй недели июля",
      difficulty: "easy",
      description:
        "Найди билеты, купленные с 8 по 12 июля 2026 года включительно. Верни `id` и `purchased_at` в хронологическом порядке.",
      hint: "Сравни purchased_at с двумя литералами DATE.",
      starterSql: "SELECT id, purchased_at\nFROM tickets",
      solution:
        "SELECT id, purchased_at\nFROM tickets\nWHERE purchased_at BETWEEN DATE '2026-07-08' AND DATE '2026-07-12'\nORDER BY purchased_at, id",
      expectedSql:
        "SELECT id, purchased_at FROM tickets WHERE purchased_at BETWEEN DATE '2026-07-08' AND DATE '2026-07-12' ORDER BY purchased_at, id",
      orderMatters: true,
    },
    {
      id: "log-compartment-search",
      number: 17,
      title: "Поиск по журналу",
      difficulty: "easy",
      description:
        "Найди записи проводника, в тексте которых встречается слово `купе`. Верни `event_time` и `note` по времени.",
      hint: "Для поиска части строки без учёта регистра используй ILIKE и `%`.",
      starterSql: "SELECT event_time, note\nFROM conductor_log",
      solution:
        "SELECT event_time, note\nFROM conductor_log\nWHERE note ILIKE '%купе%'\nORDER BY event_time",
      expectedSql:
        "SELECT event_time, note FROM conductor_log WHERE note ILIKE '%купе%' ORDER BY event_time",
      orderMatters: true,
    },
    {
      id: "oldest-three",
      number: 18,
      title: "Три старших пассажира",
      difficulty: "easy",
      description:
        "Выведи трёх самых старших пассажиров: `name` и `age`. При равном возрасте сортируй по имени.",
      hint: "Нужны ORDER BY DESC и LIMIT 3.",
      starterSql: "SELECT name, age\nFROM passengers",
      solution:
        "SELECT name, age\nFROM passengers\nORDER BY age DESC, name\nLIMIT 3",
      expectedSql:
        "SELECT name, age FROM passengers ORDER BY age DESC, name LIMIT 3",
      orderMatters: true,
    },
    {
      id: "name-length",
      number: 19,
      title: "Длина имени",
      difficulty: "easy",
      description:
        "Посчитай число символов в полном имени каждого пассажира. Верни `name` и `name_length`; сначала самые длинные имена.",
      hint: "Количество символов возвращает функция LENGTH.",
      starterSql: "SELECT\n  name,\n  \nFROM passengers",
      solution:
        "SELECT name, LENGTH(name) AS name_length\nFROM passengers\nORDER BY name_length DESC, name",
      expectedSql:
        "SELECT name, LENGTH(name) AS name_length FROM passengers ORDER BY name_length DESC, name",
      orderMatters: true,
    },
    {
      id: "station-stop-type",
      number: 20,
      title: "Тип остановки",
      difficulty: "easy",
      description:
        "Для каждой станции верни `name` и `stop_type`: если стоянка равна нулю — `без остановки`, иначе — `остановка`. Сохрани порядок маршрута по id.",
      hint: "Сформируй stop_type через CASE.",
      starterSql: "SELECT\n  name,\n  CASE\n  END AS stop_type\nFROM stations",
      solution:
        "SELECT name,\n  CASE WHEN stop_minutes = 0 THEN 'без остановки' ELSE 'остановка' END AS stop_type\nFROM stations\nORDER BY id",
      expectedSql:
        "SELECT name, CASE WHEN stop_minutes = 0 THEN 'без остановки' ELSE 'остановка' END AS stop_type FROM stations ORDER BY id",
      orderMatters: true,
    },
    {
      id: "ticket-discount",
      number: 21,
      title: "Цена со скидкой",
      difficulty: "easy",
      description:
        "Рассчитай цену каждого билета после скидки 10%. Верни `id`, `price` и округлённую колонку `discounted_price` по id.",
      hint: "Умножь price на 0.9 и примени ROUND.",
      starterSql: "SELECT\n  id,\n  price,\n  \nFROM tickets",
      solution:
        "SELECT id, price, ROUND(price * 0.9) AS discounted_price\nFROM tickets\nORDER BY id",
      expectedSql:
        "SELECT id, price, ROUND(price * 0.9) AS discounted_price FROM tickets ORDER BY id",
      orderMatters: true,
    },
    {
      id: "edge-wagons",
      number: 22,
      title: "Крайние вагоны",
      difficulty: "easy",
      description:
        "Покажи пассажиров первого и пятого вагонов. Верни `name`, `wagon`, `compartment`, сортировка — по вагону, купе и имени.",
      hint: "Условие можно записать через IN (1, 5).",
      starterSql: "SELECT name, wagon, compartment\nFROM passengers",
      solution:
        "SELECT name, wagon, compartment\nFROM passengers\nWHERE wagon IN (1, 5)\nORDER BY wagon, compartment, name",
      expectedSql:
        "SELECT name, wagon, compartment FROM passengers WHERE wagon IN (1, 5) ORDER BY wagon, compartment, name",
      orderMatters: true,
    },
    {
      id: "unique-routes",
      number: 23,
      title: "Уникальные маршруты",
      difficulty: "easy",
      description:
        "Собери уникальные маршруты билетов строкой вида `Москва → Тверь`. Назови колонку `route` и отсортируй её по алфавиту.",
      hint: "Соедини строки оператором ||, затем используй DISTINCT.",
      starterSql: "SELECT DISTINCT\nFROM tickets",
      solution:
        "SELECT DISTINCT from_station || ' → ' || to_station AS route\nFROM tickets\nORDER BY route",
      expectedSql:
        "SELECT DISTINCT from_station || ' → ' || to_station AS route FROM tickets ORDER BY route",
      orderMatters: true,
    },
    {
      id: "stations-after-three",
      number: 24,
      title: "После трёх ночи",
      difficulty: "easy",
      description:
        "Покажи станции с прибытием не раньше 03:00. Верни `name` и `arrival_time` по времени.",
      hint: "Сравни arrival_time с литералом TIME '03:00'.",
      starterSql: "SELECT name, arrival_time\nFROM stations",
      solution:
        "SELECT name, arrival_time\nFROM stations\nWHERE arrival_time >= TIME '03:00'\nORDER BY arrival_time",
      expectedSql:
        "SELECT name, arrival_time FROM stations WHERE arrival_time >= TIME '03:00' ORDER BY arrival_time",
      orderMatters: true,
    },
    {
      id: "passenger-routes",
      number: 25,
      title: "Маршрут каждого пассажира",
      difficulty: "medium",
      description:
        "Соедини пассажиров с билетами и верни `name`, `from_station`, `to_station`, `price`. Сортировка — по имени.",
      hint: "Связь: passengers.id = tickets.passenger_id.",
      starterSql:
        "SELECT\n  \nFROM passengers AS p\nJOIN tickets AS t ON ...",
      solution:
        "SELECT p.name, t.from_station, t.to_station, t.price\nFROM passengers AS p\nJOIN tickets AS t ON t.passenger_id = p.id\nORDER BY p.name",
      expectedSql:
        "SELECT p.name, t.from_station, t.to_station, t.price FROM passengers AS p JOIN tickets AS t ON t.passenger_id = p.id ORDER BY p.name",
      orderMatters: true,
    },
    {
      id: "multiple-luggage",
      number: 26,
      title: "Несколько мест багажа",
      difficulty: "medium",
      description:
        "Найди пассажиров с двумя и более местами багажа. Верни `name` и `luggage_count`, сначала большее количество.",
      hint: "После JOIN сгруппируй по пассажиру и отфильтруй COUNT через HAVING.",
      starterSql:
        "SELECT p.name, COUNT(*) AS luggage_count\nFROM passengers AS p\nJOIN luggage AS l ON ...",
      solution:
        "SELECT p.name, COUNT(*) AS luggage_count\nFROM passengers AS p\nJOIN luggage AS l ON l.passenger_id = p.id\nGROUP BY p.id, p.name\nHAVING COUNT(*) >= 2\nORDER BY luggage_count DESC, p.name",
      expectedSql:
        "SELECT p.name, COUNT(*) AS luggage_count FROM passengers AS p JOIN luggage AS l ON l.passenger_id = p.id GROUP BY p.id, p.name HAVING COUNT(*) >= 2 ORDER BY luggage_count DESC, p.name",
      orderMatters: true,
    },
    {
      id: "wagon-average-age",
      number: 27,
      title: "Средний возраст по вагонам",
      difficulty: "medium",
      description:
        "Для каждого вагона вычисли средний возраст с точностью до одного знака. Верни `wagon` и `avg_age` по номеру вагона.",
      hint: "Используй ROUND(AVG(age), 1) и GROUP BY wagon.",
      starterSql: "SELECT\n  wagon,\n  \nFROM passengers",
      solution:
        "SELECT wagon, ROUND(AVG(age), 1) AS avg_age\nFROM passengers\nGROUP BY wagon\nORDER BY wagon",
      expectedSql:
        "SELECT wagon, ROUND(AVG(age), 1) AS avg_age FROM passengers GROUP BY wagon ORDER BY wagon",
      orderMatters: true,
    },
    {
      id: "total-stop-time",
      number: 28,
      title: "Общее время стоянок",
      difficulty: "medium",
      description:
        "Посчитай суммарное время всех стоянок маршрута. Верни одну колонку `total_stop_minutes` и одну строку.",
      hint: "Примени SUM к stop_minutes.",
      starterSql: "SELECT\nFROM stations",
      solution:
        "SELECT SUM(stop_minutes) AS total_stop_minutes\nFROM stations",
      expectedSql:
        "SELECT SUM(stop_minutes) AS total_stop_minutes FROM stations",
    },
    {
      id: "price-groups",
      number: 29,
      title: "Ценовые категории",
      difficulty: "medium",
      description:
        "Раздели билеты на категории: дешевле 3000 — `эконом`, до 4000 включительно — `стандарт`, остальные — `премиум`. Верни `price_group` и `ticket_count` в этом порядке.",
      hint: "Сгруппировать можно по выражению CASE; порядок категорий задай через MIN(price).",
      starterSql:
        "SELECT\n  CASE\n  END AS price_group,\n  COUNT(*) AS ticket_count\nFROM tickets",
      solution:
        "SELECT\n  CASE\n    WHEN price < 3000 THEN 'эконом'\n    WHEN price <= 4000 THEN 'стандарт'\n    ELSE 'премиум'\n  END AS price_group,\n  COUNT(*) AS ticket_count\nFROM tickets\nGROUP BY 1\nORDER BY MIN(price)",
      expectedSql:
        "SELECT CASE WHEN price < 3000 THEN 'эконом' WHEN price <= 4000 THEN 'стандарт' ELSE 'премиум' END AS price_group, COUNT(*) AS ticket_count FROM tickets GROUP BY 1 ORDER BY MIN(price)",
      orderMatters: true,
    },
    {
      id: "spb-passengers-exists",
      number: 30,
      title: "Пассажиры до Петербурга",
      difficulty: "medium",
      description:
        "Через EXISTS найди пассажиров с билетом до Санкт-Петербурга. Верни только `name` по алфавиту.",
      hint: "В коррелированном подзапросе свяжи tickets.passenger_id с текущим пассажиром.",
      starterSql:
        "SELECT p.name\nFROM passengers AS p\nWHERE EXISTS (\n  SELECT 1\n  FROM tickets AS t\n  WHERE ...\n)",
      solution:
        "SELECT p.name\nFROM passengers AS p\nWHERE EXISTS (\n  SELECT 1 FROM tickets AS t\n  WHERE t.passenger_id = p.id\n    AND t.to_station = 'Санкт-Петербург'\n)\nORDER BY p.name",
      expectedSql:
        "SELECT p.name FROM passengers AS p WHERE EXISTS (SELECT 1 FROM tickets AS t WHERE t.passenger_id = p.id AND t.to_station = 'Санкт-Петербург') ORDER BY p.name",
      orderMatters: true,
    },
    {
      id: "no-luggage-exists",
      number: 31,
      title: "Путешествуют налегке",
      difficulty: "medium",
      description:
        "Через NOT EXISTS найди пассажиров без зарегистрированного багажа. Верни `name` и `wagon`, сортировка по вагону и имени.",
      hint: "Подзапрос должен искать luggage с passenger_id текущего пассажира.",
      starterSql:
        "SELECT p.name, p.wagon\nFROM passengers AS p\nWHERE NOT EXISTS (\n  SELECT 1 FROM luggage AS l WHERE ...\n)",
      solution:
        "SELECT p.name, p.wagon\nFROM passengers AS p\nWHERE NOT EXISTS (\n  SELECT 1 FROM luggage AS l WHERE l.passenger_id = p.id\n)\nORDER BY p.wagon, p.name",
      expectedSql:
        "SELECT p.name, p.wagon FROM passengers AS p WHERE NOT EXISTS (SELECT 1 FROM luggage AS l WHERE l.passenger_id = p.id) ORDER BY p.wagon, p.name",
      orderMatters: true,
    },
    {
      id: "ticket-stations-union",
      number: 32,
      title: "Станции в билетах",
      difficulty: "medium",
      description:
        "Собери в одну колонку `station` все станции отправления и назначения, встречающиеся в билетах, без повторений и по алфавиту.",
      hint: "Объедини два SELECT оператором UNION.",
      starterSql:
        "SELECT from_station AS station FROM tickets\nUNION\nSELECT ...",
      solution:
        "SELECT from_station AS station FROM tickets\nUNION\nSELECT to_station AS station FROM tickets\nORDER BY station",
      expectedSql:
        "SELECT from_station AS station FROM tickets UNION SELECT to_station AS station FROM tickets ORDER BY station",
      orderMatters: true,
    },
    {
      id: "wagon-neighbours",
      number: 33,
      title: "Пары соседей по вагону",
      difficulty: "medium",
      description:
        "Составь все уникальные пары пассажиров одного вагона. Верни `wagon`, `passenger_one`, `passenger_two`; одна и та же пара не должна дублироваться.",
      hint: "Сделай self JOIN passengers и оставь пары, где p1.id < p2.id.",
      starterSql:
        "SELECT\n  \nFROM passengers AS p1\nJOIN passengers AS p2 ON ...",
      solution:
        "SELECT p1.wagon, p1.name AS passenger_one, p2.name AS passenger_two\nFROM passengers AS p1\nJOIN passengers AS p2\n  ON p2.wagon = p1.wagon AND p1.id < p2.id\nORDER BY p1.wagon, passenger_one, passenger_two",
      expectedSql:
        "SELECT p1.wagon, p1.name AS passenger_one, p2.name AS passenger_two FROM passengers AS p1 JOIN passengers AS p2 ON p2.wagon = p1.wagon AND p1.id < p2.id ORDER BY p1.wagon, passenger_one, passenger_two",
      orderMatters: true,
    },
    {
      id: "wagon-statistics",
      number: 34,
      title: "Статистика вагонов",
      difficulty: "medium",
      description:
        "Для каждого вагона верни `wagon`, `passenger_count`, `min_age`, `max_age` и округлённый `avg_age`. Сортировка по вагону.",
      hint: "Несколько агрегатных функций можно вычислять в одном GROUP BY.",
      starterSql: "SELECT\n  wagon,\n  \nFROM passengers",
      solution:
        "SELECT wagon, COUNT(*) AS passenger_count,\n  MIN(age) AS min_age, MAX(age) AS max_age,\n  ROUND(AVG(age), 1) AS avg_age\nFROM passengers\nGROUP BY wagon\nORDER BY wagon",
      expectedSql:
        "SELECT wagon, COUNT(*) AS passenger_count, MIN(age) AS min_age, MAX(age) AS max_age, ROUND(AVG(age), 1) AS avg_age FROM passengers GROUP BY wagon ORDER BY wagon",
      orderMatters: true,
    },
    {
      id: "recent-to-last-ticket",
      number: 35,
      title: "Неделя до последней покупки",
      difficulty: "medium",
      description:
        "Найди пассажиров, купивших билет в течение семи дней до самой поздней покупки в базе включительно. Верни `name` и `purchased_at`, новые покупки первыми.",
      hint: "Сравни дату с MAX(purchased_at) минус INTERVAL '7 days'.",
      starterSql:
        "SELECT p.name, t.purchased_at\nFROM tickets AS t\nJOIN passengers AS p ON ...",
      solution:
        "SELECT p.name, t.purchased_at\nFROM tickets AS t\nJOIN passengers AS p ON p.id = t.passenger_id\nWHERE t.purchased_at >= (\n  SELECT MAX(purchased_at) - INTERVAL '7 days' FROM tickets\n)\nORDER BY t.purchased_at DESC, p.name",
      expectedSql:
        "SELECT p.name, t.purchased_at FROM tickets AS t JOIN passengers AS p ON p.id = t.passenger_id WHERE t.purchased_at >= (SELECT MAX(purchased_at) - INTERVAL '7 days' FROM tickets) ORDER BY t.purchased_at DESC, p.name",
      orderMatters: true,
    },
    {
      id: "destination-max-price",
      number: 36,
      title: "Самый дорогой билет направления",
      difficulty: "medium",
      description:
        "Для каждого направления найди билет с максимальной ценой. Верни `to_station`, `name`, `price`; сохраняй все совпадения максимума.",
      hint: "В коррелированном подзапросе вычисли MAX(price) для текущего to_station.",
      starterSql:
        "SELECT t.to_station, p.name, t.price\nFROM tickets AS t\nJOIN passengers AS p ON ...",
      solution:
        "SELECT t.to_station, p.name, t.price\nFROM tickets AS t\nJOIN passengers AS p ON p.id = t.passenger_id\nWHERE t.price = (\n  SELECT MAX(t2.price) FROM tickets AS t2\n  WHERE t2.to_station = t.to_station\n)\nORDER BY t.to_station, p.name",
      expectedSql:
        "SELECT t.to_station, p.name, t.price FROM tickets AS t JOIN passengers AS p ON p.id = t.passenger_id WHERE t.price = (SELECT MAX(t2.price) FROM tickets AS t2 WHERE t2.to_station = t.to_station) ORDER BY t.to_station, p.name",
      orderMatters: true,
    },
    {
      id: "repeated-luggage-types",
      number: 37,
      title: "Повторяющийся багаж",
      difficulty: "medium",
      description:
        "Найди описания багажа, встречающиеся не меньше двух раз. Верни `description` и `item_count`, сначала частые.",
      hint: "GROUP BY description и HAVING COUNT(*) >= 2.",
      starterSql:
        "SELECT description, COUNT(*) AS item_count\nFROM luggage",
      solution:
        "SELECT description, COUNT(*) AS item_count\nFROM luggage\nGROUP BY description\nHAVING COUNT(*) >= 2\nORDER BY item_count DESC, description",
      expectedSql:
        "SELECT description, COUNT(*) AS item_count FROM luggage GROUP BY description HAVING COUNT(*) >= 2 ORDER BY item_count DESC, description",
      orderMatters: true,
    },
    {
      id: "events-by-hour",
      number: 38,
      title: "События по часам",
      difficulty: "medium",
      description:
        "Посчитай записи проводника для каждого часа. Верни целое значение часа `event_hour` и `event_count` по возрастанию часа.",
      hint: "Извлеки час через EXTRACT(HOUR FROM event_time) и сгруппируй.",
      starterSql:
        "SELECT\n  EXTRACT(HOUR FROM event_time)::integer AS event_hour,\n  \nFROM conductor_log",
      solution:
        "SELECT EXTRACT(HOUR FROM event_time)::integer AS event_hour,\n  COUNT(*) AS event_count\nFROM conductor_log\nGROUP BY event_hour\nORDER BY event_hour",
      expectedSql:
        "SELECT EXTRACT(HOUR FROM event_time)::integer AS event_hour, COUNT(*) AS event_count FROM conductor_log GROUP BY event_hour ORDER BY event_hour",
      orderMatters: true,
    },
    {
      id: "destination-price-rank",
      number: 39,
      title: "Рейтинг цен по направлениям",
      difficulty: "hard",
      description:
        "Присвой билетам ранг цены внутри каждого направления. Верни `name`, `to_station`, `price`, `price_rank`; одинаковые цены должны иметь одинаковый ранг без пропусков.",
      hint: "Используй DENSE_RANK() с PARTITION BY to_station.",
      starterSql:
        "SELECT\n  p.name, t.to_station, t.price,\n  DENSE_RANK() OVER (...) AS price_rank\nFROM tickets AS t\nJOIN passengers AS p ON ...",
      solution:
        "SELECT p.name, t.to_station, t.price,\n  DENSE_RANK() OVER (\n    PARTITION BY t.to_station ORDER BY t.price DESC\n  ) AS price_rank\nFROM tickets AS t\nJOIN passengers AS p ON p.id = t.passenger_id\nORDER BY t.to_station, price_rank, p.name",
      expectedSql:
        "SELECT p.name, t.to_station, t.price, DENSE_RANK() OVER (PARTITION BY t.to_station ORDER BY t.price DESC) AS price_rank FROM tickets AS t JOIN passengers AS p ON p.id = t.passenger_id ORDER BY t.to_station, price_rank, p.name",
      orderMatters: true,
    },
    {
      id: "running-ticket-revenue",
      number: 40,
      title: "Накопительная выручка",
      difficulty: "hard",
      description:
        "Покажи, как росла выручка по мере покупки билетов. Верни `purchased_at`, `id`, `price`, `running_revenue` в порядке даты и id.",
      hint: "Используй SUM(price) OVER (ORDER BY purchased_at, id).",
      starterSql:
        "SELECT\n  purchased_at, id, price,\n  SUM(price) OVER (...) AS running_revenue\nFROM tickets",
      solution:
        "SELECT purchased_at, id, price,\n  SUM(price) OVER (ORDER BY purchased_at, id) AS running_revenue\nFROM tickets\nORDER BY purchased_at, id",
      expectedSql:
        "SELECT purchased_at, id, price, SUM(price) OVER (ORDER BY purchased_at, id) AS running_revenue FROM tickets ORDER BY purchased_at, id",
      orderMatters: true,
    },
    {
      id: "purchase-day-gaps",
      number: 41,
      title: "Паузы между покупками",
      difficulty: "hard",
      description:
        "Для каждой покупки вычисли число дней с предыдущей покупки. Верни `purchased_at`, `id`, `days_since_previous`; первая строка может быть NULL.",
      hint: "Вычти LAG(purchased_at) OVER (ORDER BY purchased_at, id) из текущей даты.",
      starterSql:
        "SELECT\n  purchased_at, id,\n  \nFROM tickets",
      solution:
        "SELECT purchased_at, id,\n  purchased_at - LAG(purchased_at) OVER (ORDER BY purchased_at, id) AS days_since_previous\nFROM tickets\nORDER BY purchased_at, id",
      expectedSql:
        "SELECT purchased_at, id, purchased_at - LAG(purchased_at) OVER (ORDER BY purchased_at, id) AS days_since_previous FROM tickets ORDER BY purchased_at, id",
      orderMatters: true,
    },
    {
      id: "ticket-destination-share",
      number: 42,
      title: "Доля билета в направлении",
      difficulty: "hard",
      description:
        "Для каждого билета рассчитай его процент от выручки направления. Верни `to_station`, `name`, `price`, `share_percent`, округлив процент до одного знака.",
      hint: "Раздели price на SUM(price) OVER (PARTITION BY to_station).",
      starterSql:
        "SELECT\n  t.to_station, p.name, t.price,\n  \nFROM tickets AS t\nJOIN passengers AS p ON ...",
      solution:
        "SELECT t.to_station, p.name, t.price,\n  ROUND(t.price * 100.0 / SUM(t.price) OVER (PARTITION BY t.to_station), 1) AS share_percent\nFROM tickets AS t\nJOIN passengers AS p ON p.id = t.passenger_id\nORDER BY t.to_station, share_percent DESC, p.name",
      expectedSql:
        "SELECT t.to_station, p.name, t.price, ROUND(t.price * 100.0 / SUM(t.price) OVER (PARTITION BY t.to_station), 1) AS share_percent FROM tickets AS t JOIN passengers AS p ON p.id = t.passenger_id ORDER BY t.to_station, share_percent DESC, p.name",
      orderMatters: true,
    },
    {
      id: "age-quartiles",
      number: 43,
      title: "Возрастные квартили",
      difficulty: "hard",
      description:
        "Раздели пассажиров на четыре максимально равные возрастные группы. Верни `name`, `age`, `age_quartile`, затем отсортируй по квартилю, возрасту и имени.",
      hint: "Используй NTILE(4) OVER (ORDER BY age, name).",
      starterSql:
        "SELECT\n  name, age,\n  NTILE(4) OVER (...) AS age_quartile\nFROM passengers",
      solution:
        "SELECT name, age,\n  NTILE(4) OVER (ORDER BY age, name) AS age_quartile\nFROM passengers\nORDER BY age_quartile, age, name",
      expectedSql:
        "SELECT name, age, NTILE(4) OVER (ORDER BY age, name) AS age_quartile FROM passengers ORDER BY age_quartile, age, name",
      orderMatters: true,
    },
    {
      id: "route-running-stops",
      number: 44,
      title: "Накопленное время стоянок",
      difficulty: "hard",
      description:
        "По порядку маршрута покажи `name`, `stop_minutes` и накопленную сумму стоянок `running_stop_minutes`.",
      hint: "Порядок маршрута задаёт id; используй оконный SUM.",
      starterSql:
        "SELECT\n  name, stop_minutes,\n  \nFROM stations",
      solution:
        "SELECT name, stop_minutes,\n  SUM(stop_minutes) OVER (ORDER BY id) AS running_stop_minutes\nFROM stations\nORDER BY id",
      expectedSql:
        "SELECT name, stop_minutes, SUM(stop_minutes) OVER (ORDER BY id) AS running_stop_minutes FROM stations ORDER BY id",
      orderMatters: true,
    },
    {
      id: "large-event-gaps",
      number: 45,
      title: "Длинные паузы в журнале",
      difficulty: "hard",
      description:
        "Найди события, перед которыми в журнале была пауза больше десяти минут. Верни `event_time`, `note`, `gap_from_previous` по времени.",
      hint: "Сначала вычисли LAG в CTE, затем фильтруй готовый интервал.",
      starterSql:
        "WITH timeline AS (\n  SELECT\n    event_time, note,\n    ... AS previous_time\n  FROM conductor_log\n)\nSELECT ...",
      solution:
        "WITH timeline AS (\n  SELECT event_time, note,\n    LAG(event_time) OVER (ORDER BY event_time) AS previous_time\n  FROM conductor_log\n)\nSELECT event_time, note,\n  event_time - previous_time AS gap_from_previous\nFROM timeline\nWHERE event_time - previous_time > INTERVAL '10 minutes'\nORDER BY event_time",
      expectedSql:
        "WITH timeline AS (SELECT event_time, note, LAG(event_time) OVER (ORDER BY event_time) AS previous_time FROM conductor_log) SELECT event_time, note, event_time - previous_time AS gap_from_previous FROM timeline WHERE event_time - previous_time > INTERVAL '10 minutes' ORDER BY event_time",
      orderMatters: true,
    },
    {
      id: "ticket-without-luggage",
      number: 46,
      title: "С билетом, но без багажа",
      difficulty: "hard",
      description:
        "Найди пассажиров, у которых есть билет, но нет зарегистрированного багажа. Верни `name`, `to_station`, `price` по имени.",
      hint: "Соедини passengers с tickets и добавь NOT EXISTS для luggage.",
      starterSql:
        "SELECT p.name, t.to_station, t.price\nFROM passengers AS p\nJOIN tickets AS t ON ...\nWHERE NOT EXISTS (...) ",
      solution:
        "SELECT p.name, t.to_station, t.price\nFROM passengers AS p\nJOIN tickets AS t ON t.passenger_id = p.id\nWHERE NOT EXISTS (\n  SELECT 1 FROM luggage AS l WHERE l.passenger_id = p.id\n)\nORDER BY p.name",
      expectedSql:
        "SELECT p.name, t.to_station, t.price FROM passengers AS p JOIN tickets AS t ON t.passenger_id = p.id WHERE NOT EXISTS (SELECT 1 FROM luggage AS l WHERE l.passenger_id = p.id) ORDER BY p.name",
      orderMatters: true,
    },
    {
      id: "wagon-pivot",
      number: 47,
      title: "Вагоны в одну строку",
      difficulty: "hard",
      description:
        "Собери число пассажиров каждого вагона в одну строку с колонками `wagon_1`, `wagon_2`, `wagon_3`, `wagon_4`, `wagon_5`.",
      hint: "Используй COUNT(*) FILTER (WHERE wagon = ...).",
      starterSql:
        "SELECT\n  COUNT(*) FILTER (WHERE wagon = 1) AS wagon_1,\n  ...\nFROM passengers",
      solution:
        "SELECT\n  COUNT(*) FILTER (WHERE wagon = 1) AS wagon_1,\n  COUNT(*) FILTER (WHERE wagon = 2) AS wagon_2,\n  COUNT(*) FILTER (WHERE wagon = 3) AS wagon_3,\n  COUNT(*) FILTER (WHERE wagon = 4) AS wagon_4,\n  COUNT(*) FILTER (WHERE wagon = 5) AS wagon_5\nFROM passengers",
      expectedSql:
        "SELECT COUNT(*) FILTER (WHERE wagon = 1) AS wagon_1, COUNT(*) FILTER (WHERE wagon = 2) AS wagon_2, COUNT(*) FILTER (WHERE wagon = 3) AS wagon_3, COUNT(*) FILTER (WHERE wagon = 4) AS wagon_4, COUNT(*) FILTER (WHERE wagon = 5) AS wagon_5 FROM passengers",
    },
    {
      id: "destination-revenue-share",
      number: 48,
      title: "Доля выручки направлений",
      difficulty: "hard",
      description:
        "Посчитай выручку каждого направления и её долю в общей выручке. Верни `to_station`, `revenue`, `share_percent`, округлив процент до одного знака; сортировка по выручке вниз.",
      hint: "Сначала агрегируй выручку в CTE, затем примени оконный SUM к полученным строкам.",
      starterSql:
        "WITH revenue_by_destination AS (\n  SELECT ...\n)\nSELECT ...",
      solution:
        "WITH revenue_by_destination AS (\n  SELECT to_station, SUM(price) AS revenue\n  FROM tickets\n  GROUP BY to_station\n)\nSELECT to_station, revenue,\n  ROUND(revenue * 100.0 / SUM(revenue) OVER (), 1) AS share_percent\nFROM revenue_by_destination\nORDER BY revenue DESC, to_station",
      expectedSql:
        "WITH revenue_by_destination AS (SELECT to_station, SUM(price) AS revenue FROM tickets GROUP BY to_station) SELECT to_station, revenue, ROUND(revenue * 100.0 / SUM(revenue) OVER (), 1) AS share_percent FROM revenue_by_destination ORDER BY revenue DESC, to_station",
      orderMatters: true,
    },
    {
      id: "luggage-owner-share",
      number: 49,
      title: "Доля вещи в багаже",
      difficulty: "hard",
      description:
        "Для каждого места багажа вычисли его долю в общем весе багажа владельца. Верни `name`, `description`, `weight_kg`, `owner_weight_percent`, округлив процент до одного знака.",
      hint: "Оконный SUM должен быть разбит по luggage.passenger_id.",
      starterSql:
        "SELECT\n  p.name, l.description, l.weight_kg,\n  \nFROM luggage AS l\nJOIN passengers AS p ON ...",
      solution:
        "SELECT p.name, l.description, l.weight_kg,\n  ROUND(l.weight_kg * 100.0 / SUM(l.weight_kg) OVER (PARTITION BY l.passenger_id), 1) AS owner_weight_percent\nFROM luggage AS l\nJOIN passengers AS p ON p.id = l.passenger_id\nORDER BY p.name, l.weight_kg DESC, l.description",
      expectedSql:
        "SELECT p.name, l.description, l.weight_kg, ROUND(l.weight_kg * 100.0 / SUM(l.weight_kg) OVER (PARTITION BY l.passenger_id), 1) AS owner_weight_percent FROM luggage AS l JOIN passengers AS p ON p.id = l.passenger_id ORDER BY p.name, l.weight_kg DESC, l.description",
      orderMatters: true,
    },
    {
      id: "suspicion-score",
      number: 50,
      title: "Рейтинг подозрительности",
      difficulty: "hard",
      description:
        "Начисли пассажиру: 2 балла за вагон №4, 3 за отсутствие билета, 2 за багаж тяжелее 10 кг суммарно и 3 за покупку билета в самую позднюю дату. Верни пассажиров с ненулевым результатом: `name`, `suspicion_score`, баллы вниз.",
      hint: "Подготовь сумму багажа отдельно, затем сложи несколько CASE в CTE.",
      starterSql:
        "WITH luggage_totals AS (\n  SELECT ...\n),\nscores AS (\n  SELECT ...\n)\nSELECT ...",
      solution:
        "WITH luggage_totals AS (\n  SELECT passenger_id, SUM(weight_kg) AS total_weight\n  FROM luggage GROUP BY passenger_id\n),\nscores AS (\n  SELECT p.name,\n    CASE WHEN p.wagon = 4 THEN 2 ELSE 0 END\n    + CASE WHEN t.id IS NULL THEN 3 ELSE 0 END\n    + CASE WHEN COALESCE(lt.total_weight, 0) > 10 THEN 2 ELSE 0 END\n    + CASE WHEN t.purchased_at = (SELECT MAX(purchased_at) FROM tickets) THEN 3 ELSE 0 END\n      AS suspicion_score\n  FROM passengers AS p\n  LEFT JOIN tickets AS t ON t.passenger_id = p.id\n  LEFT JOIN luggage_totals AS lt ON lt.passenger_id = p.id\n)\nSELECT name, suspicion_score\nFROM scores\nWHERE suspicion_score > 0\nORDER BY suspicion_score DESC, name",
      expectedSql:
        "WITH luggage_totals AS (SELECT passenger_id, SUM(weight_kg) AS total_weight FROM luggage GROUP BY passenger_id), scores AS (SELECT p.name, CASE WHEN p.wagon = 4 THEN 2 ELSE 0 END + CASE WHEN t.id IS NULL THEN 3 ELSE 0 END + CASE WHEN COALESCE(lt.total_weight, 0) > 10 THEN 2 ELSE 0 END + CASE WHEN t.purchased_at = (SELECT MAX(purchased_at) FROM tickets) THEN 3 ELSE 0 END AS suspicion_score FROM passengers AS p LEFT JOIN tickets AS t ON t.passenger_id = p.id LEFT JOIN luggage_totals AS lt ON lt.passenger_id = p.id) SELECT name, suspicion_score FROM scores WHERE suspicion_score > 0 ORDER BY suspicion_score DESC, name",
      orderMatters: true,
    },
  ],
};

const PRACTICE_DATABASES: ServerPracticeDatabase[] = [MIDNIGHT_EXPRESS];

export function getPracticeDatabases(): PracticeDatabase[] {
  return PRACTICE_DATABASES.map(({ tasks, ...database }) => ({
    ...database,
    tasks: tasks.map(({ expectedSql: _expectedSql, ...task }) => task),
  }));
}

export function getPracticeDatabase(slug: string): PracticeDatabase | null {
  return (
    getPracticeDatabases().find((database) => database.questSlug === slug) ??
    null
  );
}

export function getServerPracticeTask(
  questSlug: string,
  taskId: string
): ServerPracticeTask | null {
  const database = PRACTICE_DATABASES.find(
    (item) => item.questSlug === questSlug
  );
  return database?.tasks.find((task) => task.id === taskId) ?? null;
}
