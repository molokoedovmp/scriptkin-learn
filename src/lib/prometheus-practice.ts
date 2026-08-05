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
  return {
    ...definition,
    solution: normalizedSql,
    expectedSql: normalizedSql,
  };
}

export const PROMETHEUS: ServerPracticeDatabase = {
  questSlug: "prometheus",
  previewUrl: "/quests/prometheus/preview.png",
  erDiagramUrl: "/quests/prometheus/prometheus-erp.png",
  schemaDescription:
    "База описывает устройство грузового корабля «Прометей». Таблица sectors служит главным справочником помещений: с ней связаны технические системы, события, смены экипажа, медицинские сканы, грузовые объекты, дроны, биодатчики и спасательные аппараты. Переходы между секторами образуют отдельный граф маршрутов.\n\nДанные разделены на несколько взаимосвязанных областей: технический журнал ship_systems и system_events, экипаж и доступ, грузовой манифест, обслуживание дронами, активность ARGO и эвакуационные системы. На этой структуре можно изучать сложные JOIN, коррелированные подзапросы, операции множеств, оконные функции и рекурсивные CTE.",
  title: "Прометей",
  emoji: "🛰️",
  description:
    "Семнадцать связанных таблиц аварийного корабля: от секторов и экипажа до медицинских сканов, команд ARGO и спасательных модулей. 50 заданий охватывают путь от простых фильтров до рекурсивных CTE и оконных функций.",
  tables: [
    { name: "sectors", description: "Секторы и палубы корабля", columns: ["sector_id", "sector_code", "sector_name", "deck_number", "sector_type", "pressure_kpa", "temperature_c", "power_status", "contamination_level", "is_accessible"] },
    { name: "sector_connections", description: "Переходы и двери между секторами", columns: ["connection_id", "from_sector_id", "to_sector_id", "door_status", "required_access_level", "travel_time_sec", "is_pressurized"] },
    { name: "ship_systems", description: "Технические системы корабля", columns: ["system_id", "system_name", "system_type", "sector_id", "status", "power_required", "priority_level", "last_service_at"] },
    { name: "system_events", description: "Журнал системных событий", columns: ["event_id", "system_id", "sector_id", "event_type", "severity", "event_value", "event_message", "recorded_at"] },
    { name: "crew_members", description: "Реестр членов экипажа", columns: ["crew_id", "full_name", "role", "department", "badge_id", "access_level", "official_status", "cabin_sector_id"] },
    { name: "crew_shifts", description: "Рабочие смены экипажа", columns: ["shift_id", "crew_id", "sector_id", "shift_start", "shift_end", "shift_role"] },
    { name: "access_logs", description: "Использование пропусков и терминалов", columns: ["access_id", "badge_id", "sector_id", "access_time", "access_result", "entry_type", "device_id"] },
    { name: "communications", description: "Сообщения экипажа, систем и ARGO", columns: ["message_id", "sender_crew_id", "sender_type", "channel", "message_type", "message_text", "sent_at", "voice_signature", "is_corrupted"] },
    { name: "medical_scans", description: "Медицинские и биологические показатели", columns: ["scan_id", "crew_id", "sector_id", "heart_rate", "oxygen_level", "body_temperature", "tissue_anomaly", "medical_status", "scanned_at"] },
    { name: "cargo_containers", description: "Грузовые контейнеры", columns: ["container_id", "container_code", "declared_category", "sector_id", "seal_status", "loaded_at", "opened_at", "opened_by_badge", "corporate_clearance"] },
    { name: "cargo_items", description: "Содержимое контейнеров", columns: ["item_id", "container_id", "item_code", "item_name", "item_category", "quantity", "hazard_class", "is_declared", "storage_temperature"] },
    { name: "maintenance_drones", description: "Ремонтные, медицинские и грузовые дроны", columns: ["drone_id", "drone_code", "drone_type", "current_sector_id", "status", "controlled_by", "last_contact_at"] },
    { name: "drone_tasks", description: "Задания обслуживающих дронов", columns: ["task_id", "drone_id", "sector_id", "task_type", "material_code", "ordered_by", "task_status", "started_at", "completed_at"] },
    { name: "biohazard_events", description: "Показания биологических датчиков", columns: ["bio_event_id", "sector_id", "threat_level", "movement_count", "organic_mass", "sensor_status", "detected_at"] },
    { name: "ai_commands", description: "Команды корабельного ИИ ARGO", columns: ["command_id", "command_type", "target_system_id", "target_sector_id", "command_text", "priority", "source_directive", "executed_at", "was_overridden"] },
    { name: "escape_pods", description: "Спасательные и ремонтные аппараты", columns: ["pod_id", "pod_code", "pod_type", "sector_id", "status", "fuel_percent", "oxygen_minutes", "hull_integrity", "launch_lock", "capacity"] },
    { name: "pod_diagnostics", description: "Диагностика подсистем аппаратов", columns: ["diagnostic_id", "pod_id", "subsystem_name", "status", "measured_value", "checked_at"] },
  ],
  tasks: [
    task({
      id: "sector-directory", number: 1, title: "Справочник секторов", difficulty: "easy",
      description: "Выведи код, название и номер палубы каждого сектора. Колонки: `sector_code`, `sector_name`, `deck_number`; сортировка по палубе и коду.",
      hint: "Выбери три колонки из sectors и используй ORDER BY по двум полям.",
      starterSql: "SELECT\n  \nFROM sectors",
      sql: `SELECT sector_code, sector_name, deck_number
FROM sectors
ORDER BY deck_number, sector_code`, orderMatters: true,
    }),
    task({
      id: "accessible-sectors", number: 2, title: "Открытые сектора", difficulty: "easy",
      description: "Найди доступные сектора. Верни `sector_code` и `sector_name` по коду.",
      hint: "Логическое поле is_accessible можно сравнить с TRUE.",
      starterSql: "SELECT sector_code, sector_name\nFROM sectors",
      sql: `SELECT sector_code, sector_name
FROM sectors
WHERE is_accessible = TRUE
ORDER BY sector_code`, orderMatters: true,
    }),
    task({
      id: "high-contamination", number: 3, title: "Опасное заражение", difficulty: "easy",
      description: "Покажи сектора с уровнем заражения не ниже 60. Верни `sector_code` и `contamination_level`, самые заражённые первыми.",
      hint: "Используй >= 60 и сортировку DESC.",
      starterSql: "SELECT sector_code, contamination_level\nFROM sectors",
      sql: `SELECT sector_code, contamination_level
FROM sectors
WHERE contamination_level >= 60
ORDER BY contamination_level DESC, sector_code`, orderMatters: true,
    }),
    task({
      id: "offline-systems", number: 4, title: "Отключённые системы", difficulty: "easy",
      description: "Найди системы со статусом `offline`. Верни `system_name` и `system_type` по названию.",
      hint: "Отфильтруй ship_systems по строковому полю status.",
      starterSql: "SELECT system_name, system_type\nFROM ship_systems",
      sql: `SELECT system_name, system_type
FROM ship_systems
WHERE status = 'offline'
ORDER BY system_name`, orderMatters: true,
    }),
    task({
      id: "severity-five-events", number: 5, title: "События высшей опасности", difficulty: "easy",
      description: "Выведи события с уровнем опасности 5: `event_type`, `severity`, `recorded_at`. Сохрани хронологию.",
      hint: "Условие severity = 5, затем ORDER BY recorded_at и event_type.",
      starterSql: "SELECT event_type, severity, recorded_at\nFROM system_events",
      sql: `SELECT event_type, severity, recorded_at
FROM system_events
WHERE severity = 5
ORDER BY recorded_at, event_type`, orderMatters: true,
    }),
    task({
      id: "living-crew", number: 6, title: "Живые в реестре", difficulty: "easy",
      description: "Покажи членов экипажа с официальным статусом `alive`. Верни `full_name`, `role`, `department` по имени.",
      hint: "Нужен WHERE official_status = 'alive'.",
      starterSql: "SELECT full_name, role, department\nFROM crew_members",
      sql: `SELECT full_name, role, department
FROM crew_members
WHERE official_status = 'alive'
ORDER BY full_name`, orderMatters: true,
    }),
    task({
      id: "senior-engineers", number: 7, title: "Инженерный доступ", difficulty: "easy",
      description: "Найди сотрудников Engineering с уровнем доступа не ниже 4. Верни `full_name`, `role`, `access_level` по имени.",
      hint: "Соедини два условия через AND.",
      starterSql: "SELECT full_name, role, access_level\nFROM crew_members",
      sql: `SELECT full_name, role, access_level
FROM crew_members
WHERE department = 'Engineering'
  AND access_level >= 4
ORDER BY full_name`, orderMatters: true,
    }),
    task({
      id: "denied-access", number: 8, title: "Отклонённые пропуска", difficulty: "easy",
      description: "Покажи неудачные попытки доступа: `badge_id`, `device_id`, `access_time`. Сначала ранние.",
      hint: "Фильтруй access_result по значению denied.",
      starterSql: "SELECT badge_id, device_id, access_time\nFROM access_logs",
      sql: `SELECT badge_id, device_id, access_time
FROM access_logs
WHERE access_result = 'denied'
ORDER BY access_time, access_id`, orderMatters: true,
    }),
    task({
      id: "intact-ai-messages", number: 9, title: "Сообщения ARGO", difficulty: "easy",
      description: "Найди неповреждённые сообщения ИИ. Верни `message_id`, `message_text`, `sent_at` по времени.",
      hint: "Проверь sender_type = 'ai' и is_corrupted = FALSE.",
      starterSql: "SELECT message_id, message_text, sent_at\nFROM communications",
      sql: `SELECT message_id, message_text, sent_at
FROM communications
WHERE sender_type = 'ai'
  AND is_corrupted = FALSE
ORDER BY sent_at, message_id`, orderMatters: true,
    }),
    task({
      id: "critical-tissue", number: 10, title: "Тканевая аномалия", difficulty: "easy",
      description: "Покажи сканирования с тканевой аномалией не ниже 50: `crew_id`, `tissue_anomaly`, `scanned_at`. Самые высокие значения первыми.",
      hint: "Используй tissue_anomaly >= 50.",
      starterSql: "SELECT crew_id, tissue_anomaly, scanned_at\nFROM medical_scans",
      sql: `SELECT crew_id, tissue_anomaly, scanned_at
FROM medical_scans
WHERE tissue_anomaly >= 50
ORDER BY tissue_anomaly DESC, scanned_at`, orderMatters: true,
    }),
    task({
      id: "undeclared-items", number: 11, title: "Незаявленный груз", difficulty: "easy",
      description: "Найди незадекларированные предметы. Верни `item_code`, `item_name`, `hazard_class` по коду.",
      hint: "Ложное значение хранится в is_declared.",
      starterSql: "SELECT item_code, item_name, hazard_class\nFROM cargo_items",
      sql: `SELECT item_code, item_name, hazard_class
FROM cargo_items
WHERE is_declared = FALSE
ORDER BY item_code`, orderMatters: true,
    }),
    task({
      id: "active-drones", number: 12, title: "Активные дроны", difficulty: "easy",
      description: "Покажи активные дроны: `drone_code`, `drone_type`, `controlled_by`. Отсортируй по коду.",
      hint: "В maintenance_drones активное состояние называется active.",
      starterSql: "SELECT drone_code, drone_type, controlled_by\nFROM maintenance_drones",
      sql: `SELECT drone_code, drone_type, controlled_by
FROM maintenance_drones
WHERE status = 'active'
ORDER BY drone_code`, orderMatters: true,
    }),
    task({
      id: "completed-drone-tasks", number: 13, title: "Завершённые работы", difficulty: "easy",
      description: "Выведи завершённые задания дронов: `task_id`, `task_type`, `completed_at` в порядке завершения.",
      hint: "Отфильтруй task_status = 'completed'.",
      starterSql: "SELECT task_id, task_type, completed_at\nFROM drone_tasks",
      sql: `SELECT task_id, task_type, completed_at
FROM drone_tasks
WHERE task_status = 'completed'
ORDER BY completed_at, task_id`, orderMatters: true,
    }),
    task({
      id: "maximum-bio-threat", number: 14, title: "Максимальная биоугроза", difficulty: "easy",
      description: "Найди события с уровнем угрозы 5. Верни `sector_id`, `organic_mass`, `detected_at`; сначала поздние.",
      hint: "Условие threat_level = 5, сортировка времени DESC.",
      starterSql: "SELECT sector_id, organic_mass, detected_at\nFROM biohazard_events",
      sql: `SELECT sector_id, organic_mass, detected_at
FROM biohazard_events
WHERE threat_level = 5
ORDER BY detected_at DESC, bio_event_id DESC`, orderMatters: true,
    }),
    task({
      id: "repair-module-resources", number: 15, title: "Ремонтные модули", difficulty: "easy",
      description: "Покажи все ремонтные модули: `pod_code`, `status`, `fuel_percent`, `oxygen_minutes`. Сначала аппараты с большим запасом кислорода.",
      hint: "Фильтруй pod_type = 'repair_module'.",
      starterSql: "SELECT pod_code, status, fuel_percent, oxygen_minutes\nFROM escape_pods",
      sql: `SELECT pod_code, status, fuel_percent, oxygen_minutes
FROM escape_pods
WHERE pod_type = 'repair_module'
ORDER BY oxygen_minutes DESC, pod_code`, orderMatters: true,
    }),
    task({
      id: "system-type-list", number: 16, title: "Типы систем", difficulty: "easy",
      description: "Получи уникальный список типов корабельных систем в колонке `system_type` по алфавиту.",
      hint: "Используй DISTINCT.",
      starterSql: "SELECT\nFROM ship_systems",
      sql: `SELECT DISTINCT system_type
FROM ship_systems
ORDER BY system_type`, orderMatters: true,
    }),
    task({
      id: "pressure-state", number: 17, title: "Состояние давления", difficulty: "easy",
      description: "Для каждого сектора верни `sector_code` и `pressure_state`: при давлении 90 и выше — `норма`, иначе — `опасно`. Сортировка по коду.",
      hint: "Сформируй pressure_state через CASE.",
      starterSql: "SELECT sector_code,\n  CASE\n  END AS pressure_state\nFROM sectors",
      sql: `SELECT sector_code,
  CASE WHEN pressure_kpa >= 90 THEN 'норма' ELSE 'опасно' END AS pressure_state
FROM sectors
ORDER BY sector_code`, orderMatters: true,
    }),
    task({
      id: "systems-by-sector", number: 18, title: "Системы по секторам", difficulty: "medium",
      description: "Посчитай системы в каждом секторе, включая сектора без систем. Верни `sector_code`, `system_count`; сначала наибольшее количество.",
      hint: "Нужны LEFT JOIN, COUNT(system_id) и GROUP BY.",
      starterSql: "SELECT s.sector_code, COUNT(...) AS system_count\nFROM sectors AS s\nLEFT JOIN ship_systems AS ss ON ...",
      sql: `SELECT s.sector_code, COUNT(ss.system_id) AS system_count
FROM sectors AS s
LEFT JOIN ship_systems AS ss ON ss.sector_id = s.sector_id
GROUP BY s.sector_id, s.sector_code
ORDER BY system_count DESC, s.sector_code`, orderMatters: true,
    }),
    task({
      id: "deck-contamination", number: 19, title: "Заражение палуб", difficulty: "medium",
      description: "Для каждой палубы вычисли средний уровень заражения `avg_contamination`, округлённый до одного знака. Верни `deck_number` и среднее по номеру палубы.",
      hint: "Примени ROUND(AVG(...), 1) и GROUP BY deck_number.",
      starterSql: "SELECT deck_number,\n  ROUND(...) AS avg_contamination\nFROM sectors",
      sql: `SELECT deck_number, ROUND(AVG(contamination_level), 1) AS avg_contamination
FROM sectors
GROUP BY deck_number
ORDER BY deck_number`, orderMatters: true,
    }),
    task({
      id: "event-details", number: 20, title: "Расшифровка событий", difficulty: "medium",
      description: "Для событий опасности 5 выведи `recorded_at`, `sector_code`, `system_name`, `event_type`. Сохрани хронологию.",
      hint: "Соедини system_events с sectors и ship_systems по двум внешним ключам.",
      starterSql: "SELECT\nFROM system_events AS se\nJOIN ship_systems AS ss ON ...\nJOIN sectors AS s ON ...",
      sql: `SELECT se.recorded_at, s.sector_code, ss.system_name, se.event_type
FROM system_events AS se
JOIN ship_systems AS ss ON ss.system_id = se.system_id
JOIN sectors AS s ON s.sector_id = se.sector_id
WHERE se.severity = 5
ORDER BY se.recorded_at, se.event_id`, orderMatters: true,
    }),
    task({
      id: "crew-cabins", number: 21, title: "Размещение экипажа", difficulty: "medium",
      description: "Покажи имя, роль и код сектора каюты каждого сотрудника с назначенной каютой. Колонки: `full_name`, `role`, `sector_code`; сортировка по сектору и имени.",
      hint: "Соедини cabin_sector_id с sectors.sector_id.",
      starterSql: "SELECT cm.full_name, cm.role, s.sector_code\nFROM crew_members AS cm\nJOIN sectors AS s ON ...",
      sql: `SELECT cm.full_name, cm.role, s.sector_code
FROM crew_members AS cm
JOIN sectors AS s ON s.sector_id = cm.cabin_sector_id
ORDER BY s.sector_code, cm.full_name`, orderMatters: true,
    }),
    task({
      id: "crew-denials", number: 22, title: "Отказы сотрудникам", difficulty: "medium",
      description: "Посчитай отказы доступа для известных сотрудников. Верни `full_name` и `denied_count` только для имеющих отказы; сначала большее число.",
      hint: "Свяжи badge_id, отфильтруй denied и сгруппируй по сотруднику.",
      starterSql: "SELECT cm.full_name, COUNT(*) AS denied_count\nFROM access_logs AS al\nJOIN crew_members AS cm ON ...",
      sql: `SELECT cm.full_name, COUNT(*) AS denied_count
FROM access_logs AS al
JOIN crew_members AS cm ON cm.badge_id = al.badge_id
WHERE al.access_result = 'denied'
GROUP BY cm.crew_id, cm.full_name
ORDER BY denied_count DESC, cm.full_name`, orderMatters: true,
    }),
    task({
      id: "messages-by-sender", number: 23, title: "Источники сообщений", difficulty: "medium",
      description: "Посчитай сообщения каждого типа отправителя. Верни `sender_type` и `message_count`, сначала большее количество.",
      hint: "GROUP BY sender_type и COUNT(*).",
      starterSql: "SELECT sender_type, COUNT(*) AS message_count\nFROM communications",
      sql: `SELECT sender_type, COUNT(*) AS message_count
FROM communications
GROUP BY sender_type
ORDER BY message_count DESC, sender_type`, orderMatters: true,
    }),
    task({
      id: "latest-medical-scan", number: 24, title: "Последний медосмотр", difficulty: "medium",
      description: "Для каждого обследованного сотрудника найди последнее сканирование. Верни `full_name`, `medical_status`, `scanned_at` по имени.",
      hint: "В PostgreSQL удобно применить DISTINCT ON (crew_id) с сортировкой времени DESC.",
      starterSql: "WITH latest AS (\n  SELECT DISTINCT ON (...)\n  FROM medical_scans\n)\nSELECT ...",
      sql: `WITH latest AS (
  SELECT DISTINCT ON (crew_id) crew_id, medical_status, scanned_at
  FROM medical_scans
  ORDER BY crew_id, scanned_at DESC, scan_id DESC
)
SELECT cm.full_name, l.medical_status, l.scanned_at
FROM latest AS l
JOIN crew_members AS cm ON cm.crew_id = l.crew_id
ORDER BY cm.full_name`, orderMatters: true,
    }),
    task({
      id: "hidden-container-items", number: 25, title: "Скрытое содержимое", difficulty: "medium",
      description: "Покажи незадекларированные предметы вместе с контейнером. Верни `container_code`, `item_code`, `item_name`, `hazard_class` по контейнеру и коду предмета.",
      hint: "Соедини cargo_items.container_id с cargo_containers.container_id.",
      starterSql: "SELECT\nFROM cargo_items AS ci\nJOIN cargo_containers AS cc ON ...",
      sql: `SELECT cc.container_code, ci.item_code, ci.item_name, ci.hazard_class
FROM cargo_items AS ci
JOIN cargo_containers AS cc ON cc.container_id = ci.container_id
WHERE ci.is_declared = FALSE
ORDER BY cc.container_code, ci.item_code`, orderMatters: true,
    }),
    task({
      id: "drone-task-map", number: 26, title: "Маршруты дронов", difficulty: "medium",
      description: "Расшифруй задания дронов. Верни `drone_code`, `sector_code`, `task_type`, `task_status`; сортировка по дрону и началу работы.",
      hint: "Соедини drone_tasks с maintenance_drones и sectors.",
      starterSql: "SELECT\nFROM drone_tasks AS dt\nJOIN maintenance_drones AS md ON ...\nJOIN sectors AS s ON ...",
      sql: `SELECT md.drone_code, s.sector_code, dt.task_type, dt.task_status
FROM drone_tasks AS dt
JOIN maintenance_drones AS md ON md.drone_id = dt.drone_id
JOIN sectors AS s ON s.sector_id = dt.sector_id
ORDER BY md.drone_code, dt.started_at, dt.task_id`, orderMatters: true,
    }),
    task({
      id: "biohazard-summary", number: 27, title: "Сводка биодатчиков", difficulty: "medium",
      description: "Для секторов минимум с двумя биособытиями выведи `sector_code`, `event_count`, `max_threat`, `max_organic_mass`. Самая большая масса первой.",
      hint: "Группы по сектору отфильтруй через HAVING COUNT(*) >= 2.",
      starterSql: "SELECT s.sector_code, COUNT(*) AS event_count, ...\nFROM biohazard_events AS be\nJOIN sectors AS s ON ...",
      sql: `SELECT s.sector_code,
  COUNT(*) AS event_count,
  MAX(be.threat_level) AS max_threat,
  MAX(be.organic_mass) AS max_organic_mass
FROM biohazard_events AS be
JOIN sectors AS s ON s.sector_id = be.sector_id
GROUP BY s.sector_id, s.sector_code
HAVING COUNT(*) >= 2
ORDER BY max_organic_mass DESC, s.sector_code`, orderMatters: true,
    }),
    task({
      id: "latest-pod-critical-count", number: 28, title: "Последний цикл капсул", difficulty: "medium",
      description: "Для каждого аппарата с диагностикой посчитай критические подсистемы только в последнем цикле. Верни `pod_code`, `last_checked_at`, `critical_count` по коду.",
      hint: "Сначала получи MAX(checked_at) по pod_id в CTE, затем присоедини строки того же времени.",
      starterSql: "WITH latest_cycles AS (\n  SELECT pod_id, MAX(checked_at) AS last_checked_at\n  FROM pod_diagnostics\n  GROUP BY pod_id\n)\nSELECT ...",
      sql: `WITH latest_cycles AS (
  SELECT pod_id, MAX(checked_at) AS last_checked_at
  FROM pod_diagnostics
  GROUP BY pod_id
)
SELECT ep.pod_code,
  lc.last_checked_at,
  COUNT(*) FILTER (WHERE pd.status = 'critical') AS critical_count
FROM latest_cycles AS lc
JOIN escape_pods AS ep ON ep.pod_id = lc.pod_id
JOIN pod_diagnostics AS pd
  ON pd.pod_id = lc.pod_id
 AND pd.checked_at = lc.last_checked_at
GROUP BY ep.pod_id, ep.pod_code, lc.last_checked_at
ORDER BY ep.pod_code`, orderMatters: true,
    }),
    task({
      id: "events-in-window", number: 29, title: "Аварийное окно", difficulty: "medium",
      description: "Найди системные события между `04:00` и `04:10` 14 сентября 2187 года включительно. Верни `event_type`, `severity`, `recorded_at` по времени.",
      hint: "Используй BETWEEN с двумя литералами TIMESTAMP.",
      starterSql: "SELECT event_type, severity, recorded_at\nFROM system_events",
      sql: `SELECT event_type, severity, recorded_at
FROM system_events
WHERE recorded_at BETWEEN TIMESTAMP '2187-09-14 04:00:00'
                      AND TIMESTAMP '2187-09-14 04:10:00'
ORDER BY recorded_at, event_id`, orderMatters: true,
    }),
    task({
      id: "priority-ai-targets", number: 30, title: "Цели команд ARGO", difficulty: "medium",
      description: "Покажи команды приоритета 5, направленные на известную систему. Верни `executed_at`, `command_type`, `system_name` по времени.",
      hint: "INNER JOIN автоматически исключит команды с NULL в target_system_id.",
      starterSql: "SELECT ac.executed_at, ac.command_type, ss.system_name\nFROM ai_commands AS ac\nJOIN ship_systems AS ss ON ...",
      sql: `SELECT ac.executed_at, ac.command_type, ss.system_name
FROM ai_commands AS ac
JOIN ship_systems AS ss ON ss.system_id = ac.target_system_id
WHERE ac.priority = 5
ORDER BY ac.executed_at, ac.command_id`, orderMatters: true,
    }),
    task({
      id: "sectors-without-systems", number: 31, title: "Пустые технические зоны", difficulty: "medium",
      description: "Найди сектора, в которых не зарегистрировано ни одной системы. Верни `sector_code`, `sector_name` по коду.",
      hint: "LEFT JOIN и проверка ss.system_id IS NULL сохранят пустые сектора.",
      starterSql: "SELECT s.sector_code, s.sector_name\nFROM sectors AS s\nLEFT JOIN ship_systems AS ss ON ...",
      sql: `SELECT s.sector_code, s.sector_name
FROM sectors AS s
LEFT JOIN ship_systems AS ss ON ss.sector_id = s.sector_id
WHERE ss.system_id IS NULL
ORDER BY s.sector_code`, orderMatters: true,
    }),
    task({
      id: "department-roster", number: 32, title: "Состав отделов", difficulty: "medium",
      description: "Для отделов минимум с двумя сотрудниками выведи `department`, `crew_count` и список имён `crew_names` по алфавиту. Сначала крупные отделы.",
      hint: "Используй COUNT, STRING_AGG с ORDER BY и HAVING.",
      starterSql: "SELECT department, COUNT(*) AS crew_count,\n  STRING_AGG(...) AS crew_names\nFROM crew_members",
      sql: `SELECT department,
  COUNT(*) AS crew_count,
  STRING_AGG(full_name, ', ' ORDER BY full_name) AS crew_names
FROM crew_members
GROUP BY department
HAVING COUNT(*) >= 2
ORDER BY crew_count DESC, department`, orderMatters: true,
    }),
    task({
      id: "sector-access-pivot", number: 33, title: "Итоги пропускного режима", difficulty: "medium",
      description: "Для каждого сектора с записями доступа посчитай разрешения и отказы. Верни `sector_code`, `granted_count`, `denied_count`; сначала больше отказов.",
      hint: "Применяй COUNT(*) FILTER для каждого access_result.",
      starterSql: "SELECT s.sector_code,\n  COUNT(*) FILTER (...) AS granted_count,\n  COUNT(*) FILTER (...) AS denied_count\nFROM access_logs AS al\nJOIN sectors AS s ON ...",
      sql: `SELECT s.sector_code,
  COUNT(*) FILTER (WHERE al.access_result = 'granted') AS granted_count,
  COUNT(*) FILTER (WHERE al.access_result = 'denied') AS denied_count
FROM access_logs AS al
JOIN sectors AS s ON s.sector_id = al.sector_id
GROUP BY s.sector_id, s.sector_code
ORDER BY denied_count DESC, s.sector_code`, orderMatters: true,
    }),
    task({
      id: "container-manifest-totals", number: 34, title: "Объём манифеста", difficulty: "medium",
      description: "Для каждого контейнера посчитай суммарное количество единиц груза `total_quantity` и число позиций `item_count`. Верни также `container_code`, самые наполненные первыми.",
      hint: "Соедини контейнеры с предметами, затем SUM(quantity) и COUNT(item_id).",
      starterSql: "SELECT cc.container_code, SUM(ci.quantity) AS total_quantity, ...\nFROM cargo_containers AS cc\nJOIN cargo_items AS ci ON ...",
      sql: `SELECT cc.container_code,
  SUM(ci.quantity) AS total_quantity,
  COUNT(ci.item_id) AS item_count
FROM cargo_containers AS cc
JOIN cargo_items AS ci ON ci.container_id = cc.container_id
GROUP BY cc.container_id, cc.container_code
ORDER BY total_quantity DESC, cc.container_code`, orderMatters: true,
    }),
    task({
      id: "last-event-per-system", number: 35, title: "Последнее событие системы", difficulty: "hard",
      description: "Найди последнее событие каждой системы. Верни `system_name`, `event_type`, `severity`, `recorded_at` по названию системы.",
      hint: "Пронумеруй события через ROW_NUMBER() OVER (PARTITION BY system_id ORDER BY recorded_at DESC).",
      starterSql: "WITH ranked_events AS (\n  SELECT ..., ROW_NUMBER() OVER (...) AS rn\n  FROM system_events\n)\nSELECT ...",
      sql: `WITH ranked_events AS (
  SELECT se.*,
    ROW_NUMBER() OVER (
      PARTITION BY se.system_id
      ORDER BY se.recorded_at DESC, se.event_id DESC
    ) AS rn
  FROM system_events AS se
)
SELECT ss.system_name, re.event_type, re.severity, re.recorded_at
FROM ranked_events AS re
JOIN ship_systems AS ss ON ss.system_id = re.system_id
WHERE re.rn = 1
ORDER BY ss.system_name`, orderMatters: true,
    }),
    task({
      id: "organic-mass-growth", number: 36, title: "Рост органической массы", difficulty: "hard",
      description: "Для событий `ZERO-01` покажи время, массу и изменение относительно предыдущего измерения. Колонки: `detected_at`, `organic_mass`, `mass_growth`; первая строка может содержать NULL.",
      hint: "Используй LAG(organic_mass) в окне по времени.",
      starterSql: "SELECT be.detected_at, be.organic_mass,\n  be.organic_mass - LAG(...) OVER (...) AS mass_growth\nFROM biohazard_events AS be\nJOIN sectors AS s ON ...",
      sql: `SELECT be.detected_at,
  be.organic_mass,
  be.organic_mass - LAG(be.organic_mass) OVER (
    ORDER BY be.detected_at, be.bio_event_id
  ) AS mass_growth
FROM biohazard_events AS be
JOIN sectors AS s ON s.sector_id = be.sector_id
WHERE s.sector_code = 'ZERO-01'
ORDER BY be.detected_at, be.bio_event_id`, orderMatters: true,
    }),
    task({
      id: "safe-route-zero-deck", number: 37, title: "Маршрут на нулевую палубу", difficulty: "hard",
      description: "Рекурсивно найди кратчайший безопасный маршрут из `HANGAR-01` в `ZERO-01`. Верни `route`, `steps`, `total_time`.",
      hint: "В рекурсивном CTE храни массив visited, массив кодов route и накопленное время; исключай циклы через <> ALL(visited).",
      starterSql: "WITH RECURSIVE routes AS (\n  SELECT ...\n  UNION ALL\n  SELECT ...\n)\nSELECT ...",
      sql: `WITH RECURSIVE routes AS (
  SELECT s.sector_id,
    ARRAY[s.sector_id] AS visited,
    ARRAY[s.sector_code]::text[] AS route_codes,
    0 AS steps,
    0 AS total_time
  FROM sectors AS s
  WHERE s.sector_code = 'HANGAR-01'

  UNION ALL

  SELECT next_sector.sector_id,
    r.visited || next_sector.sector_id,
    r.route_codes || next_sector.sector_code,
    r.steps + 1,
    r.total_time + sc.travel_time_sec
  FROM routes AS r
  JOIN sector_connections AS sc ON sc.from_sector_id = r.sector_id
  JOIN sectors AS next_sector ON next_sector.sector_id = sc.to_sector_id
  WHERE sc.door_status IN ('open', 'locked')
    AND sc.required_access_level <= 4
    AND sc.is_pressurized = TRUE
    AND (next_sector.is_accessible = TRUE OR next_sector.sector_code = 'ZERO-01')
    AND next_sector.sector_id <> ALL(r.visited)
    AND r.steps < 8
)
SELECT ARRAY_TO_STRING(route_codes, ' → ') AS route, steps, total_time
FROM routes
WHERE route_codes[array_length(route_codes, 1)] = 'ZERO-01'
ORDER BY steps, total_time
LIMIT 1`, orderMatters: true,
    }),
    task({
      id: "argo-bio-synchronization", number: 38, title: "Синхронизация ARGO", difficulty: "hard",
      description: "Объедини поминутную активность ядра и биодатчиков `ZERO-01`. Найди синхронное окно с максимальным числом команд, затем массой. Верни `event_minute`, `command_count`, `organic_mass`, `activity_type`.",
      hint: "Сделай два CTE с DATE_TRUNC, затем FULL OUTER JOIN и COALESCE времени.",
      starterSql: "WITH ai_activity AS (...),\nbio_activity AS (...)\nSELECT ...\nFROM ai_activity AS ai\nFULL OUTER JOIN bio_activity AS bio ON ...",
      sql: `WITH ai_activity AS (
  SELECT DATE_TRUNC('minute', ac.executed_at) AS event_minute,
    COUNT(*) AS command_count
  FROM ai_commands AS ac
  JOIN ship_systems AS ss ON ss.system_id = ac.target_system_id
  JOIN sectors AS s ON s.sector_id = ac.target_sector_id
  WHERE s.sector_code = 'ZERO-01' AND ss.system_type = 'ai_core'
  GROUP BY DATE_TRUNC('minute', ac.executed_at)
),
bio_activity AS (
  SELECT DATE_TRUNC('minute', be.detected_at) AS event_minute,
    MAX(be.organic_mass) AS organic_mass
  FROM biohazard_events AS be
  JOIN sectors AS s ON s.sector_id = be.sector_id
  WHERE s.sector_code = 'ZERO-01'
  GROUP BY DATE_TRUNC('minute', be.detected_at)
)
SELECT COALESCE(ai.event_minute, bio.event_minute) AS event_minute,
  COALESCE(ai.command_count, 0) AS command_count,
  COALESCE(bio.organic_mass, 0) AS organic_mass,
  CASE
    WHEN ai.event_minute IS NOT NULL AND bio.event_minute IS NOT NULL THEN 'synchronized'
    WHEN ai.event_minute IS NOT NULL THEN 'ai_only'
    ELSE 'biological_only'
  END AS activity_type
FROM ai_activity AS ai
FULL OUTER JOIN bio_activity AS bio ON bio.event_minute = ai.event_minute
ORDER BY
  (ai.event_minute IS NOT NULL AND bio.event_minute IS NOT NULL) DESC,
  COALESCE(ai.command_count, 0) DESC,
  COALESCE(bio.organic_mass, 0) DESC
LIMIT 1`, orderMatters: true,
    }),
    task({
      id: "viable-repair-module", number: 39, title: "Исправный модуль", difficulty: "hard",
      description: "Найди готовый ремонтный модуль с топливом ≥40, кислородом ≥45, корпусом ≥70, снятой блокировкой и без critical в последней диагностике. Верни `pod_code`, `fuel_percent`, `oxygen_minutes`, `hull_integrity`.",
      hint: "Используй коррелированный MAX(checked_at) внутри NOT EXISTS.",
      starterSql: "SELECT ep.pod_code, ...\nFROM escape_pods AS ep\nWHERE ...\n  AND NOT EXISTS (...) ",
      sql: `SELECT ep.pod_code, ep.fuel_percent, ep.oxygen_minutes, ep.hull_integrity
FROM escape_pods AS ep
WHERE ep.pod_type = 'repair_module'
  AND ep.status = 'ready'
  AND ep.fuel_percent >= 40
  AND ep.oxygen_minutes >= 45
  AND ep.hull_integrity >= 70
  AND ep.launch_lock = FALSE
  AND NOT EXISTS (
    SELECT 1
    FROM pod_diagnostics AS pd
    WHERE pd.pod_id = ep.pod_id
      AND pd.checked_at = (
        SELECT MAX(pd2.checked_at)
        FROM pod_diagnostics AS pd2
        WHERE pd2.pod_id = ep.pod_id
      )
      AND pd.status = 'critical'
  )
ORDER BY ep.hull_integrity DESC, ep.pod_code
LIMIT 1`, orderMatters: true,
    }),
    task({
      id: "destruction-protocol", number: 40, title: "Полнота протокола", difficulty: "hard",
      description: "Проверь наличие четырёх финальных событий после `05:20`. Верни `protocol_complete`, `completed_steps`, `completed_sequence`, `final_step_at`.",
      hint: "Создай обязательные шаги через VALUES, сохрани их LEFT JOIN и агрегируй BOOL_AND, COUNT, STRING_AGG и MAX.",
      starterSql: "WITH required_steps(step_order, event_type) AS (VALUES ...),\nprotocol AS (...)\nSELECT ...",
      sql: `WITH required_steps(step_order, event_type) AS (
  VALUES
    (1, 'INFECTED_SECTORS_ISOLATED'),
    (2, 'REACTOR_SAFETY_DISABLED'),
    (3, 'REACTOR_OVERLOAD_STARTED'),
    (4, 'REPAIR_MODULE_LAUNCHED')
),
protocol AS (
  SELECT r.step_order, r.event_type, MIN(se.recorded_at) AS completed_at
  FROM required_steps AS r
  LEFT JOIN system_events AS se
    ON se.event_type = r.event_type
   AND se.recorded_at >= TIMESTAMP '2187-09-14 05:20:00'
  GROUP BY r.step_order, r.event_type
)
SELECT BOOL_AND(completed_at IS NOT NULL) AS protocol_complete,
  COUNT(completed_at) AS completed_steps,
  STRING_AGG(event_type, ' → ' ORDER BY step_order)
    FILTER (WHERE completed_at IS NOT NULL) AS completed_sequence,
  MAX(completed_at) AS final_step_at
FROM protocol`,
    }),
    task({
      id: "three-source-survivor", number: 41, title: "Три подтверждения личности", difficulty: "hard",
      description: "Найди сотрудников, чьи ID после `04:10` встречаются одновременно в медицинских сканах, успешных проходах и неповреждённых сообщениях. Верни `full_name`, `role` по имени.",
      hint: "Пересеки три набора crew_id оператором INTERSECT.",
      starterSql: "WITH confirmed AS (\n  SELECT crew_id FROM medical_scans ...\n  INTERSECT\n  SELECT ...\n  INTERSECT\n  SELECT ...\n)\nSELECT ...",
      sql: `WITH confirmed AS (
  SELECT crew_id
  FROM medical_scans
  WHERE scanned_at >= TIMESTAMP '2187-09-14 04:10:00'

  INTERSECT

  SELECT cm.crew_id
  FROM access_logs AS al
  JOIN crew_members AS cm ON cm.badge_id = al.badge_id
  WHERE al.access_result = 'granted'
    AND al.access_time >= TIMESTAMP '2187-09-14 04:10:00'

  INTERSECT

  SELECT sender_crew_id
  FROM communications
  WHERE sender_crew_id IS NOT NULL
    AND is_corrupted = FALSE
    AND sent_at >= TIMESTAMP '2187-09-14 04:10:00'
)
SELECT cm.full_name, cm.role
FROM confirmed AS c
JOIN crew_members AS cm ON cm.crew_id = c.crew_id
ORDER BY cm.full_name`, orderMatters: true,
    }),
    task({
      id: "excluded-hangar-crew", number: 42, title: "Исключённые из запуска", difficulty: "hard",
      description: "Найди вошедших в `HANGAR-01` после `04:35`, которым не выдали `launch_authorization`. Верни `full_name`, `role` по имени.",
      hint: "Сформируй два набора crew_id и вычти второй из первого через EXCEPT.",
      starterSql: "WITH hangar_crew AS (...), authorized_crew AS (...),\nexcluded AS (SELECT ... EXCEPT SELECT ...)\nSELECT ...",
      sql: `WITH hangar_crew AS (
  SELECT cm.crew_id
  FROM access_logs AS al
  JOIN crew_members AS cm ON cm.badge_id = al.badge_id
  JOIN sectors AS s ON s.sector_id = al.sector_id
  WHERE s.sector_code = 'HANGAR-01'
    AND al.access_result = 'granted'
    AND al.entry_type = 'entry'
    AND al.access_time >= TIMESTAMP '2187-09-14 04:35:00'
),
authorized_crew AS (
  SELECT cm.crew_id
  FROM access_logs AS al
  JOIN crew_members AS cm ON cm.badge_id = al.badge_id
  WHERE al.device_id = 'SHUTTLE-01-CONTROL'
    AND al.entry_type = 'launch_authorization'
    AND al.access_result = 'granted'
),
excluded AS (
  SELECT crew_id FROM hangar_crew
  EXCEPT
  SELECT crew_id FROM authorized_crew
)
SELECT cm.full_name, cm.role
FROM excluded AS e
JOIN crew_members AS cm ON cm.crew_id = e.crew_id
ORDER BY cm.full_name`, orderMatters: true,
    }),
    task({
      id: "captain-order-reaction", number: 43, title: "Реакция на приказ капитана", difficulty: "hard",
      description: "Для сообщения капитана об уничтожении корабля найди первую команду ARGO в течение следующей минуты. Верни `message_text`, `sent_at`, `command_type`, `executed_at`.",
      hint: "JOIN LATERAL может использовать sent_at текущего сообщения и выбрать ORDER BY ... LIMIT 1.",
      starterSql: "SELECT ...\nFROM communications AS c\nJOIN LATERAL (\n  SELECT ...\n  FROM ai_commands\n  WHERE executed_at > c.sent_at ...\n  LIMIT 1\n) AS next_command ON TRUE",
      sql: `SELECT c.message_text, c.sent_at,
  next_command.command_type, next_command.executed_at
FROM communications AS c
JOIN LATERAL (
  SELECT ac.command_type, ac.executed_at
  FROM ai_commands AS ac
  WHERE ac.executed_at > c.sent_at
    AND ac.executed_at <= c.sent_at + INTERVAL '1 minute'
  ORDER BY ac.executed_at, ac.command_id
  LIMIT 1
) AS next_command ON TRUE
WHERE c.message_text ILIKE '%уничтожения корабля%'
ORDER BY c.sent_at
LIMIT 1`, orderMatters: true,
    }),
    task({
      id: "voice-profile-next-command", number: 44, title: "Команда после загрузки голоса", difficulty: "hard",
      description: "В последовательности каждой целевой системы найди команду сразу после `VOICE_PROFILE_LOAD`. Верни `system_name`, `command_type`, `next_command_type`.",
      hint: "В CTE используй LEAD(command_type) OVER (PARTITION BY target_system_id ORDER BY executed_at).",
      starterSql: "WITH command_sequence AS (\n  SELECT ..., LEAD(...) OVER (...) AS next_command_type\n  FROM ai_commands\n)\nSELECT ...",
      sql: `WITH command_sequence AS (
  SELECT ac.target_system_id,
    ac.command_type,
    LEAD(ac.command_type) OVER (
      PARTITION BY ac.target_system_id
      ORDER BY ac.executed_at, ac.command_id
    ) AS next_command_type
  FROM ai_commands AS ac
)
SELECT ss.system_name, cs.command_type, cs.next_command_type
FROM command_sequence AS cs
JOIN ship_systems AS ss ON ss.system_id = cs.target_system_id
WHERE cs.command_type = 'VOICE_PROFILE_LOAD'`,
    }),
    task({
      id: "largest-anomaly-jump", number: 45, title: "Резкий скачок аномалии", difficulty: "hard",
      description: "Найди самое большое увеличение tissue_anomaly между соседними сканами одного сотрудника. Верни `full_name`, `scanned_at`, `previous_anomaly`, `tissue_anomaly`, `anomaly_growth`.",
      hint: "Вычисли LAG(tissue_anomaly) по crew_id, затем отсортируй разницу DESC.",
      starterSql: "WITH scan_changes AS (\n  SELECT ..., LAG(tissue_anomaly) OVER (...) AS previous_anomaly\n  FROM medical_scans\n)\nSELECT ...",
      sql: `WITH scan_changes AS (
  SELECT ms.*,
    LAG(ms.tissue_anomaly) OVER (
      PARTITION BY ms.crew_id
      ORDER BY ms.scanned_at, ms.scan_id
    ) AS previous_anomaly
  FROM medical_scans AS ms
)
SELECT cm.full_name, sc.scanned_at, sc.previous_anomaly,
  sc.tissue_anomaly,
  sc.tissue_anomaly - sc.previous_anomaly AS anomaly_growth
FROM scan_changes AS sc
JOIN crew_members AS cm ON cm.crew_id = sc.crew_id
WHERE sc.previous_anomaly IS NOT NULL
ORDER BY anomaly_growth DESC, sc.scanned_at
LIMIT 1`, orderMatters: true,
    }),
    task({
      id: "material-infection-spread", number: 46, title: "Материал и заражение", difficulty: "hard",
      description: "Найди материалы, после применения которых в том же секторе не позднее 15 минут возникало биособытие. Оставь применённые минимум двумя дронами. Верни `material_code`, `drone_count`, `sector_count`, `sector_codes`.",
      hint: "Соедини completed_at с диапазоном detected_at, затем COUNT(DISTINCT), STRING_AGG и HAVING.",
      starterSql: "SELECT dt.material_code, COUNT(DISTINCT ...) ...\nFROM drone_tasks AS dt\nJOIN biohazard_events AS be ON ...\nJOIN sectors AS s ON ...",
      sql: `SELECT dt.material_code,
  COUNT(DISTINCT dt.drone_id) AS drone_count,
  COUNT(DISTINCT dt.sector_id) AS sector_count,
  STRING_AGG(DISTINCT s.sector_code, ', ' ORDER BY s.sector_code) AS sector_codes
FROM drone_tasks AS dt
JOIN biohazard_events AS be
  ON be.sector_id = dt.sector_id
 AND be.detected_at BETWEEN dt.completed_at
                        AND dt.completed_at + INTERVAL '15 minutes'
JOIN sectors AS s ON s.sector_id = dt.sector_id
WHERE dt.material_code IS NOT NULL
  AND dt.completed_at IS NOT NULL
GROUP BY dt.material_code
HAVING COUNT(DISTINCT dt.drone_id) >= 2
ORDER BY drone_count DESC, dt.material_code`, orderMatters: true,
    }),
    task({
      id: "latest-pod-diagnostic-pivot", number: 47, title: "Диагностика в одну строку", difficulty: "hard",
      description: "Разверни последний цикл каждого аппарата в колонки `engine_status`, `oxygen_status`, `hull_status`, `release_status`. Верни также `pod_code` по коду.",
      hint: "Сначала выдели последнее время, затем MAX(status) FILTER по названиям подсистем, учитывая оба названия двигателя и запуска.",
      starterSql: "WITH latest_cycles AS (...)\nSELECT ep.pod_code,\n  MAX(pd.status) FILTER (...) AS engine_status, ...",
      sql: `WITH latest_cycles AS (
  SELECT pod_id, MAX(checked_at) AS checked_at
  FROM pod_diagnostics
  GROUP BY pod_id
)
SELECT ep.pod_code,
  MAX(pd.status) FILTER (
    WHERE pd.subsystem_name IN ('engine', 'maneuver_engine')
  ) AS engine_status,
  MAX(pd.status) FILTER (WHERE pd.subsystem_name = 'oxygen') AS oxygen_status,
  MAX(pd.status) FILTER (WHERE pd.subsystem_name = 'hull') AS hull_status,
  MAX(pd.status) FILTER (
    WHERE pd.subsystem_name IN ('launch_control', 'release_control')
  ) AS release_status
FROM latest_cycles AS lc
JOIN escape_pods AS ep ON ep.pod_id = lc.pod_id
JOIN pod_diagnostics AS pd
  ON pd.pod_id = lc.pod_id AND pd.checked_at = lc.checked_at
GROUP BY ep.pod_id, ep.pod_code
ORDER BY ep.pod_code`, orderMatters: true,
    }),
    task({
      id: "priority-command-running-total", number: 48, title: "Накопление команд", difficulty: "hard",
      description: "Для команд приоритета 5 выведи `executed_at`, `command_type` и накопительное число команд `running_command_count` по времени.",
      hint: "COUNT(*) OVER (ORDER BY ...) создаст нарастающий итог.",
      starterSql: "SELECT executed_at, command_type,\n  COUNT(*) OVER (...) AS running_command_count\nFROM ai_commands",
      sql: `SELECT executed_at, command_type,
  COUNT(*) OVER (
    ORDER BY executed_at, command_id
    ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW
  ) AS running_command_count
FROM ai_commands
WHERE priority = 5
ORDER BY executed_at, command_id`, orderMatters: true,
    }),
    task({
      id: "infection-ranking", number: 49, title: "Рейтинг заражённых секторов", difficulty: "hard",
      description: "Ранжируй сектора с биособытиями по максимальной органической массе. Верни `sector_code`, `max_organic_mass`, `infection_rank`; одинаковые значения должны иметь один ранг.",
      hint: "Сначала агрегируй массу в CTE, затем DENSE_RANK() OVER (ORDER BY ... DESC).",
      starterSql: "WITH sector_bio AS (...)\nSELECT ..., DENSE_RANK() OVER (...) AS infection_rank",
      sql: `WITH sector_bio AS (
  SELECT s.sector_code, MAX(be.organic_mass) AS max_organic_mass
  FROM biohazard_events AS be
  JOIN sectors AS s ON s.sector_id = be.sector_id
  GROUP BY s.sector_id, s.sector_code
)
SELECT sector_code, max_organic_mass,
  DENSE_RANK() OVER (ORDER BY max_organic_mass DESC) AS infection_rank
FROM sector_bio
ORDER BY infection_rank, sector_code`, orderMatters: true,
    }),
    task({
      id: "sector-risk-score", number: 50, title: "Сводный риск секторов", difficulty: "hard",
      description: "Для каждого сектора рассчитай риск: 3 балла за критическое системное событие, 2 за максимальный уровень биоугрозы и 1 за отключённую систему. Верни 10 лидеров: `sector_code`, `critical_events`, `max_threat`, `offline_systems`, `risk_score`.",
      hint: "Предварительно агрегируй три источника в отдельных CTE, присоедини их к sectors и используй COALESCE.",
      starterSql: "WITH event_stats AS (...), bio_stats AS (...), system_stats AS (...)\nSELECT ...",
      sql: `WITH event_stats AS (
  SELECT sector_id,
    COUNT(*) FILTER (WHERE severity = 5) AS critical_events
  FROM system_events
  GROUP BY sector_id
),
bio_stats AS (
  SELECT sector_id, MAX(threat_level) AS max_threat
  FROM biohazard_events
  GROUP BY sector_id
),
system_stats AS (
  SELECT sector_id,
    COUNT(*) FILTER (WHERE status = 'offline') AS offline_systems
  FROM ship_systems
  GROUP BY sector_id
),
scores AS (
  SELECT s.sector_code,
    COALESCE(es.critical_events, 0) AS critical_events,
    COALESCE(bs.max_threat, 0) AS max_threat,
    COALESCE(ss.offline_systems, 0) AS offline_systems
  FROM sectors AS s
  LEFT JOIN event_stats AS es ON es.sector_id = s.sector_id
  LEFT JOIN bio_stats AS bs ON bs.sector_id = s.sector_id
  LEFT JOIN system_stats AS ss ON ss.sector_id = s.sector_id
)
SELECT sector_code, critical_events, max_threat, offline_systems,
  critical_events * 3 + max_threat * 2 + offline_systems AS risk_score
FROM scores
ORDER BY risk_score DESC, sector_code
LIMIT 10`, orderMatters: true,
    }),
  ],
};
