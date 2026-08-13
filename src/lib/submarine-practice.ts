import "server-only";

import type { PracticeDatabase, PracticeTask } from "./types";

interface ServerPracticeTask extends PracticeTask {
  expectedSql: string;
}

interface ServerPracticeDatabase extends Omit<PracticeDatabase, "tasks"> {
  tasks: ServerPracticeTask[];
}

type TaskInput = Omit<ServerPracticeTask, "solution" | "expectedSql"> & {
  sql: string;
};

function task({ sql, ...definition }: TaskInput): ServerPracticeTask {
  const normalizedSql = sql.trim();
  return { ...definition, solution: normalizedSql, expectedSql: normalizedSql };
}

export const SUBMARINE_CRASH: ServerPracticeDatabase = {
  questSlug: "submarine-crash",
  previewUrl: "/quests/submarine-crash/preview.png",
  title: "Крушение подлодки",
  emoji: "🌊",
  description:
    "Пятнадцать таблиц аварийной субмарины «Кальмар»: экипаж, капсулы, электрические цепи, лифты, склады, звонки и глубоководные показания. 50 заданий ведут от простых фильтров до CTE, оконных функций и аналитических отчётов.",
  schemaDescription:
    "База описывает эвакуацию исследовательской субмарины «Кальмар». Центральная таблица crew хранит экипаж, его состояние, местоположение, вес и назначенную группу капсулы. С ней связаны статусы эвакуации, исходный состав команды и история кадровых изменений.\n\nОтдельные журналы фиксируют посещения складов, телефонные разговоры и перемещения лифтов. Таблицы malfunctions, circuits и pods_list описывают техническое состояние корабля, а readings содержит глубоководные показания. Такая структура подходит для тренировки фильтрации, группировки, JOIN, CTE, подзапросов и оконных функций.",
  tables: [
    { name: "malfunctions", description: "Неисправности и способы ремонта", columns: ["issues_id", "issues", "fix"] },
    { name: "crew", description: "Текущий состав и эвакуационные данные", columns: ["staff_name", "staff_id", "last_location", "status", "role", "weight_kg", "pod_group", "distance_to_pod"] },
    { name: "evacuation_groups", description: "Статусы посадки групп", columns: ["pod_group", "party_status"] },
    { name: "original_crew", description: "Экипаж при выходе из порта", columns: ["staff_name", "staff_id"] },
    { name: "full_crew", description: "Сопоставление исходного и текущего состава", columns: ["staff_name", "staff_id", "last_location", "status", "role"] },
    { name: "staffing_changes", description: "История кадровых изменений", columns: ["staff_name", "role", "change_order"] },
    { name: "joined_crew", description: "Состав с объединённой историей ролей", columns: ["staff_name", "staff_id", "last_location", "status", "role", "staff_name:1", "combined_roles"] },
    { name: "depot_records", description: "Посещения складов", columns: ["staff_name", "staff_id", "depot", "timestamp"] },
    { name: "phone_logs", description: "Журнал телефонных соединений", columns: ["staff_name", "staff_id", "phone_number", "incoming_outgoing", "start_time", "end_time"] },
    { name: "lift_locations", description: "Положение лифтов до аварии", columns: ["time", "lift_name", "deck"] },
    { name: "lift_locations_2", description: "Последние перемещения лифтов", columns: ["timestamp", "lift_name", "location"] },
    { name: "lift_malfunctions", description: "Диагностика лифтов", columns: ["lift_name", "malfunction"] },
    { name: "readings", description: "Глубоководные показания датчиков", columns: ["timestamp", "depth", "rock_type", "seafloor_observations", "notes"] },
    { name: "pods_list", description: "Спасательные капсулы", columns: ["id", "range", "status"] },
    { name: "circuits", description: "Электрические цепи корабля", columns: ["deck_number", "area", "purpose", "status"] },
  ],
  tasks: [
    task({ id: "all-malfunctions", number: 1, title: "Журнал неисправностей", difficulty: "easy", description: "Выведи `issues_id`, `issues` и `fix` всех неисправностей по идентификатору.", hint: "Выбери три столбца из malfunctions и добавь ORDER BY issues_id.", starterSql: "SELECT\n  \nFROM malfunctions", sql: `SELECT issues_id, issues, fix
FROM malfunctions
ORDER BY issues_id`, orderMatters: true }),
    task({ id: "fixable-malfunctions", number: 2, title: "Исправимые поломки", difficulty: "easy", description: "Найди неисправности, для которых указан способ ремонта. Верни `issues` и `fix` по названию неисправности.", hint: "Отбери строки, где fix IS NOT NULL.", starterSql: "SELECT issues, fix\nFROM malfunctions", sql: `SELECT issues, fix
FROM malfunctions
WHERE fix IS NOT NULL
ORDER BY issues`, orderMatters: true }),
    task({ id: "living-crew", number: 3, title: "Живые члены экипажа", difficulty: "easy", description: "Выведи `staff_name`, `role` и `last_location` для живых членов экипажа по имени.", hint: "Нужен фильтр status = 'living'.", starterSql: "SELECT staff_name, role, last_location\nFROM crew", sql: `SELECT staff_name, role, last_location
FROM crew
WHERE status = 'living'
ORDER BY staff_name`, orderMatters: true }),
    task({ id: "injured-crew", number: 4, title: "Список раненых", difficulty: "easy", description: "Покажи имя и последнюю палубу раненых. Колонки: `staff_name`, `last_location`; сначала имя.", hint: "Отфильтруй crew по status = 'injured'.", starterSql: "SELECT staff_name, last_location\nFROM crew", sql: `SELECT staff_name, last_location
FROM crew
WHERE status = 'injured'
ORDER BY staff_name`, orderMatters: true }),
    task({ id: "first-officer", number: 5, title: "Первый помощник", difficulty: "easy", description: "Найди первого помощника. Верни `staff_name`, `staff_id`, `last_location`.", hint: "Сравни role со строкой 'first officer'.", starterSql: "SELECT staff_name, staff_id, last_location\nFROM crew", sql: `SELECT staff_name, staff_id, last_location
FROM crew
WHERE role = 'first officer'`, orderMatters: true }),
    task({ id: "working-pods", number: 6, title: "Рабочие капсулы", difficulty: "easy", description: "Выведи идентификатор и дальность исправных капсул. Колонки `id`, `range`; дальние первыми.", hint: "Статус исправной капсулы — functioning.", starterSql: "SELECT id, range\nFROM pods_list", sql: `SELECT id, range
FROM pods_list
WHERE status = 'functioning'
ORDER BY range DESC, id`, orderMatters: true }),
    task({ id: "long-range-pods", number: 7, title: "Дальние капсулы", difficulty: "easy", description: "Найди капсулы с дальностью больше 1500. Верни `id`, `range`, `status` по идентификатору.", hint: "Поле range числовое, кавычки вокруг 1500 не нужны.", starterSql: "SELECT id, range, status\nFROM pods_list", sql: `SELECT id, range, status
FROM pods_list
WHERE range > 1500
ORDER BY id`, orderMatters: true }),
    task({ id: "unsafe-circuits", number: 8, title: "Небезопасные цепи", difficulty: "easy", description: "Покажи цепи, чей статус не равен green. Верни `deck_number`, `area`, `purpose`, `status` по палубе и зоне.", hint: "Используй оператор !=.", starterSql: "SELECT deck_number, area, purpose, status\nFROM circuits", sql: `SELECT deck_number, area, purpose, status
FROM circuits
WHERE status != 'green'
ORDER BY deck_number, area, purpose`, orderMatters: true }),
    task({ id: "pod-three-circuits", number: 9, title: "Цепи третьей капсулы", difficulty: "easy", description: "Выведи `purpose` и `status` всех цепей зоны `pod 03` по назначению.", hint: "Отбери строки по полю area.", starterSql: "SELECT purpose, status\nFROM circuits", sql: `SELECT purpose, status
FROM circuits
WHERE area = 'pod 03'
ORDER BY purpose`, orderMatters: true }),
    task({ id: "lightest-crew", number: 10, title: "Подозрительный вес", difficulty: "easy", description: "Выведи имя и вес экипажа от самого маленького значения к большому. Колонки: `staff_name`, `weight_kg`.", hint: "Используй ORDER BY weight_kg ASC.", starterSql: "SELECT staff_name, weight_kg\nFROM crew", sql: `SELECT staff_name, weight_kg
FROM crew
ORDER BY weight_kg ASC, staff_name`, orderMatters: true }),
    task({ id: "normal-readings", number: 11, title: "Первые показания", difficulty: "easy", description: "Покажи `timestamp`, `depth`, `rock_type` для записей не позднее 4 июня 1962 года, по времени.", hint: "Сравни timestamp с датой '1962-06-04 23:59:59'.", starterSql: "SELECT \"timestamp\", depth, rock_type\nFROM readings", sql: `SELECT "timestamp", depth, rock_type
FROM readings
WHERE "timestamp" <= TIMESTAMP '1962-06-04 23:59:59'
ORDER BY "timestamp"`, orderMatters: true }),
    task({ id: "crew-statuses", number: 12, title: "Статусы экипажа", difficulty: "easy", description: "Получите уникальные значения `status` из crew в алфавитном порядке.", hint: "Добавь DISTINCT после SELECT.", starterSql: "SELECT status\nFROM crew", sql: `SELECT DISTINCT status
FROM crew
ORDER BY status`, orderMatters: true }),
    task({ id: "deck-one-lifts", number: 13, title: "Лифты первой палубы", difficulty: "easy", description: "Найди лифты на палубе 1. Верни `lift_name`, `time`, сначала самые поздние записи.", hint: "В lift_locations поле deck хранится как текст.", starterSql: "SELECT lift_name, time\nFROM lift_locations", sql: `SELECT lift_name, time
FROM lift_locations
WHERE deck = '1'
ORDER BY time DESC, lift_name`, orderMatters: true }),
    task({ id: "lubricant-leaks", number: 14, title: "Утечки смазки", difficulty: "easy", description: "Покажи названия лифтов с неисправностью `Lubricant leak`.", hint: "Фильтр нужен по столбцу malfunction.", starterSql: "SELECT lift_name\nFROM lift_malfunctions", sql: `SELECT lift_name
FROM lift_malfunctions
WHERE malfunction = 'Lubricant leak'
ORDER BY lift_name`, orderMatters: true }),
    task({ id: "incoming-calls", number: 15, title: "Входящие звонки", difficulty: "easy", description: "Выведи `staff_id`, `phone_number`, `start_time` входящих звонков в хронологическом порядке.", hint: "Значение направления записано как Incoming.", starterSql: "SELECT staff_id, phone_number, start_time\nFROM phone_logs", sql: `SELECT staff_id, phone_number, start_time
FROM phone_logs
WHERE incoming_outgoing = 'Incoming'
ORDER BY start_time, staff_id`, orderMatters: true }),
    task({ id: "station-one-visits", number: 16, title: "Посещения первого склада", difficulty: "easy", description: "Покажи `staff_name`, `staff_id`, `timestamp` посещений station 1 от раннего к позднему.", hint: "Отфильтруй depot_records по depot.", starterSql: "SELECT staff_name, staff_id, \"timestamp\"\nFROM depot_records", sql: `SELECT staff_name, staff_id, "timestamp"
FROM depot_records
WHERE depot = 'station 1'
ORDER BY "timestamp"`, orderMatters: true }),
    task({ id: "missing-pods", number: 17, title: "Пропавшие капсулы", difficulty: "easy", description: "Найди все капсулы со статусом missing. Верни `id` и `range`.", hint: "Используй WHERE status = 'missing'.", starterSql: "SELECT id, range\nFROM pods_list", sql: `SELECT id, range
FROM pods_list
WHERE status = 'missing'
ORDER BY id`, orderMatters: true }),

    task({ id: "crew-count-by-status", number: 18, title: "Экипаж по состоянию", difficulty: "medium", description: "Посчитай людей каждого статуса. Верни `status`, `crew_count`; большее количество первым.", hint: "Сгруппируй по status и используй COUNT(*).", starterSql: "SELECT status, COUNT(*) AS crew_count\nFROM crew", sql: `SELECT status, COUNT(*) AS crew_count
FROM crew
GROUP BY status
ORDER BY crew_count DESC, status`, orderMatters: true }),
    task({ id: "deck-status-summary", number: 19, title: "Состояние по палубам", difficulty: "medium", description: "Посчитай экипаж для каждой пары `last_location` и `status`. Назови число `crew_count`.", hint: "В GROUP BY перечисли два столбца.", starterSql: "SELECT last_location, status, COUNT(*) AS crew_count\nFROM crew", sql: `SELECT last_location, status, COUNT(*) AS crew_count
FROM crew
GROUP BY last_location, status
ORDER BY last_location, status`, orderMatters: true }),
    task({ id: "pod-loads", number: 20, title: "Нагрузка групп", difficulty: "medium", description: "Для живых и раненых посчитай общий вес и максимальный путь каждой группы. Колонки `pod_group`, `total_weight`, `max_distance`.", hint: "Исключи deceased, затем используй SUM и MAX.", starterSql: "SELECT pod_group,\n  \nFROM crew", sql: `SELECT pod_group,
  SUM(weight_kg) AS total_weight,
  MAX(distance_to_pod) AS max_distance
FROM crew
WHERE status != 'deceased'
GROUP BY pod_group
ORDER BY pod_group`, orderMatters: true }),
    task({ id: "fixed-weights", number: 21, title: "Исправленный вес", difficulty: "medium", description: "Создай `fixed_weight`: вес меньше 10 умножь на 10, остальные значения оставь. Верни имя, исходный и исправленный вес.", hint: "Используй CASE WHEN weight_kg < 10.", starterSql: "SELECT staff_name, weight_kg,\n  CASE\n  END AS fixed_weight\nFROM crew", sql: `SELECT staff_name, weight_kg,
  CASE WHEN weight_kg < 10 THEN weight_kg * 10 ELSE weight_kg END AS fixed_weight
FROM crew
ORDER BY weight_kg, staff_name`, orderMatters: true }),
    task({ id: "boarded-crew", number: 22, title: "Посадка по группам", difficulty: "medium", description: "Соедини crew и evacuation_groups. Верни `staff_name`, `pod_group`, `party_status` по группе и имени.", hint: "Связь проходит по pod_group.", starterSql: "SELECT c.staff_name, c.pod_group, eg.party_status\nFROM crew AS c\nJOIN evacuation_groups AS eg ON ...", sql: `SELECT c.staff_name, c.pod_group, eg.party_status
FROM crew AS c
JOIN evacuation_groups AS eg ON eg.pod_group = c.pod_group
ORDER BY c.pod_group, c.staff_name`, orderMatters: true }),
    task({ id: "not-boarded-crew", number: 23, title: "Кто не погрузился", difficulty: "medium", description: "Найди экипаж из групп, чей статус не равен boarded. Верни `staff_name` и `party_status` по имени.", hint: "После JOIN добавь WHERE party_status != 'boarded'.", starterSql: "SELECT c.staff_name, eg.party_status\nFROM crew AS c\nJOIN evacuation_groups AS eg ON ...", sql: `SELECT c.staff_name, eg.party_status
FROM crew AS c
JOIN evacuation_groups AS eg ON c.pod_group = eg.pod_group
WHERE eg.party_status != 'boarded'
ORDER BY c.staff_name`, orderMatters: true }),
    task({ id: "absent-original-crew", number: 24, title: "Пропавший экипаж", difficulty: "medium", description: "Найди сотрудников из original_crew, отсутствующих в crew. Верни `staff_name`, `staff_id`.", hint: "Подойдёт NOT EXISTS с сопоставлением сразу имени и ID.", starterSql: "SELECT oc.staff_name, oc.staff_id\nFROM original_crew AS oc", sql: `SELECT oc.staff_name, oc.staff_id
FROM original_crew AS oc
WHERE NOT EXISTS (
  SELECT 1
  FROM crew AS c
  WHERE c.staff_name = oc.staff_name
    AND c.staff_id = oc.staff_id
)
ORDER BY oc.staff_name`, orderMatters: true }),
    task({ id: "unknown-location", number: 25, title: "Без последней позиции", difficulty: "medium", description: "Покажи сотрудников full_crew без последнего местоположения: `staff_name`, `staff_id`.", hint: "Проверяй last_location через IS NULL.", starterSql: "SELECT staff_name, staff_id\nFROM full_crew", sql: `SELECT staff_name, staff_id
FROM full_crew
WHERE last_location IS NULL
ORDER BY staff_name`, orderMatters: true }),
    task({ id: "staff-history", number: 26, title: "История назначений", difficulty: "medium", description: "Собери роли каждого сотрудника через ` → ` в порядке изменений. Колонки `staff_name`, `role_history`.", hint: "Используй STRING_AGG(role, ' → ' ORDER BY change_order).", starterSql: "SELECT staff_name,\n  STRING_AGG(...) AS role_history\nFROM staffing_changes", sql: `SELECT staff_name,
  STRING_AGG(role, ' → ' ORDER BY change_order) AS role_history
FROM staffing_changes
GROUP BY staff_name
ORDER BY staff_name`, orderMatters: true }),
    task({ id: "latest-depot-visits", number: 27, title: "Последний посетитель склада", difficulty: "medium", description: "Верни последнее посещение каждого склада: `depot`, `staff_name`, `staff_id`, `timestamp`.", hint: "В PostgreSQL удобно применить DISTINCT ON (depot).", starterSql: "SELECT DISTINCT ON (depot)\n  \nFROM depot_records", sql: `SELECT DISTINCT ON (depot)
  depot, staff_name, staff_id, "timestamp"
FROM depot_records
ORDER BY depot, "timestamp" DESC`, orderMatters: true }),
    task({ id: "call-duration", number: 28, title: "Продолжительность звонков", difficulty: "medium", description: "Рассчитай длительность каждого звонка в секундах как `duration_seconds`. Верни ID, номер и длительность; длинные первыми.", hint: "EXTRACT(EPOCH FROM end_time - start_time) вернёт секунды.", starterSql: "SELECT staff_id, phone_number,\n  EXTRACT(...) AS duration_seconds\nFROM phone_logs", sql: `SELECT staff_id, phone_number,
  EXTRACT(EPOCH FROM end_time - start_time) AS duration_seconds
FROM phone_logs
ORDER BY duration_seconds DESC, staff_id, phone_number`, orderMatters: true }),
    task({ id: "phone-number-summary", number: 29, title: "Активность номеров", difficulty: "medium", description: "Для каждого номера посчитай `call_count` и максимальную длительность `max_duration_seconds`.", hint: "Сгруппируй phone_logs по phone_number.", starterSql: "SELECT phone_number, COUNT(*) AS call_count,\n  \nFROM phone_logs", sql: `SELECT phone_number,
  COUNT(*) AS call_count,
  MAX(EXTRACT(EPOCH FROM end_time - start_time)) AS max_duration_seconds
FROM phone_logs
GROUP BY phone_number
ORDER BY call_count DESC, phone_number`, orderMatters: true }),
    task({ id: "lift-problem-count", number: 30, title: "Диагностика лифтов", difficulty: "medium", description: "Посчитай число записей диагностики для каждого лифта. Верни `lift_name`, `check_count` по имени.", hint: "Сгруппируй lift_malfunctions по lift_name.", starterSql: "SELECT lift_name, COUNT(*) AS check_count\nFROM lift_malfunctions", sql: `SELECT lift_name, COUNT(*) AS check_count
FROM lift_malfunctions
GROUP BY lift_name
ORDER BY lift_name`, orderMatters: true }),
    task({ id: "latest-lift-position", number: 31, title: "Последние позиции лифтов", difficulty: "medium", description: "Для каждого лифта из lift_locations_2 верни последнюю `location` и её `timestamp`.", hint: "Применяй ROW_NUMBER по каждому lift_name.", starterSql: "WITH ranked AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH ranked AS (
  SELECT lift_name, "location", "timestamp",
    ROW_NUMBER() OVER (PARTITION BY lift_name ORDER BY "timestamp" DESC) AS rn
  FROM lift_locations_2
)
SELECT lift_name, "location", "timestamp"
FROM ranked
WHERE rn = 1
ORDER BY lift_name`, orderMatters: true }),
    task({ id: "readings-by-month", number: 32, title: "Показания по месяцам", difficulty: "medium", description: "Посчитай записи датчиков по месяцам. Верни `reading_month` и `reading_count` по времени.", hint: "Используй DATE_TRUNC('month', timestamp).", starterSql: "SELECT DATE_TRUNC(...) AS reading_month,\n  COUNT(*) AS reading_count\nFROM readings", sql: `SELECT DATE_TRUNC('month', "timestamp") AS reading_month,
  COUNT(*) AS reading_count
FROM readings
GROUP BY DATE_TRUNC('month', "timestamp")
ORDER BY reading_month`, orderMatters: true }),
    task({ id: "numeric-depths", number: 33, title: "Числовые глубины", difficulty: "medium", description: "Оставь показания, где depth состоит только из цифр. Верни время и числовую глубину `depth_m`, самые глубокие первыми.", hint: "Проверь depth регулярным выражением, затем преобразуй к bigint.", starterSql: "SELECT \"timestamp\", depth::bigint AS depth_m\nFROM readings", sql: `SELECT "timestamp", depth::bigint AS depth_m
FROM readings
WHERE depth ~ '^[0-9]+$'
ORDER BY depth_m DESC, "timestamp"`, orderMatters: true }),
    task({ id: "circuit-status-summary", number: 34, title: "Состояние электросети", difficulty: "medium", description: "Для каждого статуса цепей посчитай `circuit_count` и число затронутых палуб `deck_count`.", hint: "Для палуб используй COUNT(DISTINCT deck_number).", starterSql: "SELECT status, COUNT(*) AS circuit_count,\n  \nFROM circuits", sql: `SELECT status,
  COUNT(*) AS circuit_count,
  COUNT(DISTINCT deck_number) AS deck_count
FROM circuits
GROUP BY status
ORDER BY circuit_count DESC, status`, orderMatters: true }),

    task({ id: "distance-rank", number: 35, title: "Дальность до капсулы", difficulty: "hard", description: "Пронумеруй живых и раненых от самого далёкого к ближайшему. Верни `staff_name`, `distance_to_pod`, `distance_rank`.", hint: "Используй DENSE_RANK() OVER с сортировкой DESC.", starterSql: "SELECT staff_name, distance_to_pod,\n  DENSE_RANK() OVER (...) AS distance_rank\nFROM crew", sql: `SELECT staff_name, distance_to_pod,
  DENSE_RANK() OVER (ORDER BY distance_to_pod DESC) AS distance_rank
FROM crew
WHERE status != 'deceased'
ORDER BY distance_rank, staff_name`, orderMatters: true }),
    task({ id: "farthest-three-per-pod", number: 36, title: "Трое самых дальних", difficulty: "hard", description: "Для каждой группы найди трёх живых или раненых, которым идти дальше всех. Верни группу, имя, расстояние и `position_in_group`.", hint: "Пронумеруй строки через ROW_NUMBER PARTITION BY pod_group.", starterSql: "WITH ranked AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH ranked AS (
  SELECT pod_group, staff_name, distance_to_pod,
    ROW_NUMBER() OVER (
      PARTITION BY pod_group
      ORDER BY distance_to_pod DESC, staff_name
    ) AS position_in_group
  FROM crew
  WHERE status != 'deceased'
)
SELECT pod_group, staff_name, distance_to_pod, position_in_group
FROM ranked
WHERE position_in_group <= 3
ORDER BY pod_group, position_in_group`, orderMatters: true }),
    task({ id: "corrected-pod-loads", number: 37, title: "Реальная нагрузка капсул", difficulty: "hard", description: "Исправь веса меньше 10, затем посчитай `total_weight` каждой группы без погибших. Тяжёлые группы первыми.", hint: "Вынеси исправленный вес в CTE.", starterSql: "WITH corrected AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH corrected AS (
  SELECT pod_group,
    CASE WHEN weight_kg < 10 THEN weight_kg * 10 ELSE weight_kg END AS fixed_weight
  FROM crew
  WHERE status != 'deceased'
)
SELECT pod_group, SUM(fixed_weight) AS total_weight
FROM corrected
GROUP BY pod_group
ORDER BY total_weight DESC, pod_group`, orderMatters: true }),
    task({ id: "overloaded-pods", number: 38, title: "Перегруженные капсулы", difficulty: "hard", description: "После исправления веса оставь группы тяжелее 1000 кг. Верни `pod_group`, `total_weight` по убыванию.", hint: "После CTE сгруппируй данные и используй HAVING.", starterSql: "WITH corrected AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH corrected AS (
  SELECT pod_group,
    CASE WHEN weight_kg < 10 THEN weight_kg * 10 ELSE weight_kg END AS fixed_weight
  FROM crew
  WHERE status != 'deceased'
)
SELECT pod_group, SUM(fixed_weight) AS total_weight
FROM corrected
GROUP BY pod_group
HAVING SUM(fixed_weight) > 1000
ORDER BY total_weight DESC, pod_group`, orderMatters: true }),
    task({ id: "status-percentage", number: 39, title: "Доля состояний", difficulty: "hard", description: "Рассчитай процент экипажа в каждом статусе как `crew_percent`, округлив до одного знака.", hint: "Раздели COUNT(*) группы на SUM(COUNT(*)) OVER ().", starterSql: "SELECT status, COUNT(*) AS crew_count,\n  ROUND(...) AS crew_percent\nFROM crew", sql: `SELECT status,
  COUNT(*) AS crew_count,
  ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 1) AS crew_percent
FROM crew
GROUP BY status
ORDER BY crew_percent DESC, status`, orderMatters: true }),
    task({ id: "pod-equipment-match", number: 40, title: "Группы и аппараты", difficulty: "hard", description: "Свяжи эвакуационные группы с pods_list по префиксу ID. Верни `pod_group`, `pod_id`, `pod_status`, `range`.", hint: "ID капсулы — первые четыре символа pod_group.", starterSql: "SELECT eg.pod_group, p.id AS pod_id,\n  p.status AS pod_status, p.range\nFROM evacuation_groups AS eg\nJOIN pods_list AS p ON ...", sql: `SELECT eg.pod_group,
  p.id AS pod_id,
  p.status AS pod_status,
  p.range
FROM evacuation_groups AS eg
JOIN pods_list AS p ON p.id = LEFT(eg.pod_group, 4)
ORDER BY eg.pod_group`, orderMatters: true }),
    task({ id: "evacuation-summary", number: 41, title: "Сводка эвакуации", difficulty: "hard", description: "По статусу посадки посчитай число групп, людей без погибших и исправленный вес. Верни `party_status`, `group_count`, `crew_count`, `total_weight`.", hint: "Соедини crew с evacuation_groups и используй COUNT DISTINCT.", starterSql: "WITH corrected AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH corrected AS (
  SELECT pod_group, staff_name,
    CASE WHEN weight_kg < 10 THEN weight_kg * 10 ELSE weight_kg END AS fixed_weight
  FROM crew
  WHERE status != 'deceased'
)
SELECT eg.party_status,
  COUNT(DISTINCT eg.pod_group) AS group_count,
  COUNT(c.staff_name) AS crew_count,
  SUM(c.fixed_weight) AS total_weight
FROM evacuation_groups AS eg
JOIN corrected AS c ON c.pod_group = eg.pod_group
GROUP BY eg.party_status
ORDER BY eg.party_status`, orderMatters: true }),
    task({ id: "last-role", number: 42, title: "Последняя должность", difficulty: "hard", description: "Для каждого сотрудника с кадровой историей верни его последнюю роль: `staff_name`, `last_role`.", hint: "Пронумеруй изменения по change_order DESC.", starterSql: "WITH ranked AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH ranked AS (
  SELECT staff_name, role,
    ROW_NUMBER() OVER (PARTITION BY staff_name ORDER BY change_order DESC) AS rn
  FROM staffing_changes
)
SELECT staff_name, role AS last_role
FROM ranked
WHERE rn = 1
ORDER BY staff_name`, orderMatters: true }),
    task({ id: "returned-after-injury", number: 43, title: "Вернувшиеся после травмы", difficulty: "hard", description: "Найди сотрудников, у которых после записи Injured встречается Returned. Верни только `staff_name`.", hint: "Сравни минимальный order Injured с максимальным order Returned.", starterSql: "SELECT staff_name\nFROM staffing_changes\nGROUP BY staff_name", sql: `SELECT staff_name
FROM staffing_changes
GROUP BY staff_name
HAVING MIN(change_order) FILTER (WHERE role = 'Injured')
     < MAX(change_order) FILTER (WHERE role = 'Returned')
ORDER BY staff_name`, orderMatters: true }),
    task({ id: "depot-last-row-number", number: 44, title: "Последние записи складов", difficulty: "hard", description: "Найди последнюю запись каждого склада оконной функцией. Верни `staff_name`, `staff_id`, `depot`, `timestamp`.", hint: "ROW_NUMBER должен начинаться заново для каждого depot.", starterSql: "WITH visits AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH visits AS (
  SELECT staff_name, staff_id, depot, "timestamp",
    ROW_NUMBER() OVER (PARTITION BY depot ORDER BY "timestamp" DESC) AS rn
  FROM depot_records
)
SELECT staff_name, staff_id, depot, "timestamp"
FROM visits
WHERE rn = 1
ORDER BY depot`, orderMatters: true }),
    task({ id: "anonymous-phone-link", number: 45, title: "Связь анонимного ID", difficulty: "hard", description: "Найди номера, звонившие анонимному mm833 и хотя бы одному другому ID дольше секунды. Верни `phone_number`, `distinct_staff_ids`, `max_duration_seconds`.", hint: "Сгруппируй по номеру и проверь mm833 через BOOL_OR.", starterSql: "SELECT phone_number,\n  COUNT(DISTINCT staff_id) AS distinct_staff_ids,\n  ...\nFROM phone_logs", sql: `SELECT phone_number,
  COUNT(DISTINCT staff_id) AS distinct_staff_ids,
  MAX(EXTRACT(EPOCH FROM end_time - start_time)) AS max_duration_seconds
FROM phone_logs
GROUP BY phone_number
HAVING BOOL_OR(staff_id = 'mm833')
   AND COUNT(DISTINCT staff_id) > 1
   AND MAX(EXTRACT(EPOCH FROM end_time - start_time)) > 1
ORDER BY phone_number`, orderMatters: true }),
    task({ id: "safe-lifts", number: 46, title: "Безопасные лифты", difficulty: "hard", description: "Найди лифты ниже палубы 2 без Flooded, Short circuit, Loss of oxygen и Broken drive shaft. Верни `lift_name`, `deck`.", hint: "Используй NOT EXISTS по lift_malfunctions.", starterSql: "SELECT ll.lift_name, ll.deck\nFROM lift_locations AS ll", sql: `SELECT ll.lift_name, ll.deck
FROM lift_locations AS ll
WHERE ll.deck::numeric < 2
  AND NOT EXISTS (
    SELECT 1
    FROM lift_malfunctions AS lm
    WHERE lm.lift_name = ll.lift_name
      AND lm.malfunction IN ('Flooded', 'Short circuit', 'Loss of oxygen', 'Broken drive shaft')
  )
ORDER BY ll.lift_name`, orderMatters: true }),
    task({ id: "lift-noise-report", number: 47, title: "Шум лифтов", difficulty: "hard", description: "Для безопасных лифтов ниже палубы 2 рассчитай `noisy`: 1 при утечке смазки, иначе 0. Верни `lift_name`, `deck`, `noisy`.", hint: "Один EXISTS подходит для CASE, второй NOT EXISTS — для опасных поломок.", starterSql: "SELECT ll.lift_name, ll.deck,\n  CASE ... END AS noisy\nFROM lift_locations AS ll", sql: `SELECT ll.lift_name,
  ll.deck,
  CASE WHEN EXISTS (
    SELECT 1 FROM lift_malfunctions AS noise
    WHERE noise.lift_name = ll.lift_name
      AND noise.malfunction = 'Lubricant leak'
  ) THEN 1 ELSE 0 END AS noisy
FROM lift_locations AS ll
WHERE ll.deck::numeric < 2
  AND NOT EXISTS (
    SELECT 1 FROM lift_malfunctions AS danger
    WHERE danger.lift_name = ll.lift_name
      AND danger.malfunction IN ('Flooded', 'Short circuit', 'Loss of oxygen', 'Broken drive shaft')
  )
ORDER BY ll.lift_name`, orderMatters: true }),
    task({ id: "reading-sequence", number: 48, title: "Нарастание аномалий", difficulty: "hard", description: "Для показаний после 4 июня верни время, depth и порядковый номер `reading_number` в хронологии.", hint: "Используй ROW_NUMBER() OVER (ORDER BY timestamp).", starterSql: "SELECT \"timestamp\", depth,\n  ROW_NUMBER() OVER (...) AS reading_number\nFROM readings", sql: `SELECT "timestamp", depth,
  ROW_NUMBER() OVER (ORDER BY "timestamp") AS reading_number
FROM readings
WHERE "timestamp" > TIMESTAMP '1962-06-04 23:59:59'
ORDER BY "timestamp", depth`, orderMatters: true }),
    task({ id: "future-anomalies", number: 49, title: "Записи из будущего", difficulty: "hard", description: "Сгруппируй показания после 1962 года по году. Верни `reading_year`, `reading_count`, `unique_depths`.", hint: "Год можно получить через EXTRACT(YEAR FROM timestamp).", starterSql: "SELECT EXTRACT(YEAR FROM \"timestamp\") AS reading_year,\n  ...\nFROM readings", sql: `SELECT EXTRACT(YEAR FROM "timestamp")::integer AS reading_year,
  COUNT(*) AS reading_count,
  COUNT(DISTINCT depth) AS unique_depths
FROM readings
WHERE "timestamp" >= TIMESTAMP '1963-01-01'
GROUP BY EXTRACT(YEAR FROM "timestamp")
ORDER BY reading_year`, orderMatters: true }),
    task({ id: "evacuation-risk", number: 50, title: "Рейтинг риска эвакуации", difficulty: "hard", description: "Для каждой группы без погибших рассчитай исправленный `total_weight`, `max_distance` и `risk_score`: +3 при весе >1000, +2 при пути >250, +5 если группа не boarded. Риск — по убыванию.", hint: "Сначала собери показатели группы в CTE, затем сложи три CASE.", starterSql: "WITH group_stats AS (\n  SELECT ...\n)\nSELECT ...", sql: `WITH group_stats AS (
  SELECT c.pod_group,
    SUM(CASE WHEN c.weight_kg < 10 THEN c.weight_kg * 10 ELSE c.weight_kg END) AS total_weight,
    MAX(c.distance_to_pod) AS max_distance,
    eg.party_status
  FROM crew AS c
  JOIN evacuation_groups AS eg ON eg.pod_group = c.pod_group
  WHERE c.status != 'deceased'
  GROUP BY c.pod_group, eg.party_status
)
SELECT pod_group, total_weight, max_distance,
  CASE WHEN total_weight > 1000 THEN 3 ELSE 0 END
  + CASE WHEN max_distance > 250 THEN 2 ELSE 0 END
  + CASE WHEN party_status != 'boarded' THEN 5 ELSE 0 END AS risk_score
FROM group_stats
ORDER BY risk_score DESC, total_weight DESC, pod_group`, orderMatters: true }),
  ],
};
