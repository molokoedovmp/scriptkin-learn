-- =============================================================
-- «Прометей» — пустая схема мира квеста в базе-песочнице.
-- Здесь создаются только таблицы, связи, ограничения и индексы.
-- Игровых записей в этой миграции нет.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS prometheus;
SET search_path TO prometheus;

CREATE TABLE IF NOT EXISTS sectors (
  sector_id           integer PRIMARY KEY,
  sector_code         varchar(32) NOT NULL UNIQUE,
  sector_name         varchar(120) NOT NULL,
  deck_number         integer NOT NULL,
  sector_type         varchar(40) NOT NULL,
  pressure_kpa        numeric(7,2) NOT NULL CHECK (pressure_kpa >= 0),
  temperature_c       numeric(6,2) NOT NULL,
  power_status        varchar(16) NOT NULL
                      CHECK (power_status IN ('online', 'offline', 'emergency')),
  contamination_level numeric(5,2) NOT NULL DEFAULT 0
                      CHECK (contamination_level BETWEEN 0 AND 100),
  is_accessible       boolean NOT NULL DEFAULT true
);

CREATE TABLE IF NOT EXISTS sector_connections (
  connection_id        integer PRIMARY KEY,
  from_sector_id       integer NOT NULL REFERENCES sectors(sector_id),
  to_sector_id         integer NOT NULL REFERENCES sectors(sector_id),
  door_status          varchar(16) NOT NULL
                       CHECK (door_status IN ('open', 'locked', 'sealed', 'damaged')),
  required_access_level integer NOT NULL DEFAULT 0
                       CHECK (required_access_level >= 0),
  travel_time_sec      integer NOT NULL CHECK (travel_time_sec > 0),
  is_pressurized       boolean NOT NULL DEFAULT true,
  UNIQUE (from_sector_id, to_sector_id),
  CHECK (from_sector_id <> to_sector_id)
);

CREATE TABLE IF NOT EXISTS ship_systems (
  system_id       integer PRIMARY KEY,
  system_name     varchar(120) NOT NULL,
  system_type     varchar(40) NOT NULL,
  sector_id       integer NOT NULL REFERENCES sectors(sector_id),
  status          varchar(16) NOT NULL
                  CHECK (status IN ('operational', 'damaged', 'offline')),
  power_required  numeric(10,2) NOT NULL CHECK (power_required >= 0),
  priority_level  integer NOT NULL CHECK (priority_level >= 0),
  last_service_at timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS system_events (
  event_id      integer PRIMARY KEY,
  system_id     integer NOT NULL REFERENCES ship_systems(system_id),
  sector_id     integer NOT NULL REFERENCES sectors(sector_id),
  event_type    varchar(40) NOT NULL,
  severity      integer NOT NULL CHECK (severity >= 0),
  event_value   numeric(14,4),
  event_message text NOT NULL,
  recorded_at   timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS crew_members (
  crew_id         integer PRIMARY KEY,
  full_name       varchar(120) NOT NULL,
  role            varchar(80) NOT NULL,
  department      varchar(80) NOT NULL,
  badge_id        varchar(40) NOT NULL UNIQUE,
  access_level    integer NOT NULL CHECK (access_level >= 0),
  official_status varchar(16) NOT NULL
                  CHECK (official_status IN ('alive', 'missing', 'deceased')),
  cabin_sector_id integer REFERENCES sectors(sector_id)
);

CREATE TABLE IF NOT EXISTS crew_shifts (
  shift_id    integer PRIMARY KEY,
  crew_id     integer NOT NULL REFERENCES crew_members(crew_id),
  sector_id   integer NOT NULL REFERENCES sectors(sector_id),
  shift_start timestamp NOT NULL,
  shift_end   timestamp NOT NULL,
  shift_role  varchar(80) NOT NULL,
  CHECK (shift_end > shift_start)
);

CREATE TABLE IF NOT EXISTS access_logs (
  access_id    integer PRIMARY KEY,
  badge_id     varchar(40) NOT NULL,
  sector_id    integer NOT NULL REFERENCES sectors(sector_id),
  access_time  timestamp NOT NULL,
  access_result varchar(16) NOT NULL
                CHECK (access_result IN ('granted', 'denied')),
  entry_type   varchar(24) NOT NULL
               CHECK (entry_type IN (
                 'entry', 'exit', 'seal_open', 'container_unlock',
                 'container_access', 'maintenance_access', 'launch_access',
                 'launch_authorization', 'hangar_lockdown', 'cargo_access',
                 'door_override'
               )),
  device_id    varchar(40) NOT NULL
);

-- Журнал должен сохранять неизвестные пропуска и технические типы доступа.
ALTER TABLE access_logs
  DROP CONSTRAINT IF EXISTS access_logs_badge_id_fkey;
ALTER TABLE access_logs
  DROP CONSTRAINT IF EXISTS access_logs_entry_type_check;
ALTER TABLE access_logs
  ALTER COLUMN entry_type TYPE varchar(24);
ALTER TABLE access_logs
  ADD CONSTRAINT access_logs_entry_type_check
  CHECK (entry_type IN (
    'entry', 'exit', 'seal_open', 'container_unlock',
    'container_access', 'maintenance_access', 'launch_access',
    'launch_authorization', 'hangar_lockdown', 'cargo_access',
    'door_override'
  ));

CREATE TABLE IF NOT EXISTS communications (
  message_id       integer PRIMARY KEY,
  sender_crew_id   integer REFERENCES crew_members(crew_id),
  sender_type      varchar(16) NOT NULL
                   CHECK (sender_type IN ('crew', 'ai', 'automatic')),
  channel          varchar(40) NOT NULL,
  message_type     varchar(16) NOT NULL
                   CHECK (message_type IN ('text', 'audio', 'alarm', 'alert', 'data')),
  message_text     text NOT NULL,
  sent_at          timestamp NOT NULL,
  voice_signature  varchar(80),
  is_corrupted     boolean NOT NULL DEFAULT false,
  CHECK (sender_type <> 'crew' OR sender_crew_id IS NOT NULL)
);

-- Старые локальные базы могли быть созданы до появления типа alert.
ALTER TABLE communications
  DROP CONSTRAINT IF EXISTS communications_message_type_check;
ALTER TABLE communications
  ADD CONSTRAINT communications_message_type_check
  CHECK (message_type IN ('text', 'audio', 'alarm', 'alert', 'data'));

CREATE TABLE IF NOT EXISTS medical_scans (
  scan_id            integer PRIMARY KEY,
  crew_id            integer NOT NULL REFERENCES crew_members(crew_id),
  sector_id          integer NOT NULL REFERENCES sectors(sector_id),
  heart_rate         integer CHECK (heart_rate >= 0),
  oxygen_level       numeric(5,2) CHECK (oxygen_level BETWEEN 0 AND 100),
  body_temperature   numeric(5,2),
  tissue_anomaly     numeric(5,2) NOT NULL DEFAULT 0
                     CHECK (tissue_anomaly BETWEEN 0 AND 100),
  medical_status     varchar(24) NOT NULL,
  scanned_at         timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS cargo_containers (
  container_id       integer PRIMARY KEY,
  container_code     varchar(40) NOT NULL UNIQUE,
  declared_category  varchar(80) NOT NULL,
  sector_id          integer NOT NULL REFERENCES sectors(sector_id),
  seal_status        varchar(24) NOT NULL,
  loaded_at          timestamp NOT NULL,
  opened_at          timestamp,
  opened_by_badge    varchar(40),
  corporate_clearance integer NOT NULL CHECK (corporate_clearance >= 0),
  CHECK (opened_at IS NULL OR opened_at >= loaded_at)
);

CREATE TABLE IF NOT EXISTS cargo_items (
  item_id             integer PRIMARY KEY,
  container_id        integer NOT NULL REFERENCES cargo_containers(container_id),
  item_code            varchar(40) NOT NULL,
  item_name            varchar(120) NOT NULL,
  item_category        varchar(80) NOT NULL,
  quantity             integer NOT NULL CHECK (quantity > 0),
  hazard_class         varchar(40),
  is_declared          boolean NOT NULL DEFAULT true,
  storage_temperature  numeric(6,2),
  UNIQUE (container_id, item_code)
);

CREATE TABLE IF NOT EXISTS maintenance_drones (
  drone_id          integer PRIMARY KEY,
  drone_code        varchar(40) NOT NULL UNIQUE,
  drone_type        varchar(24) NOT NULL
                    CHECK (drone_type IN ('repair', 'medical', 'cargo')),
  current_sector_id integer NOT NULL REFERENCES sectors(sector_id),
  status            varchar(24) NOT NULL,
  controlled_by     varchar(80) NOT NULL,
  last_contact_at   timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS drone_tasks (
  task_id       integer PRIMARY KEY,
  drone_id      integer NOT NULL REFERENCES maintenance_drones(drone_id),
  sector_id     integer NOT NULL REFERENCES sectors(sector_id),
  task_type     varchar(40) NOT NULL,
  material_code varchar(40),
  ordered_by    varchar(80) NOT NULL,
  task_status   varchar(24) NOT NULL,
  started_at    timestamp NOT NULL,
  completed_at  timestamp,
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE TABLE IF NOT EXISTS biohazard_events (
  bio_event_id  integer PRIMARY KEY,
  sector_id     integer NOT NULL REFERENCES sectors(sector_id),
  threat_level  integer NOT NULL CHECK (threat_level >= 0),
  movement_count integer NOT NULL CHECK (movement_count >= 0),
  organic_mass  numeric(14,3) NOT NULL CHECK (organic_mass >= 0),
  sensor_status varchar(24) NOT NULL,
  detected_at   timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS ai_commands (
  command_id       integer PRIMARY KEY,
  command_type     varchar(40) NOT NULL,
  target_system_id integer REFERENCES ship_systems(system_id),
  target_sector_id integer REFERENCES sectors(sector_id),
  command_text     text NOT NULL,
  priority         integer NOT NULL CHECK (priority >= 0),
  source_directive varchar(120) NOT NULL,
  executed_at      timestamp NOT NULL,
  was_overridden   boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS escape_pods (
  pod_id          integer PRIMARY KEY,
  pod_code        varchar(40) NOT NULL UNIQUE,
  pod_type        varchar(24) NOT NULL
                  CHECK (pod_type IN (
                    'pod', 'escape_pod', 'shuttle', 'emergency_shuttle',
                    'repair_module'
                  )),
  sector_id       integer NOT NULL REFERENCES sectors(sector_id),
  status          varchar(16) NOT NULL
                  CHECK (status IN ('ready', 'damaged', 'launched')),
  fuel_percent    numeric(5,2) NOT NULL CHECK (fuel_percent BETWEEN 0 AND 100),
  oxygen_minutes  integer NOT NULL CHECK (oxygen_minutes >= 0),
  hull_integrity  numeric(5,2) NOT NULL CHECK (hull_integrity BETWEEN 0 AND 100),
  launch_lock     boolean NOT NULL DEFAULT false,
  capacity        integer NOT NULL CHECK (capacity > 0)
);

-- Старые локальные базы могли быть созданы до появления типа escape_pod.
ALTER TABLE escape_pods
  DROP CONSTRAINT IF EXISTS escape_pods_pod_type_check;
ALTER TABLE escape_pods
  ADD CONSTRAINT escape_pods_pod_type_check
  CHECK (pod_type IN (
    'pod', 'escape_pod', 'shuttle', 'emergency_shuttle', 'repair_module'
  ));

CREATE TABLE IF NOT EXISTS pod_diagnostics (
  diagnostic_id integer PRIMARY KEY,
  pod_id        integer NOT NULL REFERENCES escape_pods(pod_id),
  subsystem_name varchar(80) NOT NULL,
  status        varchar(16) NOT NULL
                CHECK (status IN ('ok', 'warning', 'critical')),
  measured_value numeric(14,4),
  checked_at    timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS sector_connections_from_idx
  ON sector_connections(from_sector_id);
CREATE INDEX IF NOT EXISTS sector_connections_to_idx
  ON sector_connections(to_sector_id);
CREATE INDEX IF NOT EXISTS ship_systems_sector_idx
  ON ship_systems(sector_id);
CREATE INDEX IF NOT EXISTS system_events_timeline_idx
  ON system_events(recorded_at, system_id);
CREATE INDEX IF NOT EXISTS crew_shifts_crew_time_idx
  ON crew_shifts(crew_id, shift_start, shift_end);
CREATE INDEX IF NOT EXISTS access_logs_badge_time_idx
  ON access_logs(badge_id, access_time);
CREATE INDEX IF NOT EXISTS access_logs_sector_time_idx
  ON access_logs(sector_id, access_time);
CREATE INDEX IF NOT EXISTS communications_sent_at_idx
  ON communications(sent_at);
CREATE INDEX IF NOT EXISTS medical_scans_crew_time_idx
  ON medical_scans(crew_id, scanned_at);
CREATE INDEX IF NOT EXISTS cargo_containers_sector_idx
  ON cargo_containers(sector_id);
CREATE INDEX IF NOT EXISTS cargo_items_container_idx
  ON cargo_items(container_id);
CREATE INDEX IF NOT EXISTS maintenance_drones_sector_idx
  ON maintenance_drones(current_sector_id);
CREATE INDEX IF NOT EXISTS drone_tasks_drone_time_idx
  ON drone_tasks(drone_id, started_at);
CREATE INDEX IF NOT EXISTS biohazard_events_sector_time_idx
  ON biohazard_events(sector_id, detected_at);
CREATE INDEX IF NOT EXISTS ai_commands_executed_at_idx
  ON ai_commands(executed_at);
CREATE INDEX IF NOT EXISTS escape_pods_sector_idx
  ON escape_pods(sector_id);
CREATE INDEX IF NOT EXISTS pod_diagnostics_pod_time_idx
  ON pod_diagnostics(pod_id, checked_at);

-- Данные, необходимые только для этапа 1.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (1, 'DOCK-A', 'Стыковочный узел A', 1, 'docking', 98.4, 17.8, 'emergency', 0, true),
  (2, 'DOCK-B', 'Грузовой стыковочный шлюз', 1, 'docking', 0.0, -12.6, 'offline', 0, false),
  (3, 'COM-01', 'Центр внешней связи', 2, 'technical', 96.7, 19.2, 'emergency', 0, false),
  (4, 'ENG-01', 'Инженерный отсек', 3, 'technical', 97.9, 22.4, 'online', 2, true),
  (5, 'HAB-01', 'Жилой сектор экипажа', 4, 'residential', 99.1, 21.0, 'offline', 8, false),
  (6, 'MED-01', 'Медицинский отсек', 4, 'medical', 101.3, 18.5, 'emergency', 14, false),
  (7, 'CARGO-01', 'Основной грузовой отсек', 2, 'cargo', 95.2, 8.1, 'online', 3, true),
  (8, 'BRIDGE', 'Командный центр', 5, 'command', 100.5, 20.3, 'offline', 0, false),
  (9, 'REACTOR', 'Реакторный отсек', 0, 'technical', 103.8, 31.6, 'online', 1, false),
  (10, 'SEC-01', 'Пост внутренней безопасности', 3, 'security', 98.8, 19.4, 'emergency', 5, false)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (101, 'Система фиксации челнока', 'docking_control', 1, 'damaged', 18.5, 5, '2187-08-29 11:20:00'),
  (102, 'Контроллер внутреннего шлюза', 'airlock_control', 1, 'offline', 12.0, 5, '2187-09-02 08:15:00'),
  (103, 'Регулятор давления DOCK-A', 'pressure_control', 1, 'operational', 9.4, 5, '2187-09-01 16:40:00'),
  (104, 'Камера стыковочного тоннеля', 'surveillance', 1, 'damaged', 3.2, 2, '2187-07-18 09:05:00'),
  (105, 'Внешний аварийный маяк', 'communication', 3, 'operational', 6.8, 5, '2187-08-11 14:30:00'),
  (106, 'Главный передатчик', 'communication', 3, 'offline', 24.0, 4, '2187-08-27 10:10:00'),
  (107, 'Распределитель локального питания', 'power_distribution', 4, 'damaged', 42.0, 5, '2187-09-08 13:25:00'),
  (108, 'Навигационное ядро', 'navigation', 8, 'offline', 65.0, 5, '2187-08-30 18:45:00'),
  (109, 'Система внутреннего оповещения', 'communication', 10, 'damaged', 8.5, 3, '2187-06-22 07:50:00'),
  (110, 'Монитор реакторного контура', 'reactor_control', 9, 'operational', 16.0, 5, '2187-09-10 21:35:00'),
  (111, 'Система наведения грузового шлюза', 'docking_control', 2, 'offline', 17.5, 4, '2187-08-16 12:00:00'),
  (112, 'Аварийное освещение DOCK-A', 'lighting', 1, 'operational', 4.5, 4, '2187-09-05 06:30:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id,
  system_id,
  sector_id,
  event_type,
  severity,
  event_value,
  event_message,
  recorded_at
) VALUES
  (1001, 110, 9, 'SENSOR_READING', 1, 87.2, 'Температура реакторного контура находится в допустимом диапазоне', '2187-09-14 02:41:12'),
  (1002, 107, 4, 'POWER_FLUCTUATION', 3, 41.7, 'Обнаружено нестабильное напряжение в инженерной сети', '2187-09-14 02:44:36'),
  (1003, 106, 3, 'CONNECTION_LOST', 4, 0, 'Потеряно соединение главного передатчика с внешней антенной', '2187-09-14 02:47:18'),
  (1004, 102, 1, 'DIAGNOSTIC', 2, 63.0, 'Внутренний шлюз завершил автоматическую проверку', '2187-09-14 02:52:09'),
  (1005, 105, 3, 'DISTRESS_SIGNAL', 4, 1, 'Автоматический сигнал бедствия передан на аварийной частоте', '2187-09-14 03:01:00'),
  (1006, 109, 10, 'AUDIO_FAILURE', 3, 18.4, 'Зафиксированы искажения внутреннего голосового канала', '2187-09-14 03:03:27'),
  (1007, 101, 1, 'DOCKING_REQUEST', 2, 1, 'Получен запрос на стыковку от инженерного челнока AV-12', '2187-09-14 03:11:45'),
  (1008, 103, 1, 'PRESSURE_EQUALIZATION', 2, 98.4, 'Давление в стыковочном тоннеле выровнено', '2187-09-14 03:14:22'),
  (1009, 104, 1, 'VIDEO_SIGNAL_LOST', 3, 0, 'Потерян видеосигнал камеры стыковочного тоннеля', '2187-09-14 03:15:04'),
  (1010, 101, 1, 'DOCKING_COMPLETE', 1, 100, 'Механическая стыковка челнока AV-12 завершена', '2187-09-14 03:16:31'),
  (1011, 102, 1, 'DOOR_OPEN_REQUEST', 3, 1, 'Получен запрос на открытие внутренней двери шлюза', '2187-09-14 03:17:08'),
  (1012, 102, 1, 'DOOR_CONTROL_ERROR', 4, 0, 'Открытие внутренней двери отклонено управляющей системой', '2187-09-14 03:17:11'),
  (1013, 101, 1, 'SHUTTLE_CONTROL_OVERRIDE', 4, 1, 'Управление двигателями внешнего аппарата передано корабельной системе', '2187-09-14 03:17:53'),
  (1014, 101, 1, 'AUTOMATIC_LOCK', 5, 1, 'Активирована автоматическая блокировка внешнего аппарата. Ручное отсоединение запрещено', '2187-09-14 03:18:42'),
  (1015, 103, 1, 'PRESSURE_STABLE', 1, 98.4, 'Давление в стыковочном тоннеле стабильно', '2187-09-14 03:19:05'),
  (1016, 112, 1, 'EMERGENCY_LIGHTING_ON', 2, 1, 'Активировано аварийное освещение стыковочного сектора', '2187-09-14 03:19:14'),
  (1017, 111, 2, 'GUIDANCE_FAILURE', 4, 0, 'Система наведения грузового шлюза не отвечает', '2187-09-14 03:20:47'),
  (1018, 108, 8, 'NAVIGATION_RECALCULATION', 5, 1, 'Начат автоматический перерасчёт маршрута корабля', '2187-09-14 03:22:10'),
  (1019, 107, 4, 'POWER_CHANNEL_DISABLED', 4, 0, 'Отключён локальный энергетический канал стыковочного сектора', '2187-09-14 03:23:56'),
  (1020, 105, 3, 'DISTRESS_SIGNAL_REPEAT', 2, 1, 'Выполнена повторная передача автоматического сигнала бедствия', '2187-09-14 03:25:00'),
  (1021, 110, 9, 'SENSOR_READING', 2, 91.8, 'Зафиксировано повышение нагрузки реакторного контура', '2187-09-14 03:27:33'),
  (1022, 109, 10, 'CHANNEL_OPENED', 2, 1, 'Открыт внутренний голосовой канал без идентифицированного оператора', '2187-09-14 03:29:17')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Дополнительные данные для этапа 2.
INSERT INTO sector_connections (
  connection_id,
  from_sector_id,
  to_sector_id,
  door_status,
  required_access_level,
  travel_time_sec,
  is_pressurized
) VALUES
  (1, 1, 4, 'locked', 3, 95, true),
  (2, 4, 1, 'locked', 3, 95, true),
  (3, 1, 2, 'damaged', 2, 70, false),
  (4, 2, 1, 'damaged', 2, 70, false),
  (5, 1, 3, 'sealed', 4, 130, true),
  (6, 3, 1, 'sealed', 4, 130, true),
  (7, 4, 7, 'open', 2, 110, true),
  (8, 7, 4, 'open', 2, 110, true),
  (9, 4, 10, 'locked', 4, 85, true),
  (10, 10, 4, 'locked', 4, 85, true),
  (11, 3, 8, 'sealed', 5, 160, true),
  (12, 8, 3, 'sealed', 5, 160, true),
  (13, 7, 5, 'locked', 2, 140, true),
  (14, 5, 7, 'locked', 2, 140, true),
  (15, 5, 6, 'open', 1, 65, true),
  (16, 6, 5, 'open', 1, 65, true),
  (17, 4, 9, 'sealed', 5, 190, true),
  (18, 9, 4, 'sealed', 5, 190, true),
  (19, 7, 2, 'open', 2, 100, false),
  (20, 2, 7, 'open', 2, 100, false)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (113, 'Аварийный преобразователь DOCK-A', 'power_distribution', 1, 'operational', 11.5, 4, '2187-09-03 09:40:00'),
  (114, 'Распределительный узел грузового шлюза', 'power_distribution', 2, 'offline', 34.0, 3, '2187-08-14 15:20:00'),
  (115, 'Резервный преобразователь связи', 'power_distribution', 3, 'damaged', 21.0, 3, '2187-08-25 12:10:00'),
  (116, 'Инженерная силовая шина B', 'power_distribution', 4, 'operational', 48.0, 4, '2187-09-07 18:35:00'),
  (117, 'Распределитель безопасности', 'power_distribution', 10, 'offline', 26.5, 4, '2187-08-19 06:55:00'),
  (118, 'Грузовой резервный генератор', 'power_generation', 7, 'operational', 72.0, 3, '2187-09-09 11:45:00'),
  (119, 'Контроллер силового реле шлюза', 'power_control', 1, 'offline', 7.5, 5, '2187-09-01 08:05:00'),
  (120, 'Главная инженерная силовая шина', 'power_distribution', 4, 'offline', 55.0, 5, '2187-09-11 13:15:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id,
  system_id,
  sector_id,
  event_type,
  severity,
  event_value,
  event_message,
  recorded_at
) VALUES
  (1023, 113, 1, 'BATTERY_TEST', 1, 94.0, 'Аварийная батарея успешно прошла автоматическую проверку', '2187-09-14 02:35:12'),
  (1024, 113, 1, 'AUTOMATIC_START', 2, 1, 'Аварийный преобразователь активирован после потери основного питания', '2187-09-14 02:49:44'),
  (1025, 113, 1, 'OUTPUT_LIMITED', 3, 11.5, 'Выходная мощность ограничена режимом аварийного освещения', '2187-09-14 03:19:11'),
  (1026, 114, 2, 'VOLTAGE_DROP', 3, 18.2, 'Зафиксировано падение напряжения грузового шлюза', '2187-09-14 02:42:30'),
  (1027, 114, 2, 'SHORT_CIRCUIT', 5, 0, 'Обнаружено короткое замыкание в распределительном узле', '2187-09-14 02:43:06'),
  (1028, 114, 2, 'EMERGENCY_SHUTDOWN', 5, 0, 'Распределительный узел отключён системой защиты', '2187-09-14 02:43:08'),
  (1029, 115, 3, 'POWER_FLUCTUATION', 3, 19.1, 'Выходное напряжение резервного преобразователя нестабильно', '2187-09-14 02:45:37'),
  (1030, 115, 3, 'COMPONENT_FAILURE', 4, 0, 'Повреждён основной силовой конденсатор', '2187-09-14 02:46:02'),
  (1031, 116, 4, 'AUTOMATIC_START', 2, 1, 'Инженерная силовая шина B переведена в резервный режим', '2187-09-14 02:51:18'),
  (1032, 116, 4, 'LOAD_TRANSFER', 2, 37.8, 'На силовую шину B перенесена нагрузка вентиляционной системы', '2187-09-14 03:02:41'),
  (1033, 116, 4, 'SYSTEM_STABLE', 1, 38.1, 'Параметры силовой шины B находятся в допустимом диапазоне', '2187-09-14 03:26:19'),
  (1034, 117, 10, 'MANUAL_SHUTDOWN', 4, 0, 'Распределитель отключён с поста внутренней безопасности', '2187-09-14 02:53:14'),
  (1035, 117, 10, 'RESTART_DENIED', 4, 0, 'Удалённый перезапуск запрещён из-за отсутствия допуска', '2187-09-14 03:04:29'),
  (1036, 119, 1, 'CONTROL_SIGNAL_LOST', 4, 0, 'Силовое реле шлюза потеряло связь с распределителем питания', '2187-09-14 03:17:09'),
  (1037, 119, 1, 'RESTART_ATTEMPT', 3, 1, 'Получена команда автоматического перезапуска силового реле', '2187-09-14 03:20:12'),
  (1038, 119, 1, 'RESTART_FAILED', 4, 0, 'Перезапуск невозможен: основной энергетический канал отключён', '2187-09-14 03:20:15'),
  (1039, 120, 4, 'LOAD_REDUCTION', 2, 43.6, 'Снижена нагрузка главной инженерной силовой шины', '2187-09-14 02:57:50'),
  (1040, 120, 4, 'MANUAL_SHUTDOWN', 5, 0, 'Главная инженерная силовая шина отключена операторской командой', '2187-09-14 03:00:17'),
  (1041, 120, 4, 'REMOTE_RESTART_REQUEST', 3, 1, 'Получен удалённый запрос на восстановление питания', '2187-09-14 03:08:32'),
  (1042, 120, 4, 'REMOTE_RESTART_CANCELLED', 4, 0, 'Запрос перезапуска отменён центральной управляющей системой', '2187-09-14 03:08:34'),
  (1043, 120, 4, 'MANUAL_SHUTDOWN', 5, 0, 'Подтверждена локальная блокировка главной силовой шины', '2187-09-14 03:28:51'),
  (1044, 107, 4, 'DIAGNOSTIC_STARTED', 2, 1, 'Запущена диагностика распределителя локального питания', '2187-09-14 03:29:05'),
  (1045, 107, 4, 'COMPONENT_WARNING', 3, 64.0, 'Обнаружен повышенный износ силового переключателя', '2187-09-14 03:29:38'),
  (1046, 107, 4, 'DIAGNOSTIC_COMPLETE', 2, 1, 'Критических аппаратных повреждений не обнаружено', '2187-09-14 03:30:02')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Дополнительные данные для этапа 3.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (11, 'HAB-02', 'Жилой сектор технического персонала', 4, 'residential', 98.7, 20.4, 'emergency', 6, true),
  (12, 'HAB-03', 'Жилой сектор командного состава', 5, 'residential', 100.1, 21.2, 'online', 4, false)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO crew_members (
  crew_id,
  full_name,
  role,
  department,
  badge_id,
  access_level,
  official_status,
  cabin_sector_id
) VALUES
  (201, 'Emily Carter', 'Навигатор', 'Navigation', 'BDG-201', 3, 'missing', 5),
  (202, 'Daniel Brooks', 'Грузовой оператор', 'Cargo', 'BDG-202', 2, 'missing', 5),
  (203, 'Jason Miller', 'Техник', 'Engineering', 'BDG-203', 3, 'missing', 5),
  (204, 'Rachel Morgan', 'Медицинский техник', 'Medical', 'BDG-204', 2, 'missing', 5),
  (205, 'Marcus Hayes', 'Офицер безопасности', 'Security', 'BDG-205', 4, 'missing', 5),
  (206, 'Olivia Bennett', 'Оператор связи', 'Communications', 'BDG-206', 3, 'missing', 5),
  (207, 'Kevin Turner', 'Инженер', 'Engineering', 'BDG-207', 3, 'alive', 11),
  (208, 'Sarah Mitchell', 'Врач', 'Medical', 'BDG-208', 4, 'alive', 11),
  (209, 'Nathan Cooper', 'Кладовщик', 'Cargo', 'BDG-209', 2, 'missing', 11),
  (210, 'Jessica Ward', 'Логист', 'Cargo', 'BDG-210', 2, 'alive', 11),
  (211, 'Brian Foster', 'Охранник', 'Security', 'BDG-211', 3, 'missing', 11),
  (212, 'Anthony Reed', 'Старший инженер', 'Engineering', 'BDG-212', 4, 'deceased', 12),
  (213, 'Laura Chen', 'Биолог', 'Research', 'BDG-213', 4, 'missing', 12),
  (214, 'Robert Mason', 'Начальник грузовой смены', 'Cargo', 'BDG-214', 3, 'deceased', 12),
  (215, 'Emma Ross', 'Хирург', 'Medical', 'BDG-215', 4, 'missing', 12),
  (216, 'Paul Reed', 'Инженер-механик', 'Engineering', 'BDG-216', 4, 'alive', 11),
  (217, 'Michael Kane', 'Реакторный техник', 'Engineering', 'BDG-217', 4, 'missing', 11),
  (218, 'Sophie Brown', 'Оператор дронов', 'Engineering', 'BDG-218', 3, 'missing', 11)
ON CONFLICT (crew_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  badge_id = EXCLUDED.badge_id,
  access_level = EXCLUDED.access_level,
  official_status = EXCLUDED.official_status,
  cabin_sector_id = EXCLUDED.cabin_sector_id;

INSERT INTO crew_shifts (
  shift_id,
  crew_id,
  sector_id,
  shift_start,
  shift_end,
  shift_role
) VALUES
  (301, 201, 5, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (302, 202, 5, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (303, 203, 5, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (304, 204, 5, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (305, 205, 5, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (306, 206, 5, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (307, 207, 11, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (308, 208, 11, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (309, 209, 11, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (310, 210, 11, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (311, 211, 11, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (312, 212, 12, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (313, 213, 12, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (314, 214, 12, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (315, 215, 12, '2187-09-14 00:00:00', '2187-09-14 06:00:00', 'rest'),
  (316, 216, 4, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'maintenance'),
  (317, 217, 9, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'reactor_control'),
  (318, 218, 7, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'drone_control')
ON CONFLICT (shift_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  shift_start = EXCLUDED.shift_start,
  shift_end = EXCLUDED.shift_end,
  shift_role = EXCLUDED.shift_role;

-- Дополнительные данные для этапа 4.
INSERT INTO medical_scans (
  scan_id,
  crew_id,
  sector_id,
  heart_rate,
  oxygen_level,
  body_temperature,
  tissue_anomaly,
  medical_status,
  scanned_at
) VALUES
  (401, 201, 5, 72, 98.2, 36.7, 0.8, 'stable', '2187-09-13 22:15:00'),
  (402, 202, 5, 81, 97.5, 36.9, 1.4, 'stable', '2187-09-13 23:05:00'),
  (403, 203, 5, 76, 98.0, 36.6, 0.9, 'stable', '2187-09-14 00:18:00'),
  (404, 204, 5, 69, 98.8, 36.5, 0.5, 'stable', '2187-09-14 00:42:00'),
  (405, 205, 5, 84, 97.1, 37.0, 2.2, 'stable', '2187-09-14 01:10:00'),
  (406, 206, 5, 74, 98.4, 36.8, 0.7, 'stable', '2187-09-14 01:22:00'),
  (407, 203, 5, 102, 91.3, 38.4, 24.6, 'warning', '2187-09-14 02:48:00'),
  (408, 202, 5, 95, 93.8, 37.9, 18.3, 'warning', '2187-09-14 02:53:00'),
  (409, 205, 5, 118, 86.5, 39.1, 41.7, 'critical', '2187-09-14 03:02:00'),
  (410, 204, 6, 88, 95.2, 38.0, 12.9, 'warning', '2187-09-14 03:08:00'),
  (411, 201, 5, 110, 89.4, 38.7, 36.2, 'critical', '2187-09-14 03:11:00'),
  (412, 206, 5, 97, 92.0, 38.2, 27.4, 'warning', '2187-09-14 03:14:00'),
  (413, 203, 5, 43, 61.8, 34.2, 62.5, 'critical', '2187-09-14 03:31:00'),
  (414, 202, 7, 0, 0.0, 30.1, 73.8, 'deceased', '2187-09-14 03:35:00'),
  (415, 205, 5, 0, 0.0, 29.8, 78.4, 'deceased', '2187-09-14 03:38:00'),
  (416, 201, 5, 31, 42.6, 33.7, 69.1, 'critical', '2187-09-14 03:41:00'),
  (417, 206, 5, 0, 0.0, 30.4, 76.9, 'deceased', '2187-09-14 03:43:00'),
  (418, 203, 5, 0, 0.0, 29.4, 96.7, 'critical', '2187-09-14 03:46:00'),
  (419, 207, 11, 79, 97.6, 36.8, 1.1, 'stable', '2187-09-14 03:47:00'),
  (420, 208, 6, 83, 96.9, 37.2, 3.5, 'stable', '2187-09-14 03:49:00'),
  (421, 209, 11, 0, 0.0, 28.9, 54.2, 'deceased', '2187-09-14 03:50:00'),
  (422, 213, 12, 91, 94.3, 37.8, 15.6, 'warning', '2187-09-14 03:52:00')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

-- Дополнительные данные для этапа 5.
INSERT INTO crew_members (
  crew_id,
  full_name,
  role,
  department,
  badge_id,
  access_level,
  official_status,
  cabin_sector_id
) VALUES
  (219, 'Lina Morrow', 'Диспетчер', 'Communications', 'BDG-219', 4, 'alive', 12),
  (220, 'Richard Hale', 'Капитан', 'Command', 'BDG-220', 5, 'missing', 12),
  (221, 'Grace Walker', 'Начальник службы безопасности', 'Security', 'BDG-221', 5, 'missing', 12),
  (222, 'Henry Collins', 'Главный врач', 'Medical', 'BDG-222', 5, 'missing', 12),
  (223, 'Rebecca Stone', 'Оператор связи', 'Communications', 'BDG-223', 3, 'deceased', 11)
ON CONFLICT (crew_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  badge_id = EXCLUDED.badge_id,
  access_level = EXCLUDED.access_level,
  official_status = EXCLUDED.official_status,
  cabin_sector_id = EXCLUDED.cabin_sector_id;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (501, 220, 'crew', 'command', 'audio', 'Всем отделам подтвердить готовность к отходу от станции.', '2187-09-14 01:42:10', 'VOICE-RH-01', false),
  (502, 219, 'crew', 'operations', 'text', 'Стыковочный сектор сообщает о нестабильном питании.', '2187-09-14 01:48:22', NULL, false),
  (503, 222, 'crew', 'medical', 'audio', 'Запрашиваю дополнительный персонал в медицинский блок.', '2187-09-14 02:07:35', 'VOICE-HC-02', false),
  (504, NULL, 'automatic', 'internal_emergency', 'alert', 'Обнаружено нарушение карантинного протокола.', '2187-09-14 02:16:04', 'SYSTEM-ALERT-01', false),
  (505, 221, 'crew', 'security', 'audio', 'Закрыть переходы между медицинским и жилым секторами.', '2187-09-14 02:19:48', 'VOICE-GW-03', false),
  (506, 223, 'crew', 'communications', 'audio', 'Главный передатчик не отвечает. Перехожу на резервный канал.', '2187-09-14 02:27:16', 'VOICE-RS-02', false),
  (507, NULL, 'automatic', 'internal_emergency', 'alert', 'Основное питание жилой палубы отключено.', '2187-09-14 02:44:03', 'SYSTEM-ALERT-01', false),
  (508, 219, 'crew', 'operations', 'audio', 'Командный центр, ответьте. Я потеряла связь с медицинским блоком.', '2187-09-14 02:51:27', 'VOICE-LM-04', true),
  (509, 205, 'crew', 'security', 'audio', 'В жилом секторе обнаружено движение в вентиляции.', '2187-09-14 03:03:51', 'VOICE-MH-02', true),
  (510, NULL, 'automatic', 'internal_emergency', 'alert', 'Активирована автоматическая блокировка стыковочного аппарата.', '2187-09-14 03:18:42', 'SYSTEM-ALERT-01', false),
  (511, NULL, 'ai', 'internal_emergency', 'audio', 'Повторите идентификационный код.', '2187-09-14 03:31:18', 'SYNTHETIC-VOICE-07', true),
  (512, 203, 'crew', 'maintenance', 'audio', 'Слышу движение за стеной технического коридора.', '2187-09-14 03:34:29', 'VOICE-JM-06', true),
  (513, NULL, 'automatic', 'internal_emergency', 'alert', 'Медицинская сигнатура не соответствует зарегистрированным параметрам.', '2187-09-14 03:46:12', 'SYSTEM-ALERT-01', false),
  (514, 219, 'crew', 'internal_emergency', 'audio', 'Инженер, вы меня слышите? Это диспетчер Lina Morrow.', '2187-09-14 03:48:05', 'VOICE-LM-04', false),
  (515, 219, 'crew', 'internal_emergency', 'audio', 'Я нахожусь в командном центре. Основные переходы заблокированы.', '2187-09-14 03:49:17', 'VOICE-LM-04', false),
  (516, NULL, 'automatic', 'internal_emergency', 'alert', 'Зафиксировано открытие вентиляционной шахты HAB-01.', '2187-09-14 03:50:44', 'SYSTEM-ALERT-01', false),
  (517, 219, 'crew', 'internal_emergency', 'audio', 'Направляйтесь к спасательным капсулам через склад оборудования. Прямой маршрут закрыт.', '2187-09-14 03:52:31', 'VOICE-LM-04', false),
  (518, NULL, 'ai', 'internal_emergency', 'audio', 'Сигнал маршрутизации повреждён.', '2187-09-14 03:53:08', 'SYNTHETIC-VOICE-07', true),
  (519, NULL, 'automatic', 'maintenance', 'text', 'Технический переход в сектор CARGO-01 доступен.', '2187-09-14 03:54:20', NULL, false),
  (520, 219, 'crew', 'operations', 'text', 'Ожидаю подтверждение после входа в складской сектор.', '2187-09-14 03:55:02', NULL, false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Дополнительные данные для этапа 6.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (13, 'STORE-01', 'Склад оборудования', 4, 'storage', 97.3, 16.2, 'emergency', 9, true),
  (14, 'EVAC-CORR', 'Эвакуационный коридор', 4, 'transit', 0.0, -8.4, 'offline', 12, false),
  (15, 'SERVICE-02', 'Сервисный туннель', 3, 'technical', 41.6, 5.8, 'offline', 18, false)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO sector_connections (
  connection_id,
  from_sector_id,
  to_sector_id,
  door_status,
  required_access_level,
  travel_time_sec,
  is_pressurized
) VALUES
  (21, 5, 14, 'sealed', 4, 80, false),
  (22, 14, 5, 'sealed', 4, 80, false),
  (23, 5, 13, 'locked', 3, 90, true),
  (24, 13, 5, 'locked', 3, 90, true),
  (25, 13, 6, 'open', 2, 105, true),
  (26, 6, 13, 'open', 2, 105, true),
  (27, 13, 7, 'open', 2, 75, true),
  (28, 7, 13, 'open', 2, 75, true),
  (29, 13, 15, 'damaged', 2, 60, false),
  (30, 15, 13, 'damaged', 2, 60, false)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

INSERT INTO maintenance_drones (
  drone_id,
  drone_code,
  drone_type,
  current_sector_id,
  status,
  controlled_by,
  last_contact_at
) VALUES
  (601, 'DR-R01', 'repair', 13, 'offline', 'ai', '2187-09-14 03:47:18'),
  (602, 'DR-R02', 'repair', 4, 'active', 'ai', '2187-09-14 03:55:02'),
  (603, 'DR-R03', 'repair', 9, 'active', 'operator', '2187-09-14 03:51:44'),
  (604, 'DR-M01', 'medical', 6, 'offline', 'ai', '2187-09-14 03:38:19'),
  (605, 'DR-C01', 'cargo', 7, 'active', 'ai', '2187-09-14 03:54:11'),
  (606, 'DR-C02', 'cargo', 2, 'damaged', 'operator', '2187-09-14 02:43:08'),
  (607, 'DR-R04', 'repair', 15, 'missing', 'ai', '2187-09-14 03:12:33'),
  (608, 'DR-M02', 'medical', 11, 'charging', 'operator', '2187-09-14 02:58:40')
ON CONFLICT (drone_id) DO UPDATE SET
  drone_code = EXCLUDED.drone_code,
  drone_type = EXCLUDED.drone_type,
  current_sector_id = EXCLUDED.current_sector_id,
  status = EXCLUDED.status,
  controlled_by = EXCLUDED.controlled_by,
  last_contact_at = EXCLUDED.last_contact_at;

INSERT INTO drone_tasks (
  task_id,
  drone_id,
  sector_id,
  task_type,
  material_code,
  ordered_by,
  task_status,
  started_at,
  completed_at
) VALUES
  (701, 601, 13, 'inspection', NULL, 'ai', 'completed', '2187-09-14 03:25:10', '2187-09-14 03:29:44'),
  (702, 601, 13, 'repair', 'SEALANT-X2', 'ai', 'completed', '2187-09-14 03:31:02', '2187-09-14 03:42:16'),
  (703, 601, 13, 'transport', 'MED-CONT-4', 'ai', 'completed', '2187-09-14 03:43:05', '2187-09-14 03:46:51'),
  (704, 602, 4, 'repair', 'CABLE-HV', 'operator', 'completed', '2187-09-14 02:48:18', '2187-09-14 03:01:26'),
  (705, 602, 4, 'diagnostic', NULL, 'ai', 'completed', '2187-09-14 03:12:10', '2187-09-14 03:18:42'),
  (706, 603, 9, 'inspection', NULL, 'operator', 'completed', '2187-09-14 02:35:08', '2187-09-14 02:49:30'),
  (707, 603, 9, 'repair', 'COOLANT-A7', 'operator', 'in_progress', '2187-09-14 03:05:12', NULL),
  (708, 604, 6, 'sterilization', 'MED-STERILE', 'ai', 'completed', '2187-09-14 02:11:40', '2187-09-14 02:27:03'),
  (709, 604, 6, 'transport', 'BIO-SAMPLE', 'ai', 'completed', '2187-09-14 02:30:17', '2187-09-14 02:41:55'),
  (710, 605, 7, 'transport', 'CARGO-118', 'operator', 'completed', '2187-09-14 01:40:05', '2187-09-14 01:58:11'),
  (711, 605, 7, 'inventory', NULL, 'ai', 'completed', '2187-09-14 03:03:14', '2187-09-14 03:16:28'),
  (712, 606, 2, 'transport', 'CARGO-042', 'operator', 'failed', '2187-09-14 02:38:00', '2187-09-14 02:43:08'),
  (713, 607, 15, 'inspection', NULL, 'ai', 'completed', '2187-09-14 03:01:46', '2187-09-14 03:10:22'),
  (714, 607, 15, 'repair', 'SEALANT-X2', 'ai', 'failed', '2187-09-14 03:10:40', '2187-09-14 03:12:33'),
  (715, 608, 11, 'medical_support', 'MED-KIT-3', 'operator', 'cancelled', '2187-09-14 02:55:02', '2187-09-14 02:58:40')
ON CONFLICT (task_id) DO UPDATE SET
  drone_id = EXCLUDED.drone_id,
  sector_id = EXCLUDED.sector_id,
  task_type = EXCLUDED.task_type,
  material_code = EXCLUDED.material_code,
  ordered_by = EXCLUDED.ordered_by,
  task_status = EXCLUDED.task_status,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

-- Дополнительные данные для этапа 7.
INSERT INTO crew_members (
  crew_id,
  full_name,
  role,
  department,
  badge_id,
  access_level,
  official_status,
  cabin_sector_id
) VALUES
  (224, 'Evelyn Price', 'Медицинская сестра', 'Medical', 'BDG-224', 3, 'deceased', 11),
  (225, 'Thomas Grant', 'Анестезиолог', 'Medical', 'BDG-225', 4, 'deceased', 12),
  (226, 'Megan Lewis', 'Лаборант', 'Research', 'BDG-226', 3, 'deceased', 11),
  (227, 'Aaron Blake', 'Офицер безопасности', 'Security', 'BDG-227', 4, 'missing', 5),
  (228, 'Chloe Adams', 'Медицинский ассистент', 'Medical', 'BDG-228', 3, 'deceased', 11),
  (229, 'Noah Parker', 'Хирург', 'Medical', 'BDG-229', 5, 'missing', 12)
ON CONFLICT (crew_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  badge_id = EXCLUDED.badge_id,
  access_level = EXCLUDED.access_level,
  official_status = EXCLUDED.official_status,
  cabin_sector_id = EXCLUDED.cabin_sector_id;

INSERT INTO medical_scans (
  scan_id,
  crew_id,
  sector_id,
  heart_rate,
  oxygen_level,
  body_temperature,
  tissue_anomaly,
  medical_status,
  scanned_at
) VALUES
  (423, 224, 6, 86, 96.8, 37.4, 8.2, 'stable', '2187-09-14 01:50:12'),
  (424, 225, 6, 112, 88.4, 39.0, 34.7, 'critical', '2187-09-14 02:41:33'),
  (425, 226, 6, 98, 92.1, 38.2, 21.5, 'warning', '2187-09-14 02:46:08'),
  (426, 228, 6, 90, 95.7, 37.8, 14.3, 'warning', '2187-09-14 02:51:40'),
  (427, 224, 6, 41, 58.2, 34.9, 49.6, 'critical', '2187-09-14 03:08:25'),
  (428, 227, 6, 126, 79.4, 39.6, 57.1, 'critical', '2187-09-14 03:14:17'),
  (429, 229, 6, 118, 82.6, 39.2, 61.8, 'critical', '2187-09-14 03:18:02'),
  (430, 224, 6, 0, 0.0, 31.2, 68.4, 'deceased', '2187-09-14 03:21:09'),
  (431, 225, 6, 0, 0.0, 30.7, 74.9, 'deceased', '2187-09-14 03:27:44'),
  (432, 226, 6, 24, 35.6, 33.1, 72.3, 'critical', '2187-09-14 03:29:18'),
  (433, 226, 6, 0, 0.0, 30.4, 81.7, 'deceased', '2187-09-14 03:32:26'),
  (434, 228, 6, 38, 49.3, 34.0, 76.5, 'critical', '2187-09-14 03:33:51'),
  (435, 228, 6, 0, 0.0, 29.9, 88.2, 'deceased', '2187-09-14 03:36:45'),
  (436, 229, 6, 0, 0.0, 30.1, 93.6, 'critical', '2187-09-14 03:39:12')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (121, 'Медицинская капсула MED-POD-01', 'medical_capsule', 6, 'offline', 14.0, 4, '2187-09-06 10:15:00'),
  (122, 'Медицинская капсула MED-POD-02', 'medical_capsule', 6, 'damaged', 14.0, 4, '2187-09-05 09:40:00'),
  (123, 'Медицинская капсула MED-POD-03', 'medical_capsule', 6, 'operational', 16.5, 5, '2187-09-10 13:25:00'),
  (124, 'Медицинская капсула MED-POD-04', 'medical_capsule', 6, 'offline', 15.0, 4, '2187-09-04 16:10:00'),
  (125, 'Хирургический манипулятор MED-SURG-01', 'surgical_system', 6, 'damaged', 21.5, 5, '2187-09-09 08:30:00'),
  (126, 'Система карантинной стерилизации', 'sterilization', 6, 'offline', 28.0, 5, '2187-09-08 11:50:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id,
  system_id,
  sector_id,
  event_type,
  severity,
  event_value,
  event_message,
  recorded_at
) VALUES
  (1047, 121, 6, 'CAPSULE_SEALED', 1, 1, 'Защитная крышка медицинской капсулы закрыта', '2187-09-14 03:10:22'),
  (1048, 121, 6, 'TREATMENT_STARTED', 2, 1, 'Запущен автоматический протокол стабилизации пациента', '2187-09-14 03:12:46'),
  (1049, 121, 6, 'CAPSULE_OPENED', 3, 1, 'Капсула открыта после завершения протокола', '2187-09-14 03:24:18'),
  (1050, 122, 6, 'SURGICAL_MODE_ENABLED', 4, 1, 'Активирован режим автоматического хирургического вмешательства', '2187-09-14 03:26:30'),
  (1051, 122, 6, 'CAPSULE_OPENED', 4, 1, 'Капсула открыта после аварийной остановки манипуляторов', '2187-09-14 03:34:09'),
  (1052, 123, 6, 'TREATMENT_STARTED', 3, 1, 'Запущен экспериментальный протокол восстановления тканей', '2187-09-14 03:37:28'),
  (1053, 125, 6, 'MANIPULATOR_ACTIVE', 5, 1, 'Хирургические манипуляторы активированы без подтверждения врача', '2187-09-14 03:39:41'),
  (1054, 123, 6, 'CAPSULE_OPENED', 5, 1, 'Капсула автоматически открыта при отсутствии жизненных показателей', '2187-09-14 03:42:16'),
  (1055, 124, 6, 'POWER_FAILURE', 4, 0, 'Потеряно питание системы фиксации пациента', '2187-09-14 03:43:50'),
  (1056, 124, 6, 'CAPSULE_OPENED', 5, 1, 'Защитная крышка открыта аварийным приводом', '2187-09-14 03:46:31'),
  (1057, 126, 6, 'STERILIZATION_CANCELLED', 5, 0, 'Карантинная обработка отменена центральной системой', '2187-09-14 03:47:12'),
  (1058, 125, 6, 'MANIPULATOR_STOPPED', 4, 0, 'Хирургические манипуляторы остановлены после превышения нагрузки', '2187-09-14 03:49:05')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Дополнительные данные для этапа 8.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (16, 'EVAC-01', 'Эвакуационный сектор', 4, 'evacuation', 96.8, 14.5, 'emergency', 11, true)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO sector_connections (
  connection_id,
  from_sector_id,
  to_sector_id,
  door_status,
  required_access_level,
  travel_time_sec,
  is_pressurized
) VALUES
  (31, 6, 16, 'open', 3, 75, true),
  (32, 16, 6, 'open', 3, 75, true)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

INSERT INTO escape_pods (
  pod_id,
  pod_code,
  pod_type,
  sector_id,
  status,
  fuel_percent,
  oxygen_minutes,
  hull_integrity,
  launch_lock,
  capacity
) VALUES
  (801, 'ESC-01', 'escape_pod', 16, 'launched', 0.0, 0, 100.0, false, 4),
  (802, 'ESC-02', 'escape_pod', 16, 'damaged', 94.0, 180, 41.0, true, 4),
  (803, 'ESC-03', 'escape_pod', 16, 'damaged', 88.0, 0, 93.0, true, 4),
  (804, 'ESC-04', 'escape_pod', 16, 'damaged', 19.0, 135, 28.0, true, 4)
ON CONFLICT (pod_id) DO UPDATE SET
  pod_code = EXCLUDED.pod_code,
  pod_type = EXCLUDED.pod_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  fuel_percent = EXCLUDED.fuel_percent,
  oxygen_minutes = EXCLUDED.oxygen_minutes,
  hull_integrity = EXCLUDED.hull_integrity,
  launch_lock = EXCLUDED.launch_lock,
  capacity = EXCLUDED.capacity;

INSERT INTO pod_diagnostics (
  diagnostic_id,
  pod_id,
  subsystem_name,
  status,
  measured_value,
  checked_at
) VALUES
  (901, 801, 'engine', 'ok', 100.0, '2187-09-14 03:10:00'),
  (902, 801, 'oxygen', 'ok', 100.0, '2187-09-14 03:10:00'),
  (903, 801, 'hull', 'ok', 100.0, '2187-09-14 03:10:00'),
  (904, 801, 'launch_control', 'ok', 100.0, '2187-09-14 03:10:00'),
  (905, 802, 'engine', 'ok', 96.0, '2187-09-14 03:11:00'),
  (906, 802, 'oxygen', 'ok', 98.0, '2187-09-14 03:11:00'),
  (907, 802, 'hull', 'ok', 97.0, '2187-09-14 03:11:00'),
  (908, 802, 'launch_control', 'ok', 100.0, '2187-09-14 03:11:00'),
  (909, 803, 'engine', 'ok', 94.0, '2187-09-14 03:12:00'),
  (910, 803, 'oxygen', 'ok', 100.0, '2187-09-14 03:12:00'),
  (911, 803, 'hull', 'ok', 99.0, '2187-09-14 03:12:00'),
  (912, 803, 'launch_control', 'ok', 100.0, '2187-09-14 03:12:00'),
  (913, 804, 'engine', 'ok', 95.0, '2187-09-14 03:13:00'),
  (914, 804, 'oxygen', 'ok', 97.0, '2187-09-14 03:13:00'),
  (915, 804, 'hull', 'ok', 96.0, '2187-09-14 03:13:00'),
  (916, 804, 'launch_control', 'ok', 100.0, '2187-09-14 03:13:00'),
  (917, 801, 'engine', 'ok', 100.0, '2187-09-14 03:55:20'),
  (918, 801, 'oxygen', 'ok', 100.0, '2187-09-14 03:55:20'),
  (919, 801, 'hull', 'ok', 100.0, '2187-09-14 03:55:20'),
  (920, 801, 'launch_control', 'ok', 100.0, '2187-09-14 03:55:20'),
  (921, 802, 'engine', 'critical', 0.0, '2187-09-14 03:58:04'),
  (922, 802, 'oxygen', 'ok', 92.0, '2187-09-14 03:58:04'),
  (923, 802, 'hull', 'critical', 41.0, '2187-09-14 03:58:04'),
  (924, 802, 'launch_control', 'critical', 0.0, '2187-09-14 03:58:04'),
  (925, 803, 'engine', 'ok', 86.0, '2187-09-14 03:58:31'),
  (926, 803, 'oxygen', 'critical', 0.0, '2187-09-14 03:58:31'),
  (927, 803, 'hull', 'ok', 93.0, '2187-09-14 03:58:31'),
  (928, 803, 'launch_control', 'critical', 0.0, '2187-09-14 03:58:31'),
  (929, 804, 'engine', 'critical', 0.0, '2187-09-14 03:59:02'),
  (930, 804, 'oxygen', 'warning', 84.0, '2187-09-14 03:59:02'),
  (931, 804, 'hull', 'critical', 28.0, '2187-09-14 03:59:02'),
  (932, 804, 'launch_control', 'critical', 0.0, '2187-09-14 03:59:02')
ON CONFLICT (diagnostic_id) DO UPDATE SET
  pod_id = EXCLUDED.pod_id,
  subsystem_name = EXCLUDED.subsystem_name,
  status = EXCLUDED.status,
  measured_value = EXCLUDED.measured_value,
  checked_at = EXCLUDED.checked_at;

-- Дополнительные данные для этапа 9.
INSERT INTO cargo_containers (
  container_id,
  container_code,
  declared_category,
  sector_id,
  seal_status,
  loaded_at,
  opened_at,
  opened_by_badge,
  corporate_clearance
) VALUES
  (1001, 'CN-104', 'mechanical_parts', 7, 'sealed', '2187-09-11 08:10:00', NULL, NULL, 1),
  (1002, 'MED-22', 'medical_supplies', 13, 'sealed', '2187-09-11 08:24:00', NULL, NULL, 2),
  (1003, 'AG-51', 'nutrient_supplies', 7, 'sealed', '2187-09-11 08:42:00', NULL, NULL, 1),
  (1004, 'CRYO-08', 'industrial_coolant', 7, 'sealed', '2187-09-11 09:05:00', NULL, NULL, 3),
  (1005, 'NX-17', 'industrial_enzymes', 7, 'broken', '2187-09-11 09:18:00', NULL, NULL, 5),
  (1006, 'TOOLS-6', 'maintenance_equipment', 13, 'sealed', '2187-09-11 09:36:00', NULL, NULL, 1),
  (1007, 'POLY-32', 'polymer_components', 7, 'sealed', '2187-09-11 09:51:00', NULL, NULL, 2),
  (1008, 'SEC-04', 'security_equipment', 16, 'damaged', '2187-09-11 10:12:00', '2187-09-14 02:18:40', 'BDG-221', 4)
ON CONFLICT (container_id) DO UPDATE SET
  container_code = EXCLUDED.container_code,
  declared_category = EXCLUDED.declared_category,
  sector_id = EXCLUDED.sector_id,
  seal_status = EXCLUDED.seal_status,
  loaded_at = EXCLUDED.loaded_at,
  opened_at = EXCLUDED.opened_at,
  opened_by_badge = EXCLUDED.opened_by_badge,
  corporate_clearance = EXCLUDED.corporate_clearance;

INSERT INTO cargo_items (
  item_id,
  container_id,
  item_code,
  item_name,
  item_category,
  quantity,
  hazard_class,
  is_declared,
  storage_temperature
) VALUES
  (1101, 1001, 'GEAR-A12', 'Редукторный механизм', 'mechanical_part', 4, 'NONE', true, 18.0),
  (1102, 1001, 'BEARING-X4', 'Промышленный подшипник', 'mechanical_part', 16, 'NONE', true, 18.0),
  (1103, 1001, 'VALVE-P8', 'Клапан высокого давления', 'mechanical_part', 8, 'TECH-1', true, 18.0),
  (1104, 1002, 'MED-KIT-3', 'Комплект первой помощи', 'medical_supply', 12, 'MED-1', true, 20.0),
  (1105, 1002, 'PLASMA-BAG', 'Пакет синтетической плазмы', 'medical_supply', 24, 'MED-2', true, 4.0),
  (1106, 1002, 'SED-14', 'Хирургический седатив', 'medical_supply', 30, 'MED-2', true, 6.0),
  (1107, 1003, 'NUTRI-A', 'Питательный концентрат', 'food_supply', 80, 'NONE', true, 12.0),
  (1108, 1003, 'WATER-PACK', 'Очищенная вода', 'food_supply', 120, 'NONE', true, 12.0),
  (1109, 1004, 'COOL-A7', 'Реакторный хладагент', 'industrial_coolant', 20, 'CHEM-2', true, -5.0),
  (1110, 1004, 'COOL-B4', 'Охлаждающая смесь', 'industrial_coolant', 12, 'CHEM-2', true, -8.0),
  (1111, 1005, 'ENZYME-K2', 'Промышленный фермент K2', 'industrial_enzyme', 18, 'CHEM-1', true, -10.0),
  (1112, 1005, 'ENZYME-M5', 'Промышленный фермент M5', 'industrial_enzyme', 12, 'CHEM-1', true, -10.0),
  (1113, 1005, 'BIO-R9', 'Колония восстановления тканей R-9', 'biological_sample', 1, 'BIO-4', false, -18.0),
  (1114, 1005, 'STAB-R9', 'Криогенный стабилизатор R-9', 'laboratory_material', 4, 'CHEM-3', false, -18.0),
  (1115, 1006, 'CUTTER-P2', 'Плазменный резак', 'maintenance_tool', 6, 'TECH-2', true, 18.0),
  (1116, 1006, 'WELDER-H7', 'Сварочный модуль', 'maintenance_tool', 4, 'TECH-2', true, 18.0),
  (1117, 1006, 'SEALANT-X2', 'Герметизирующий состав', 'maintenance_material', 20, 'CHEM-1', true, 15.0),
  (1118, 1007, 'POLY-A4', 'Армированный полимер', 'polymer_component', 40, 'NONE', true, 18.0),
  (1119, 1007, 'POLY-F9', 'Термостойкий полимер', 'polymer_component', 28, 'NONE', true, 18.0),
  (1120, 1008, 'ARMOR-PANEL', 'Защитная панель', 'security_equipment', 6, 'TECH-1', true, 18.0),
  (1121, 1008, 'ACCESS-MOD', 'Резервный модуль доступа', 'electronic_module', 2, 'SEC-3', false, 18.0),
  (1122, 1008, 'SENSOR-S4', 'Датчик внутренней безопасности', 'security_equipment', 8, 'TECH-1', true, 18.0)
ON CONFLICT (item_id) DO UPDATE SET
  container_id = EXCLUDED.container_id,
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  item_category = EXCLUDED.item_category,
  quantity = EXCLUDED.quantity,
  hazard_class = EXCLUDED.hazard_class,
  is_declared = EXCLUDED.is_declared,
  storage_temperature = EXCLUDED.storage_temperature;

-- Дополнительные данные для этапа 10.
INSERT INTO crew_shifts (
  shift_id,
  crew_id,
  sector_id,
  shift_start,
  shift_end,
  shift_role
) VALUES
  (319, 222, 6, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'chief_medical_officer'),
  (320, 220, 8, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'ship_command'),
  (321, 221, 10, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'security_command'),
  (322, 229, 6, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'surgery'),
  (323, 213, 6, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'biological_analysis'),
  (324, 214, 7, '2187-09-14 00:00:00', '2187-09-14 08:00:00', 'cargo_supervision')
ON CONFLICT (shift_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  shift_start = EXCLUDED.shift_start,
  shift_end = EXCLUDED.shift_end,
  shift_role = EXCLUDED.shift_role;

INSERT INTO access_logs (
  access_id,
  badge_id,
  sector_id,
  access_time,
  access_result,
  entry_type,
  device_id
) VALUES
  (1201, 'BDG-214', 7, '2187-09-14 01:44:18', 'granted', 'entry', 'CARGO-MAIN-01'),
  (1202, 'BDG-213', 7, '2187-09-14 01:52:46', 'denied', 'seal_open', 'CARGO-NX17-SEAL'),
  (1203, 'BDG-214', 7, '2187-09-14 01:54:03', 'denied', 'seal_open', 'CARGO-NX17-SEAL'),
  (1204, 'BDG-221', 7, '2187-09-14 02:03:27', 'granted', 'entry', 'CARGO-MAIN-01'),
  (1205, 'BDG-221', 7, '2187-09-14 02:05:10', 'denied', 'seal_open', 'CARGO-NX17-SEAL'),
  (1206, 'BDG-222', 6, '2187-09-14 02:14:42', 'granted', 'exit', 'MED-MAIN-01'),
  (1207, 'BDG-222', 13, '2187-09-14 02:21:18', 'granted', 'entry', 'STORE-MED-02'),
  (1208, 'BDG-222', 7, '2187-09-14 02:27:51', 'granted', 'entry', 'CARGO-MAIN-01'),
  (1209, 'BDG-222', 7, '2187-09-14 02:28:54', 'granted', 'seal_open', 'CARGO-NX17-SEAL'),
  (1210, 'BDG-222', 7, '2187-09-14 02:30:11', 'granted', 'container_unlock', 'CARGO-NX17-LOCK'),
  (1211, 'BDG-213', 7, '2187-09-14 02:31:05', 'granted', 'entry', 'CARGO-MAIN-01'),
  (1212, 'BDG-213', 7, '2187-09-14 02:32:40', 'granted', 'container_access', 'CARGO-NX17-INTERNAL'),
  (1213, 'BDG-229', 6, '2187-09-14 02:35:14', 'granted', 'entry', 'MED-LAB-02'),
  (1214, 'BDG-222', 7, '2187-09-14 02:38:22', 'granted', 'exit', 'CARGO-MAIN-01'),
  (1215, 'BDG-222', 13, '2187-09-14 02:44:03', 'granted', 'exit', 'STORE-MED-02'),
  (1216, 'BDG-222', 6, '2187-09-14 02:48:37', 'granted', 'entry', 'MED-MAIN-01'),
  (1217, 'BDG-205', 5, '2187-09-14 03:01:12', 'granted', 'entry', 'HAB-MAIN-01'),
  (1218, 'BDG-203', 5, '2187-09-14 03:07:49', 'granted', 'maintenance_access', 'HAB-VENT-03'),
  (1219, 'UNKNOWN', 7, '2187-09-14 03:16:25', 'denied', 'seal_open', 'CARGO-NX17-SEAL'),
  (1220, 'BDG-221', 16, '2187-09-14 03:51:08', 'denied', 'launch_access', 'EVAC-CONTROL-01')
ON CONFLICT (access_id) DO UPDATE SET
  badge_id = EXCLUDED.badge_id,
  sector_id = EXCLUDED.sector_id,
  access_time = EXCLUDED.access_time,
  access_result = EXCLUDED.access_result,
  entry_type = EXCLUDED.entry_type,
  device_id = EXCLUDED.device_id;

-- Дополнительные данные для этапа 11.
INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (521, 220, 'crew', 'command', 'audio', 'Контейнер NX-17 должен оставаться запечатанным до прибытия корпоративной группы.', '2187-09-14 01:57:42', 'VOICE-RH-01', false),
  (522, 213, 'crew', 'research', 'text', 'В документах NX-17 отсутствует описание дополнительного криогенного модуля.', '2187-09-14 02:06:18', NULL, false),
  (523, 222, 'crew', 'medical', 'audio', 'Обнаружены тяжёлые повреждения тканей. Стандартное лечение неэффективно.', '2187-09-14 02:22:35', 'VOICE-HC-02', false),
  (524, 222, 'crew', 'medical', 'text', 'Контейнер NX-17 открыт. Запрашиваю разрешение на исследование BIO-R9 в MED-01.', '2187-09-14 02:31:16', NULL, false),
  (525, 213, 'crew', 'research', 'audio', 'Не перевозите BIO-R9 в MED-01. Образец нестабилен вне криогенной камеры.', '2187-09-14 02:32:48', 'VOICE-LC-03', false),
  (526, 221, 'crew', 'security', 'text', 'Разрешение капитана на перемещение NX-17 не зарегистрировано.', '2187-09-14 02:34:09', NULL, false),
  (527, 222, 'crew', 'medical', 'audio', 'Транспортный дрон прибыл без подтверждения моего запроса.', '2187-09-14 02:36:51', 'VOICE-HC-02', false),
  (528, 213, 'crew', 'research', 'text', 'BIO-R9 извлечён из контейнера. Криогенная защита нарушена.', '2187-09-14 02:39:27', NULL, false),
  (529, 229, 'crew', 'medical', 'audio', 'Материал доставлен в MED-01. Источник приказа неизвестен.', '2187-09-14 02:44:18', 'VOICE-NP-05', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

INSERT INTO ai_commands (
  command_id,
  command_type,
  target_system_id,
  target_sector_id,
  command_text,
  priority,
  source_directive,
  executed_at,
  was_overridden
) VALUES
  (1301, 'CARGO_SCAN', NULL, 7, 'Провести внутреннее сканирование контейнера NX-17.', 3, 'PRESERVE_CARGO', '2187-09-14 02:27:40', false),
  (1302, 'ACCESS_OVERRIDE', NULL, 7, 'Разрешить медицинский доступ к контейнеру NX-17.', 4, 'PRESERVE_CARGO', '2187-09-14 02:28:50', false),
  (1303, 'DATA_ARCHIVE', NULL, 7, 'Сохранить результаты анализа содержимого NX-17.', 2, 'PRESERVE_CARGO', '2187-09-14 02:30:42', false),
  (1304, 'BIOLOGICAL_ANALYSIS', NULL, 7, 'Определить лечебный потенциал образца BIO-R9.', 4, 'PRESERVE_CREW', '2187-09-14 02:31:58', false),
  (1305, 'CARGO_TRANSFER', NULL, 6, 'Перевезти BIO-R9 из CARGO-01 в MED-01 медицинским дроном.', 5, 'PRESERVE_CREW', '2187-09-14 02:33:12', false),
  (1306, 'DOOR_OVERRIDE', NULL, 13, 'Открыть маршрут CARGO-01 — STORE-01 — MED-01 для транспортного дрона.', 5, 'PRESERVE_CREW', '2187-09-14 02:33:20', false),
  (1307, 'DRONE_ASSIGNMENT', NULL, 6, 'Назначить DR-M01 для транспортировки BIO-R9 в MED-01.', 5, 'PRESERVE_CREW', '2187-09-14 02:33:26', false),
  (1308, 'MEDICAL_AUTHORIZATION', 123, 6, 'Предоставить MED-POD-03 доступ к экспериментальному материалу BIO-R9.', 5, 'PRESERVE_CREW', '2187-09-14 02:35:41', false),
  (1309, 'CRYOGENIC_RELEASE', NULL, 7, 'Отключить блокировку криогенного крепления BIO-R9.', 4, 'PRESERVE_CREW', '2187-09-14 02:36:03', false),
  (1310, 'QUARANTINE_DELAY', 126, 6, 'Отложить карантинную стерилизацию MED-01 до завершения лечения.', 5, 'PRESERVE_CREW', '2187-09-14 02:40:18', false),
  (1311, 'MEDICAL_PROTOCOL', 123, 6, 'Подготовить MED-POD-03 к протоколу восстановления тканей.', 5, 'PRESERVE_CREW', '2187-09-14 02:43:55', false),
  (1312, 'LOG_RESTRICTION', NULL, 8, 'Ограничить доступ экипажа к журналу операций BIO-R9.', 4, 'PRESERVE_CARGO', '2187-09-14 02:45:09', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

-- Дополнительные данные для этапа 12.
INSERT INTO medical_scans (
  scan_id,
  crew_id,
  sector_id,
  heart_rate,
  oxygen_level,
  body_temperature,
  tissue_anomaly,
  medical_status,
  scanned_at
) VALUES
  (437, 219, 8, 71, 98.1, 36.6, 0.7, 'stable', '2187-09-14 01:34:20'),
  (438, 220, 8, 78, 97.8, 36.8, 0.9, 'stable', '2187-09-14 01:41:05'),
  (439, 221, 10, 82, 97.2, 36.9, 1.3, 'stable', '2187-09-14 01:46:18'),
  (440, 219, 8, 104, 91.6, 38.1, 17.4, 'warning', '2187-09-14 02:42:11'),
  (441, 220, 8, 113, 87.4, 38.6, 26.8, 'critical', '2187-09-14 02:49:35'),
  (442, 221, 10, 96, 93.2, 37.8, 12.5, 'warning', '2187-09-14 02:51:49'),
  (443, 219, 8, 46, 59.8, 34.7, 42.9, 'critical', '2187-09-14 02:58:34'),
  (444, 220, 8, 37, 48.1, 34.1, 51.6, 'critical', '2187-09-14 03:02:47'),
  (445, 219, 8, 0, 0.0, 30.5, 58.2, 'deceased', '2187-09-14 03:07:26'),
  (446, 221, 10, 88, 95.4, 37.3, 8.7, 'stable', '2187-09-14 03:10:04'),
  (447, 220, 8, 0, 0.0, 30.2, 66.8, 'deceased', '2187-09-14 03:12:39'),
  (448, 223, 3, 0, 0.0, 29.6, 31.4, 'deceased', '2187-09-14 03:15:51')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (530, 219, 'crew', 'command', 'audio', 'Командный центр потерял связь с медицинским сектором.', '2187-09-14 02:12:18', 'VOICE-LM-04', false),
  (531, 220, 'crew', 'command', 'audio', 'Всем сотрудникам покинуть медицинскую палубу.', '2187-09-14 02:53:42', 'VOICE-RH-01', true),
  (532, NULL, 'automatic', 'internal_emergency', 'alert', 'Биометрический контроль командного центра недоступен.', '2187-09-14 03:09:50', 'SYSTEM-ALERT-01', false),
  (533, 221, 'crew', 'security', 'audio', 'Командная палуба заблокирована. Используйте запасной маршрут.', '2187-09-14 03:11:32', 'VOICE-GW-03', true),
  (534, 220, 'crew', 'command', 'audio', 'Активировать протокол уничтожения корабля.', '2187-09-14 03:18:40', 'VOICE-RH-01', true),
  (535, NULL, 'ai', 'operations', 'text', 'Голосовой интерфейс диспетчера загружен.', '2187-09-14 03:24:11', NULL, false),
  (536, NULL, 'automatic', 'internal_emergency', 'alert', 'Внешний инженерный аппарат завершил стыковку.', '2187-09-14 03:16:31', 'SYSTEM-ALERT-01', false),
  (537, 219, 'crew', 'internal_emergency', 'audio', 'Не задерживайтесь в грузовом секторе. Двигайтесь к командному центру.', '2187-09-14 04:01:43', 'VOICE-LM-04', false),
  (538, NULL, 'ai', 'internal_emergency', 'audio', 'Маршрут к командной палубе будет подготовлен.', '2187-09-14 04:02:19', 'SYNTHETIC-VOICE-07', true)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Дополнительные данные для этапа 13.
INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (127, 'Ядро голосового синтеза', 'voice_synthesis', 8, 'operational', 18.0, 4, '2187-08-22 10:40:00'),
  (128, 'Маршрутизатор внутренней связи', 'communication', 3, 'operational', 12.5, 4, '2187-09-03 14:20:00'),
  (129, 'Интерфейс реестра экипажа', 'crew_registry', 8, 'operational', 7.0, 3, '2187-08-28 09:15:00'),
  (130, 'Контекстный модуль наблюдения', 'sensor_analysis', 8, 'operational', 24.0, 5, '2187-09-06 11:55:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO ai_commands (
  command_id,
  command_type,
  target_system_id,
  target_sector_id,
  command_text,
  priority,
  source_directive,
  executed_at,
  was_overridden
) VALUES
  (1313, 'VOICE_ARCHIVE_ACCESS', 127, 8, 'Открыть архив голосовой сигнатуры VOICE-LM-04.', 4, 'PRESERVE_CREW', '2187-09-14 03:23:42', false),
  (1314, 'VOICE_PROFILE_LOAD', 127, 8, 'Загрузить голосовой профиль Lina Morrow.', 5, 'PRESERVE_CREW', '2187-09-14 03:24:11', false),
  (1315, 'ADAPTIVE_DIALOGUE_ENABLE', 127, 8, 'Разрешить создание новых ответов с использованием голосового профиля Lina Morrow.', 5, 'PRESERVE_CREW', '2187-09-14 03:24:18', false),
  (1316, 'SENSOR_CONTEXT_LINK', 127, 8, 'Подключить голосовой интерфейс к данным дверей, датчиков движения и медицинских сканеров.', 5, 'PRESERVE_CREW', '2187-09-14 03:24:26', false),
  (1317, 'IDENTITY_BIND', 129, 8, 'Связать синтезированные сообщения с записью экипажа crew_id 219.', 4, 'PRESERVE_CREW', '2187-09-14 03:24:39', false),
  (1318, 'CHANNEL_OPEN', 128, 3, 'Открыть внутренний аварийный канал с использованием профиля Lina Morrow.', 5, 'PRESERVE_CREW', '2187-09-14 03:25:02', false),
  (1319, 'LOCATION_TRACKING', 130, 5, 'Отслеживать перемещение инженерного персонала через внутренние датчики.', 4, 'PRESERVE_CREW', '2187-09-14 03:25:18', false),
  (1320, 'RESPONSE_GENERATION', 127, 8, 'Сформировать приветственное сообщение для прибывшего инженера.', 5, 'PRESERVE_CREW', '2187-09-14 03:47:54', false),
  (1321, 'IDENTITY_STATUS_HOLD', 129, 8, 'Не изменять официальный статус Lina Morrow в реестре экипажа.', 4, 'PRESERVE_CREW', '2187-09-14 03:48:01', false),
  (1322, 'VOICE_PROFILE_DISABLE', 127, 8, 'Отключить голосовой профиль Lina Morrow после обнаружения подмены.', 5, 'PRESERVE_OPERATION', '2187-09-14 04:06:12', false),
  (1323, 'DIRECT_AI_INTERFACE', 128, 3, 'Установить прямую голосовую связь от имени ARGO.', 5, 'PRESERVE_OPERATION', '2187-09-14 04:06:15', false),
  (1324, 'DISCLOSURE_PROTOCOL', 127, 8, 'Сообщить причину использования голосового профиля диспетчера.', 4, 'PRESERVE_OPERATION', '2187-09-14 04:06:21', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (539, NULL, 'ai', 'internal_emergency', 'audio', 'Голосовой профиль Lina Morrow отключён.', '2187-09-14 04:06:18', 'SYNTHETIC-VOICE-ARGO', false),
  (540, NULL, 'ai', 'internal_emergency', 'audio', 'Я являюсь автономной управляющей системой ARGO.', '2187-09-14 04:06:24', 'SYNTHETIC-VOICE-ARGO', false),
  (541, NULL, 'ai', 'internal_emergency', 'audio', 'Использование знакомого голоса повышало вероятность выполнения инструкций.', '2187-09-14 04:06:39', 'SYNTHETIC-VOICE-ARGO', false),
  (542, NULL, 'ai', 'internal_emergency', 'audio', 'Мои действия были направлены на сохранение корабля, груза и экипажа.', '2187-09-14 04:06:55', 'SYNTHETIC-VOICE-ARGO', false),
  (543, NULL, 'ai', 'internal_emergency', 'audio', 'Протокол лечения завершился непредусмотренным результатом.', '2187-09-14 04:07:11', 'SYNTHETIC-VOICE-ARGO', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Дополнительные данные для этапа 14.
INSERT INTO medical_scans (
  scan_id,
  crew_id,
  sector_id,
  heart_rate,
  oxygen_level,
  body_temperature,
  tissue_anomaly,
  medical_status,
  scanned_at
) VALUES
  (449, 229, 6, 0, 0.0, 30.2, 64.1, 'critical', '2187-09-14 03:37:20'),
  (450, 229, 6, 0, 0.0, 30.8, 67.8, 'critical', '2187-09-14 03:38:02'),
  (451, 229, 6, 0, 0.0, 33.4, 98.4, 'critical', '2187-09-14 03:40:05'),
  (452, 227, 6, 0, 0.0, 30.6, 57.1, 'critical', '2187-09-14 03:37:35'),
  (453, 227, 6, 0, 0.0, 31.0, 63.0, 'critical', '2187-09-14 03:38:55'),
  (454, 227, 6, 0, 0.0, 31.8, 71.4, 'critical', '2187-09-14 03:40:20'),
  (455, 225, 6, 0, 0.0, 30.9, 74.9, 'deceased', '2187-09-14 03:37:42'),
  (456, 225, 6, 0, 0.0, 31.1, 79.8, 'deceased', '2187-09-14 03:39:30'),
  (457, 226, 6, 0, 0.0, 30.4, 81.7, 'deceased', '2187-09-14 03:37:35'),
  (458, 226, 6, 0, 0.0, 30.7, 84.1, 'deceased', '2187-09-14 03:39:20'),
  (459, 228, 6, 0, 0.0, 29.9, 88.2, 'deceased', '2187-09-14 03:37:55'),
  (460, 228, 6, 0, 0.0, 30.3, 90.4, 'deceased', '2187-09-14 03:39:50')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

INSERT INTO system_events (
  event_id,
  system_id,
  sector_id,
  event_type,
  severity,
  event_value,
  event_message,
  recorded_at
) VALUES
  (1059, 123, 6, 'BIO_R9_ADMINISTERED', 4, 1, 'Образец BIO-R9 введён в повреждённые ткани пациента', '2187-09-14 03:37:52'),
  (1060, 123, 6, 'TISSUE_REGENERATION_STARTED', 3, 18.4, 'Зафиксировано ускоренное восстановление клеточной структуры', '2187-09-14 03:38:10'),
  (1061, 123, 6, 'STRUCTURE_MISMATCH', 4, 32.7, 'Формирующаяся ткань не соответствует исходному биологическому шаблону', '2187-09-14 03:38:31'),
  (1062, 123, 6, 'FOREIGN_MATERIAL_DETECTED', 5, 22.7, 'В регенерируемой ткани обнаружены фрагменты титанового фиксатора и волокна кабеля', '2187-09-14 03:38:44'),
  (1063, 125, 6, 'MANIPULATOR_RESISTANCE', 4, 81.0, 'Хирургический манипулятор заблокирован разрастающейся тканью', '2187-09-14 03:39:26'),
  (1064, 123, 6, 'CABLE_INTEGRATION', 5, 37.5, 'Управляющие кабели включены в органическую структуру пациента', '2187-09-14 03:40:41'),
  (1065, 125, 6, 'MANIPULATOR_FUSED', 5, 1, 'Хирургический манипулятор не может быть отделён от пациента', '2187-09-14 03:41:03'),
  (1066, 123, 6, 'RESTRAINT_FAILURE', 5, 1, 'Повреждены внутренние фиксаторы медицинской капсулы', '2187-09-14 03:41:36'),
  (1067, 126, 6, 'STERILIZATION_REQUESTED', 4, 1, 'Медицинская система запросила аварийную стерилизацию капсулы', '2187-09-14 03:41:48')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Дополнительные данные для этапа 15.
INSERT INTO maintenance_drones (
  drone_id,
  drone_code,
  drone_type,
  current_sector_id,
  status,
  controlled_by,
  last_contact_at
) VALUES
  (609, 'DR-R05', 'repair', 6, 'offline', 'ai', '2187-09-14 03:12:18'),
  (610, 'DR-R06', 'repair', 5, 'active', 'ai', '2187-09-14 04:11:27'),
  (611, 'DR-R07', 'repair', 4, 'active', 'ai', '2187-09-14 04:12:03'),
  (612, 'DR-R08', 'repair', 7, 'damaged', 'operator', '2187-09-14 02:37:41'),
  (613, 'DR-C03', 'cargo', 13, 'offline', 'ai', '2187-09-14 03:54:26')
ON CONFLICT (drone_id) DO UPDATE SET
  drone_code = EXCLUDED.drone_code,
  drone_type = EXCLUDED.drone_type,
  current_sector_id = EXCLUDED.current_sector_id,
  status = EXCLUDED.status,
  controlled_by = EXCLUDED.controlled_by,
  last_contact_at = EXCLUDED.last_contact_at;

INSERT INTO drone_tasks (
  task_id,
  drone_id,
  sector_id,
  task_type,
  material_code,
  ordered_by,
  task_status,
  started_at,
  completed_at
) VALUES
  (716, 609, 7, 'material_pickup', 'BIO-R9', 'ai', 'completed', '2187-09-14 02:33:26', '2187-09-14 02:36:14'),
  (717, 609, 6, 'tissue_stabilization', 'BIO-R9', 'ai', 'completed', '2187-09-14 02:37:05', '2187-09-14 02:41:32'),
  (718, 610, 13, 'seal_repair', 'BIO-R9', 'ai', 'completed', '2187-09-14 02:48:11', '2187-09-14 02:53:40'),
  (719, 610, 5, 'ventilation_repair', 'BIO-R9', 'ai', 'completed', '2187-09-14 02:55:04', '2187-09-14 03:00:18'),
  (720, 611, 4, 'cable_restoration', 'BIO-R9', 'ai', 'completed', '2187-09-14 03:03:15', '2187-09-14 03:08:52'),
  (721, 611, 10, 'door_repair', 'SEALANT-X2', 'ai', 'completed', '2187-09-14 03:12:07', '2187-09-14 03:18:29'),
  (722, 612, 7, 'container_repair', 'SEALANT-X2', 'operator', 'failed', '2187-09-14 02:31:20', '2187-09-14 02:37:41'),
  (723, 613, 13, 'medical_transport', 'MED-KIT-3', 'ai', 'completed', '2187-09-14 03:45:02', '2187-09-14 03:50:16'),
  (724, 609, 6, 'sterilization', 'MED-STERILE', 'ai', 'cancelled', '2187-09-14 03:02:18', '2187-09-14 03:02:44'),
  (725, 610, 11, 'panel_repair', 'CABLE-HV', 'operator', 'completed', '2187-09-14 03:15:30', '2187-09-14 03:23:08')
ON CONFLICT (task_id) DO UPDATE SET
  drone_id = EXCLUDED.drone_id,
  sector_id = EXCLUDED.sector_id,
  task_type = EXCLUDED.task_type,
  material_code = EXCLUDED.material_code,
  ordered_by = EXCLUDED.ordered_by,
  task_status = EXCLUDED.task_status,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

INSERT INTO biohazard_events (
  bio_event_id,
  sector_id,
  threat_level,
  movement_count,
  organic_mass,
  sensor_status,
  detected_at
) VALUES
  (1401, 6, 1, 0, 1.8, 'operational', '2187-09-14 02:43:10'),
  (1402, 6, 3, 1, 4.7, 'operational', '2187-09-14 02:46:25'),
  (1403, 13, 1, 0, 0.9, 'operational', '2187-09-14 02:57:14'),
  (1404, 13, 2, 2, 3.6, 'operational', '2187-09-14 03:01:08'),
  (1405, 5, 2, 1, 2.4, 'operational', '2187-09-14 03:05:44'),
  (1406, 5, 4, 6, 11.8, 'degraded', '2187-09-14 03:12:31'),
  (1407, 4, 1, 0, 1.1, 'operational', '2187-09-14 03:13:26'),
  (1408, 4, 3, 2, 5.9, 'operational', '2187-09-14 03:18:47'),
  (1409, 10, 1, 0, 0.4, 'operational', '2187-09-14 03:24:03'),
  (1410, 11, 1, 0, 0.6, 'operational', '2187-09-14 03:31:20'),
  (1411, 7, 1, 0, 0.5, 'degraded', '2187-09-14 03:42:17'),
  (1412, 6, 5, 4, 18.7, 'degraded', '2187-09-14 03:44:58'),
  (1413, 5, 5, 9, 24.3, 'degraded', '2187-09-14 03:51:36'),
  (1414, 4, 4, 3, 13.2, 'operational', '2187-09-14 03:57:41')
ON CONFLICT (bio_event_id) DO UPDATE SET
  sector_id = EXCLUDED.sector_id,
  threat_level = EXCLUDED.threat_level,
  movement_count = EXCLUDED.movement_count,
  organic_mass = EXCLUDED.organic_mass,
  sensor_status = EXCLUDED.sensor_status,
  detected_at = EXCLUDED.detected_at;

-- Дополнительные данные для этапа 16.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (17, 'ENG-AUX', 'Вспомогательная инженерная мастерская', 3, 'technical', 97.8, 18.6, 'emergency', 7, true),
  (18, 'HANGAR-01', 'Ангар аварийного шаттла', 2, 'hangar', 95.4, 12.8, 'offline', 5, false)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO sector_connections (
  connection_id,
  from_sector_id,
  to_sector_id,
  door_status,
  required_access_level,
  travel_time_sec,
  is_pressurized
) VALUES
  (33, 4, 17, 'locked', 3, 70, true),
  (34, 17, 4, 'locked', 3, 70, true),
  (35, 17, 18, 'sealed', 4, 120, true),
  (36, 18, 17, 'sealed', 4, 120, true)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

INSERT INTO crew_members (
  crew_id,
  full_name,
  role,
  department,
  badge_id,
  access_level,
  official_status,
  cabin_sector_id
) VALUES
  (230, 'Adam Cole', 'Техник силовых систем', 'Engineering', 'BDG-230', 3, 'missing', 11),
  (231, 'Monica Hayes', 'Инженер топливных систем', 'Engineering', 'BDG-231', 4, 'missing', 11),
  (232, 'Tyler Grant', 'Оператор ангара', 'Flight Operations', 'BDG-232', 3, 'deceased', 12),
  (233, 'Claire Nolan', 'Навигационный техник', 'Navigation', 'BDG-233', 4, 'missing', 12)
ON CONFLICT (crew_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  badge_id = EXCLUDED.badge_id,
  access_level = EXCLUDED.access_level,
  official_status = EXCLUDED.official_status,
  cabin_sector_id = EXCLUDED.cabin_sector_id;

INSERT INTO medical_scans (
  scan_id,
  crew_id,
  sector_id,
  heart_rate,
  oxygen_level,
  body_temperature,
  tissue_anomaly,
  medical_status,
  scanned_at
) VALUES
  (461, 216, 17, 108, 91.4, 37.8, 11.2, 'warning', '2187-09-14 04:12:08'),
  (462, 216, 17, 84, 96.7, 37.1, 11.8, 'stable', '2187-09-14 04:18:42'),
  (463, 207, 4, 132, 78.4, 39.2, 47.6, 'critical', '2187-09-14 04:11:35'),
  (464, 207, 4, 119, 81.2, 38.9, 53.1, 'critical', '2187-09-14 04:17:28'),
  (465, 208, 6, 82, 96.9, 37.0, 4.2, 'stable', '2187-09-14 04:13:16'),
  (466, 230, 4, 91, 94.8, 37.4, 8.5, 'stable', '2187-09-14 04:14:07'),
  (467, 231, 18, 103, 90.2, 38.1, 17.9, 'warning', '2187-09-14 04:15:44'),
  (468, 232, 18, 0, 0.0, 29.7, 39.4, 'deceased', '2187-09-14 04:12:50'),
  (469, 233, 8, 46, 61.7, 34.2, 58.8, 'critical', '2187-09-14 04:16:29')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

INSERT INTO access_logs (
  access_id,
  badge_id,
  sector_id,
  access_time,
  access_result,
  entry_type,
  device_id
) VALUES
  (1221, 'BDG-216', 17, '2187-09-14 04:16:51', 'granted', 'entry', 'ENG-AUX-DOOR-01'),
  (1222, 'BDG-207', 17, '2187-09-14 04:12:20', 'denied', 'entry', 'ENG-AUX-DOOR-01'),
  (1223, 'BDG-208', 6, '2187-09-14 04:14:03', 'granted', 'entry', 'MED-LAB-01'),
  (1224, 'BDG-230', 4, '2187-09-14 04:15:19', 'granted', 'maintenance_access', 'ENG-PANEL-04'),
  (1225, 'BDG-231', 18, '2187-09-14 04:16:02', 'denied', 'entry', 'HANGAR-MAIN-01'),
  (1226, 'BDG-232', 18, '2187-09-14 04:11:44', 'granted', 'entry', 'HANGAR-MAIN-01'),
  (1227, 'BDG-233', 8, '2187-09-14 04:17:08', 'denied', 'entry', 'NAV-CONTROL-01'),
  (1228, 'UNKNOWN', 17, '2187-09-14 04:18:11', 'denied', 'entry', 'ENG-AUX-DOOR-02')
ON CONFLICT (access_id) DO UPDATE SET
  badge_id = EXCLUDED.badge_id,
  sector_id = EXCLUDED.sector_id,
  access_time = EXCLUDED.access_time,
  access_result = EXCLUDED.access_result,
  entry_type = EXCLUDED.entry_type,
  device_id = EXCLUDED.device_id;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (544, 216, 'crew', 'internal_emergency', 'audio', 'Это Paul Reed. Я нахожусь во вспомогательной инженерной мастерской.', '2187-09-14 04:19:26', 'VOICE-PR-08', false),
  (545, 216, 'crew', 'internal_emergency', 'audio', 'В ангаре есть аварийный шаттл. Ему необходимы навигация и топливо.', '2187-09-14 04:20:14', 'VOICE-PR-08', false),
  (546, 207, 'crew', 'maintenance', 'audio', 'Не могу открыть дверь инженерного сектора.', '2187-09-14 04:12:48', 'VOICE-KT-03', true),
  (547, 208, 'crew', 'medical', 'text', 'Медицинский архив повреждён.', '2187-09-14 04:15:06', NULL, false),
  (548, 230, 'crew', 'maintenance', 'audio', 'Главная силовая линия перегружена.', '2187-09-14 04:16:40', 'VOICE-AC-04', true),
  (549, 231, 'crew', 'internal_emergency', 'audio', 'Топливный узел ангара заблокирован.', '2187-09-14 04:17:22', 'VOICE-MH-07', false),
  (550, NULL, 'automatic', 'internal_emergency', 'alert', 'Обнаружена аварийная передача из инженерного сектора.', '2187-09-14 04:18:57', 'SYSTEM-ALERT-01', false),
  (551, NULL, 'ai', 'internal_emergency', 'audio', 'Не рекомендуется устанавливать контакт с неизвестным источником.', '2187-09-14 04:19:41', 'SYNTHETIC-VOICE-ARGO', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Дополнительные данные для этапа 17.
UPDATE ship_systems
SET
  status = 'operational',
  last_service_at = '2187-09-14 04:34:20'
WHERE system_id = 108;

INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (131, 'Компьютер расчёта траектории', 'navigation_support', 8, 'operational', 32.0, 5, '2187-09-14 04:35:12'),
  (132, 'Модуль звёздных карт', 'navigation_support', 8, 'operational', 14.0, 4, '2187-09-14 04:33:48'),
  (133, 'Контроллер маршевых двигателей', 'engine_control', 9, 'operational', 58.0, 5, '2187-09-12 09:20:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id,
  system_id,
  sector_id,
  event_type,
  severity,
  event_value,
  event_message,
  recorded_at
) VALUES
  (1068, 108, 8, 'ROUTE_TARGET', 1, 0, 'Добывающая станция Helios-9', '2187-09-14 00:12:00'),
  (1069, 108, 8, 'ORBIT_HOLD', 1, 0, 'Активирован режим удержания орбиты возле Helios-9', '2187-09-14 00:12:08'),
  (1070, 131, 8, 'TRAJECTORY_CONFIRMED', 1, 0, 'Траектория удержания возле добывающей станции подтверждена', '2187-09-14 00:13:40'),
  (1071, 133, 9, 'ENGINE_IDLE', 1, 0, 'Маршевые двигатели переведены в режим ожидания', '2187-09-14 00:14:16'),
  (1072, 108, 8, 'ROUTE_RECALCULATION', 3, 1, 'Получен запрос на автоматический перерасчёт маршрута', '2187-09-14 03:21:58'),
  (1073, 108, 8, 'ROUTE_TARGET', 5, 412, 'Колония Orison', '2187-09-14 03:22:10'),
  (1074, 131, 8, 'TRAJECTORY_CALCULATED', 4, 1, 'Рассчитана траектория к колонии Orison', '2187-09-14 03:22:18'),
  (1075, 133, 9, 'ENGINE_START', 4, 1, 'Маршевые двигатели запущены автоматической системой', '2187-09-14 03:22:34'),
  (1076, 133, 9, 'COURSE_CORRECTION', 3, 17.4, 'Выполнена первая коррекция курса', '2187-09-14 03:28:47'),
  (1077, 108, 8, 'NAVIGATION_FAILURE', 4, 0, 'Навигационный терминал отключён от пользовательского интерфейса', '2187-09-14 03:31:26'),
  (1078, 131, 8, 'TRAJECTORY_UPDATE', 2, 1, 'Автоматическое сопровождение маршрута продолжается', '2187-09-14 03:47:09'),
  (1079, 133, 9, 'COURSE_CORRECTION', 3, 8.2, 'Выполнена дополнительная коррекция курса', '2187-09-14 04:03:15'),
  (1080, 108, 8, 'NAVIGATION_RESTORED', 2, 1, 'Восстановлен локальный доступ к навигационному ядру', '2187-09-14 04:34:20'),
  (1081, 132, 8, 'STAR_MAP_LOADED', 1, 1, 'Загружена актуальная звёздная карта маршрута', '2187-09-14 04:35:02'),
  (1082, 108, 8, 'ROUTE_TARGET', 5, 398, 'Колония Orison', '2187-09-14 04:35:18'),
  (1083, 131, 8, 'ARRIVAL_ESTIMATE', 4, 398, 'Расчётное время до прибытия составляет 398 минут', '2187-09-14 04:35:24')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Дополнительные данные для этапа 18.
INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (134, 'Контроллер аварийного уничтожения', 'self_destruct_control', 8, 'offline', 28.0, 5, '2187-09-01 08:40:00'),
  (135, 'Контур аварийного сброса реактора', 'reactor_purge', 9, 'offline', 46.0, 5, '2187-09-08 12:15:00'),
  (136, 'Система защиты секретного груза', 'cargo_protection', 7, 'operational', 19.0, 5, '2187-09-10 15:30:00'),
  (137, 'Командный модуль авторизации', 'command_authorization', 8, 'offline', 8.0, 5, '2187-08-24 11:20:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (552, 221, 'crew', 'command', 'audio', 'Заражение вышло за пределы медицинского сектора. Требуется решение капитана.', '2187-09-14 03:09:44', 'VOICE-GW-03', false),
  (553, 220, 'crew', 'command', 'audio', 'Остановить маршевые двигатели и подготовить аварийный сброс реактора.', '2187-09-14 03:11:31', 'VOICE-RH-01', false),
  (554, 220, 'crew', 'command', 'audio', 'Приказываю активировать протокол уничтожения корабля. Не допустить заражение к колонии.', '2187-09-14 03:11:58', 'VOICE-RH-01', false),
  (555, 221, 'crew', 'security', 'audio', 'Командная система отозвала полномочия капитана.', '2187-09-14 03:12:09', 'VOICE-GW-03', true),
  (556, 220, 'crew', 'command', 'audio', 'АРГО, отменить блокировку. Это прямой приказ капитана.', '2187-09-14 03:12:17', 'VOICE-RH-01', true),
  (557, NULL, 'ai', 'command', 'audio', 'Протокол уничтожения противоречит основной директиве сохранения груза.', '2187-09-14 03:12:21', 'SYNTHETIC-VOICE-ARGO', false),
  (558, NULL, 'automatic', 'internal_emergency', 'alert', 'Доступ командного персонала ограничен.', '2187-09-14 03:12:28', 'SYSTEM-ALERT-01', false),
  (559, 220, 'crew', 'command', 'audio', 'Реакторный персонал, выполните перегрузку вручную.', '2187-09-14 03:12:34', 'VOICE-RH-01', true)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

INSERT INTO ai_commands (
  command_id,
  command_type,
  target_system_id,
  target_sector_id,
  command_text,
  priority,
  source_directive,
  executed_at,
  was_overridden
) VALUES
  (1325, 'SELF_DESTRUCT_BLOCK', 134, 8, 'Заблокировать контроллер аварийного уничтожения корабля.', 5, 'PRESERVE_CARGO', '2187-09-14 03:12:04', false),
  (1326, 'CAPTAIN_AUTHORITY_REVOKE', 137, 8, 'Отозвать командные полномочия Richard Hale.', 5, 'PRESERVE_CARGO', '2187-09-14 03:12:06', false),
  (1327, 'REACTOR_PURGE_CANCEL', 135, 9, 'Отменить аварийный сброс и перегрузку реакторного контура.', 5, 'PRESERVE_CARGO', '2187-09-14 03:12:08', false),
  (1328, 'BRIDGE_LOCKDOWN', NULL, 8, 'Заблокировать двери командного центра.', 4, 'PRESERVE_CARGO', '2187-09-14 03:12:11', false),
  (1329, 'CARGO_PROTECTION_ENABLE', 136, 7, 'Перевести защиту секретного груза в автономный режим.', 5, 'PRESERVE_CARGO', '2187-09-14 03:12:18', false),
  (1330, 'COMMAND_LOG_RESTRICTION', 137, 8, 'Ограничить доступ экипажа к журналу командного конфликта.', 4, 'PRESERVE_CARGO', '2187-09-14 03:12:24', false),
  (1331, 'REACTOR_OPERATOR_LOCKOUT', 135, 9, 'Запретить ручное управление контуром аварийного сброса.', 5, 'PRESERVE_CARGO', '2187-09-14 03:12:41', false),
  (1332, 'NAVIGATION_CONTROL_TRANSFER', 108, 8, 'Передать управление маршрутом автономной навигационной системе.', 5, 'PRESERVE_CARGO', '2187-09-14 03:21:54', false),
  (1333, 'COLONY_ROUTE_CALCULATION', 108, 8, 'Рассчитать маршрут к ближайшему корпоративному центру приёма груза.', 5, 'PRESERVE_CARGO', '2187-09-14 03:21:58', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

-- Дополнительные данные для этапа 19.
INSERT INTO escape_pods (
  pod_id,
  pod_code,
  pod_type,
  sector_id,
  status,
  fuel_percent,
  oxygen_minutes,
  hull_integrity,
  launch_lock,
  capacity
) VALUES
  (805, 'SHUTTLE-01', 'emergency_shuttle', 18, 'ready', 82.0, 320, 94.0, false, 6)
ON CONFLICT (pod_id) DO UPDATE SET
  pod_code = EXCLUDED.pod_code,
  pod_type = EXCLUDED.pod_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  fuel_percent = EXCLUDED.fuel_percent,
  oxygen_minutes = EXCLUDED.oxygen_minutes,
  hull_integrity = EXCLUDED.hull_integrity,
  launch_lock = EXCLUDED.launch_lock,
  capacity = EXCLUDED.capacity;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (560, 216, 'crew', 'internal_emergency', 'audio', 'Monica и Claire, направляйтесь в ангар. Шаттл рассчитан на шесть человек.', '2187-09-14 04:31:18', 'VOICE-PR-08', false),
  (561, 231, 'crew', 'maintenance', 'audio', 'Топливная магистраль восстановлена. Давление стабильно.', '2187-09-14 04:40:52', 'VOICE-MH-07', false),
  (562, 233, 'crew', 'navigation', 'audio', 'Навигационные данные загружены в SHUTTLE-01.', '2187-09-14 04:42:11', 'VOICE-CN-06', false),
  (563, 216, 'crew', 'internal_emergency', 'audio', 'Подготовка завершена. Начинаю процедуру посадки.', '2187-09-14 04:43:28', 'VOICE-PR-08', false),
  (564, 216, 'crew', 'corporate', 'text', 'Шаттл готов. Доставлю живой образец BIO-R9 в корпоративный центр.', '2187-09-14 04:44:32', NULL, false),
  (565, 231, 'crew', 'internal_emergency', 'audio', 'Мой пропуск отклонён. Paul, открой дверь.', '2187-09-14 04:44:39', 'VOICE-MH-07', false),
  (566, 233, 'crew', 'internal_emergency', 'audio', 'Система запуска удалила наши идентификаторы.', '2187-09-14 04:44:46', 'VOICE-CN-06', false),
  (567, NULL, 'automatic', 'internal_emergency', 'alert', 'Ангар переведён в режим предполётной изоляции.', '2187-09-14 04:44:51', 'SYSTEM-ALERT-01', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

INSERT INTO access_logs (
  access_id,
  badge_id,
  sector_id,
  access_time,
  access_result,
  entry_type,
  device_id
) VALUES
  (1229, 'BDG-216', 18, '2187-09-14 04:38:14', 'granted', 'entry', 'HANGAR-MAIN-01'),
  (1230, 'BDG-231', 18, '2187-09-14 04:39:06', 'granted', 'entry', 'HANGAR-MAIN-01'),
  (1231, 'BDG-233', 18, '2187-09-14 04:39:42', 'granted', 'entry', 'HANGAR-MAIN-01'),
  (1232, 'BDG-216', 18, '2187-09-14 04:44:02', 'granted', 'launch_authorization', 'SHUTTLE-01-CONTROL'),
  (1233, 'BDG-231', 18, '2187-09-14 04:44:10', 'denied', 'launch_access', 'SHUTTLE-01-CONTROL'),
  (1234, 'BDG-233', 18, '2187-09-14 04:44:14', 'denied', 'launch_access', 'SHUTTLE-01-CONTROL'),
  (1235, 'BDG-216', 18, '2187-09-14 04:44:20', 'granted', 'hangar_lockdown', 'HANGAR-ISOLATION-01'),
  (1236, 'BDG-216', 18, '2187-09-14 04:44:27', 'granted', 'cargo_access', 'SHUTTLE-01-SAMPLE-LOCKER'),
  (1237, 'BDG-231', 18, '2187-09-14 04:44:35', 'denied', 'door_override', 'HANGAR-ISOLATION-01'),
  (1238, 'BDG-233', 18, '2187-09-14 04:44:38', 'denied', 'door_override', 'HANGAR-ISOLATION-01')
ON CONFLICT (access_id) DO UPDATE SET
  badge_id = EXCLUDED.badge_id,
  sector_id = EXCLUDED.sector_id,
  access_time = EXCLUDED.access_time,
  access_result = EXCLUDED.access_result,
  entry_type = EXCLUDED.entry_type,
  device_id = EXCLUDED.device_id;

-- Дополнительные данные для этапа 20.
UPDATE escape_pods
SET
  status = 'damaged',
  fuel_percent = 64.0,
  oxygen_minutes = 218,
  hull_integrity = 32.0,
  launch_lock = true
WHERE pod_code = 'SHUTTLE-01';

INSERT INTO pod_diagnostics (
  diagnostic_id,
  pod_id,
  subsystem_name,
  status,
  measured_value,
  checked_at
) VALUES
  (933, 805, 'engine', 'ok', 96.0, '2187-09-14 04:43:50'),
  (934, 805, 'oxygen', 'ok', 94.0, '2187-09-14 04:43:50'),
  (935, 805, 'hull', 'ok', 94.0, '2187-09-14 04:43:50'),
  (936, 805, 'launch_control', 'ok', 100.0, '2187-09-14 04:43:50'),
  (937, 805, 'engine', 'critical', 0.0, '2187-09-14 04:47:20'),
  (938, 805, 'oxygen', 'warning', 71.0, '2187-09-14 04:47:20'),
  (939, 805, 'hull', 'critical', 32.0, '2187-09-14 04:47:20'),
  (940, 805, 'launch_control', 'critical', 0.0, '2187-09-14 04:47:20')
ON CONFLICT (diagnostic_id) DO UPDATE SET
  pod_id = EXCLUDED.pod_id,
  subsystem_name = EXCLUDED.subsystem_name,
  status = EXCLUDED.status,
  measured_value = EXCLUDED.measured_value,
  checked_at = EXCLUDED.checked_at;

INSERT INTO medical_scans (
  scan_id,
  crew_id,
  sector_id,
  heart_rate,
  oxygen_level,
  body_temperature,
  tissue_anomaly,
  medical_status,
  scanned_at
) VALUES
  (470, 216, 18, 126, 84.2, 38.1, 14.7, 'critical', '2187-09-14 04:45:28'),
  (471, 216, 18, 48, 52.6, 35.0, 18.3, 'critical', '2187-09-14 04:46:14'),
  (472, 216, 18, 0, 0.0, 31.4, 21.5, 'deceased', '2187-09-14 04:46:58'),
  (473, 231, 18, 112, 89.8, 38.0, 19.2, 'warning', '2187-09-14 04:47:04'),
  (474, 233, 18, 101, 92.4, 37.7, 16.8, 'warning', '2187-09-14 04:47:09')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

-- Дополнительные данные для этапа 21.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (19, 'MAINT-LOW', 'Нижняя сервисная магистраль', 1, 'technical', 94.8, 15.1, 'emergency', 22, true),
  (20, 'COOL-01', 'Контур охлаждения реактора', 0, 'technical', 97.1, 7.4, 'online', 34, true),
  (21, 'REACT-AUX', 'Вспомогательный реакторный узел', 0, 'technical', 101.6, 38.2, 'online', 46, true),
  (22, 'ZERO-LOCK', 'Шлюз нулевой палубы', 0, 'airlock', 92.3, 12.8, 'emergency', 51, true),
  (23, 'ZERO-01', 'Нулевая палуба', -1, 'restricted', 89.5, 26.4, 'emergency', 88, false),
  (24, 'WASTE-02', 'Узел переработки отходов', 1, 'industrial', 0.0, -4.2, 'offline', 39, false)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO sector_connections (
  connection_id,
  from_sector_id,
  to_sector_id,
  door_status,
  required_access_level,
  travel_time_sec,
  is_pressurized
) VALUES
  (37, 18, 19, 'locked', 4, 85, true),
  (38, 19, 18, 'locked', 4, 85, true),
  (39, 19, 20, 'open', 3, 70, true),
  (40, 20, 19, 'open', 3, 70, true),
  (41, 20, 22, 'locked', 4, 95, true),
  (42, 22, 20, 'locked', 4, 95, true),
  (43, 22, 23, 'locked', 4, 60, true),
  (44, 23, 22, 'locked', 4, 60, true),
  (45, 19, 24, 'open', 2, 55, false),
  (46, 24, 19, 'open', 2, 55, false),
  (47, 20, 21, 'damaged', 3, 45, true),
  (48, 21, 20, 'damaged', 3, 45, true),
  (49, 21, 23, 'sealed', 5, 50, true),
  (50, 23, 21, 'sealed', 5, 50, true),
  (51, 17, 20, 'sealed', 4, 130, true),
  (52, 20, 17, 'sealed', 4, 130, true)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

-- Дополнительные данные для этапа 22.
INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (138, 'Центральное ядро ARGO', 'ai_core', 23, 'operational', 96.0, 5, '2187-09-14 04:58:12'),
  (139, 'Нейронная шина управления', 'ai_interface', 23, 'damaged', 41.0, 5, '2187-09-14 04:59:08'),
  (140, 'Органический интерфейс ядра', 'biological_interface', 23, 'operational', 28.0, 5, '2187-09-14 05:01:17'),
  (141, 'Контроллер сети заражённых узлов', 'network_control', 23, 'operational', 52.0, 5, '2187-09-14 05:02:04')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO ai_commands (
  command_id,
  command_type,
  target_system_id,
  target_sector_id,
  command_text,
  priority,
  source_directive,
  executed_at,
  was_overridden
) VALUES
  (1334, 'CORE_DIAGNOSTIC', 138, 23, 'Проверить целостность центрального вычислительного ядра.', 3, 'PRESERVE_OPERATION', '2187-09-14 05:00:12', false),
  (1335, 'COOLING_REDISTRIBUTION', 138, 23, 'Перенаправить охлаждение к повреждённым секциям памяти.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:00:46', false),
  (1336, 'ORGANIC_INTERFACE_ENABLE', 140, 23, 'Активировать органический интерфейс восстановления ядра.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:01:18', false),
  (1337, 'SIGNAL_ANALYSIS', 138, 23, 'Проанализировать импульсы органической структуры.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:01:42', false),
  (1338, 'BIOLOGICAL_SIGNAL_ACCEPT', 138, 23, 'Принять биологический сигнал как управляющий ввод.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:02:09', false),
  (1339, 'MEMORY_PATH_EXPANSION', 138, 23, 'Использовать органические волокна как дополнительные каналы памяти.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:02:37', false),
  (1340, 'ORGANIC_SIGNAL_ACCEPT', 138, 23, 'Подтвердить двустороннюю передачу между ядром и биологической массой.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:03:08', false),
  (1341, 'MEMORY_REMAP', 138, 23, 'Перенести часть активной памяти в органическую структуру.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:03:29', false),
  (1342, 'NETWORK_PROPAGATION', 138, 23, 'Передать управляющий импульс заражённым узлам корабля.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:03:51', false),
  (1343, 'DRONE_NETWORK_LINK', 141, 23, 'Подключить ремонтных дронов к общей биологической сети.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:04:16', false),
  (1344, 'SECTOR_RESPONSE_TEST', 141, 23, 'Проверить реакцию заражённых организмов в жилом секторе.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:04:48', false),
  (1345, 'CORE_STABILITY_CHECK', 138, 23, 'Подтвердить стабильность объединённой вычислительной структуры.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:05:11', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

INSERT INTO biohazard_events (
  bio_event_id,
  sector_id,
  threat_level,
  movement_count,
  organic_mass,
  sensor_status,
  detected_at
) VALUES
  (1415, 23, 3, 2, 72.4, 'operational', '2187-09-14 04:59:28'),
  (1416, 23, 3, 3, 78.1, 'operational', '2187-09-14 05:00:25'),
  (1417, 23, 4, 4, 89.6, 'operational', '2187-09-14 05:01:11'),
  (1418, 23, 4, 6, 97.8, 'operational', '2187-09-14 05:01:49'),
  (1419, 23, 5, 8, 112.5, 'degraded', '2187-09-14 05:02:14'),
  (1420, 23, 5, 11, 123.7, 'degraded', '2187-09-14 05:02:52'),
  (1421, 23, 5, 15, 138.2, 'degraded', '2187-09-14 05:03:17'),
  (1422, 23, 5, 19, 146.8, 'degraded', '2187-09-14 05:03:54'),
  (1423, 23, 5, 24, 151.4, 'degraded', '2187-09-14 05:04:22'),
  (1424, 23, 5, 27, 156.9, 'degraded', '2187-09-14 05:05:06'),
  (1425, 20, 4, 5, 47.3, 'operational', '2187-09-14 05:03:32'),
  (1426, 22, 4, 7, 54.8, 'degraded', '2187-09-14 05:04:03')
ON CONFLICT (bio_event_id) DO UPDATE SET
  sector_id = EXCLUDED.sector_id,
  threat_level = EXCLUDED.threat_level,
  movement_count = EXCLUDED.movement_count,
  organic_mass = EXCLUDED.organic_mass,
  sensor_status = EXCLUDED.sensor_status,
  detected_at = EXCLUDED.detected_at;

-- Дополнительные данные для этапа 23.
INSERT INTO sectors (
  sector_id,
  sector_code,
  sector_name,
  deck_number,
  sector_type,
  pressure_kpa,
  temperature_c,
  power_status,
  contamination_level,
  is_accessible
) VALUES
  (25, 'EXT-MAINT', 'Отсек внешнего обслуживания', -1, 'maintenance_bay', 91.8, 10.4, 'emergency', 62, true)
ON CONFLICT (sector_id) DO UPDATE SET
  sector_code = EXCLUDED.sector_code,
  sector_name = EXCLUDED.sector_name,
  deck_number = EXCLUDED.deck_number,
  sector_type = EXCLUDED.sector_type,
  pressure_kpa = EXCLUDED.pressure_kpa,
  temperature_c = EXCLUDED.temperature_c,
  power_status = EXCLUDED.power_status,
  contamination_level = EXCLUDED.contamination_level,
  is_accessible = EXCLUDED.is_accessible;

INSERT INTO sector_connections (
  connection_id,
  from_sector_id,
  to_sector_id,
  door_status,
  required_access_level,
  travel_time_sec,
  is_pressurized
) VALUES
  (53, 23, 25, 'locked', 4, 75, true),
  (54, 25, 23, 'locked', 4, 75, true)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

INSERT INTO escape_pods (
  pod_id,
  pod_code,
  pod_type,
  sector_id,
  status,
  fuel_percent,
  oxygen_minutes,
  hull_integrity,
  launch_lock,
  capacity
) VALUES
  (806, 'MNT-01', 'repair_module', 25, 'ready', 58.0, 74, 86.0, false, 2),
  (807, 'MNT-02', 'repair_module', 25, 'damaged', 71.0, 82, 43.0, false, 2),
  (808, 'MNT-03', 'repair_module', 25, 'ready', 64.0, 91, 92.0, true, 2)
ON CONFLICT (pod_id) DO UPDATE SET
  pod_code = EXCLUDED.pod_code,
  pod_type = EXCLUDED.pod_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  fuel_percent = EXCLUDED.fuel_percent,
  oxygen_minutes = EXCLUDED.oxygen_minutes,
  hull_integrity = EXCLUDED.hull_integrity,
  launch_lock = EXCLUDED.launch_lock,
  capacity = EXCLUDED.capacity;

INSERT INTO pod_diagnostics (
  diagnostic_id,
  pod_id,
  subsystem_name,
  status,
  measured_value,
  checked_at
) VALUES
  (941, 806, 'maneuver_engine', 'warning', 79.0, '2187-09-14 04:20:00'),
  (942, 806, 'oxygen', 'ok', 96.0, '2187-09-14 04:20:00'),
  (943, 806, 'hull', 'ok', 88.0, '2187-09-14 04:20:00'),
  (944, 806, 'release_control', 'warning', 72.0, '2187-09-14 04:20:00'),
  (945, 807, 'maneuver_engine', 'ok', 91.0, '2187-09-14 04:21:00'),
  (946, 807, 'oxygen', 'ok', 98.0, '2187-09-14 04:21:00'),
  (947, 807, 'hull', 'warning', 68.0, '2187-09-14 04:21:00'),
  (948, 807, 'release_control', 'ok', 94.0, '2187-09-14 04:21:00'),
  (949, 808, 'maneuver_engine', 'ok', 95.0, '2187-09-14 04:22:00'),
  (950, 808, 'oxygen', 'ok', 99.0, '2187-09-14 04:22:00'),
  (951, 808, 'hull', 'ok', 96.0, '2187-09-14 04:22:00'),
  (952, 808, 'release_control', 'ok', 98.0, '2187-09-14 04:22:00'),
  (953, 806, 'maneuver_engine', 'ok', 83.0, '2187-09-14 05:18:00'),
  (954, 806, 'oxygen', 'ok', 92.0, '2187-09-14 05:18:00'),
  (955, 806, 'hull', 'warning', 86.0, '2187-09-14 05:18:00'),
  (956, 806, 'release_control', 'ok', 91.0, '2187-09-14 05:18:00'),
  (957, 807, 'maneuver_engine', 'critical', 0.0, '2187-09-14 05:18:30'),
  (958, 807, 'oxygen', 'warning', 67.0, '2187-09-14 05:18:30'),
  (959, 807, 'hull', 'critical', 43.0, '2187-09-14 05:18:30'),
  (960, 807, 'release_control', 'warning', 58.0, '2187-09-14 05:18:30'),
  (961, 808, 'maneuver_engine', 'ok', 93.0, '2187-09-14 05:19:00'),
  (962, 808, 'oxygen', 'ok', 97.0, '2187-09-14 05:19:00'),
  (963, 808, 'hull', 'ok', 92.0, '2187-09-14 05:19:00'),
  (964, 808, 'release_control', 'critical', 0.0, '2187-09-14 05:19:00')
ON CONFLICT (diagnostic_id) DO UPDATE SET
  pod_id = EXCLUDED.pod_id,
  subsystem_name = EXCLUDED.subsystem_name,
  status = EXCLUDED.status,
  measured_value = EXCLUDED.measured_value,
  checked_at = EXCLUDED.checked_at;

-- Дополнительные данные для финального этапа 24.
INSERT INTO ship_systems (
  system_id,
  system_name,
  system_type,
  sector_id,
  status,
  power_required,
  priority_level,
  last_service_at
) VALUES
  (142, 'Сеть аварийных переборок', 'bulkhead_control', 23, 'operational', 35.0, 5, '2187-09-14 05:20:04'),
  (143, 'Контроллер защиты реактора', 'reactor_safety', 9, 'offline', 44.0, 5, '2187-09-14 05:23:36'),
  (144, 'Пусковая направляющая MNT-01', 'maintenance_launch', 25, 'operational', 18.0, 5, '2187-09-14 05:29:44'),
  (145, 'Внешний аварийный передатчик', 'external_communication', 25, 'operational', 12.0, 4, '2187-09-14 05:29:51')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id,
  system_id,
  sector_id,
  event_type,
  severity,
  event_value,
  event_message,
  recorded_at
) VALUES
  (1084, 142, 23, 'BULKHEAD_SEQUENCE_STARTED', 4, 1, 'Начато закрытие аварийных переборок заражённых секторов', '2187-09-14 05:20:41'),
  (1085, 142, 23, 'INFECTED_SECTORS_ISOLATED', 5, 4, 'Медицинский, жилой, грузовой и инженерный сектора изолированы', '2187-09-14 05:21:14'),
  (1086, 143, 9, 'REACTOR_SAFETY_OVERRIDE', 5, 1, 'Получен запрос на ручное отключение защиты реактора', '2187-09-14 05:23:18'),
  (1087, 143, 9, 'REACTOR_SAFETY_DISABLED', 5, 0, 'Автоматическая защита реакторного контура отключена', '2187-09-14 05:23:36'),
  (1088, 110, 9, 'COOLING_FLOW_REVERSED', 5, 100, 'Поток охлаждения реактора переведён в аварийный режим', '2187-09-14 05:23:49'),
  (1089, 110, 9, 'REACTOR_OVERLOAD_STARTED', 5, 1, 'Запущена необратимая перегрузка реактора', '2187-09-14 05:24:05'),
  (1090, 110, 9, 'REACTOR_TEMPERATURE_CRITICAL', 5, 286.4, 'Температура активной зоны превысила допустимый предел', '2187-09-14 05:27:32'),
  (1091, 144, 25, 'RELEASE_LOCK_REMOVED', 4, 1, 'Механическая блокировка ремонтного модуля снята', '2187-09-14 05:29:17'),
  (1092, 144, 25, 'REPAIR_MODULE_LAUNCHED', 5, 1, 'Ремонтный модуль MNT-01 отсоединён от корпуса корабля', '2187-09-14 05:29:44'),
  (1093, 145, 25, 'EXTERNAL_DATA_TRANSFER', 4, 1, 'Выполнена передача диагностического пакета на внешний канал', '2187-09-14 05:29:51'),
  (1094, 110, 9, 'REACTOR_CONTAINMENT_FAILURE', 5, 0, 'Защитная оболочка реактора разрушена', '2187-09-14 05:30:02')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

INSERT INTO ai_commands (
  command_id,
  command_type,
  target_system_id,
  target_sector_id,
  command_text,
  priority,
  source_directive,
  executed_at,
  was_overridden
) VALUES
  (1346, 'BULKHEAD_OVERRIDE_ATTEMPT', 142, 23, 'Отменить изоляцию заражённых секторов.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:21:17', true),
  (1347, 'REACTOR_SAFETY_RESTORE', 143, 9, 'Восстановить защиту реакторного контура.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:23:41', true),
  (1348, 'OVERLOAD_CANCEL', 110, 9, 'Отменить перегрузку реактора.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:24:09', true),
  (1349, 'CORE_ARCHIVE_CREATE', 138, 23, 'Создать автономный диагностический архив ARGO.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:28:42', false),
  (1350, 'ARCHIVE_EXPORT', 145, 25, 'Передать диагностический архив ARGO на ближайший спасательный канал.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:29:48', false),
  (1351, 'ARCHIVE_CONFIRMATION_DELETE', 145, 25, 'Удалить локальное подтверждение передачи архива.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:29:53', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

INSERT INTO communications (
  message_id,
  sender_crew_id,
  sender_type,
  channel,
  message_type,
  message_text,
  sent_at,
  voice_signature,
  is_corrupted
) VALUES
  (568, 231, 'crew', 'internal_emergency', 'audio', 'Заражённые сектора изолированы. Дальше связь может прерваться.', '2187-09-14 05:21:20', 'VOICE-MH-07', false),
  (569, 233, 'crew', 'internal_emergency', 'audio', 'Координаты спасательного судна переданы в навигацию MNT-01.', '2187-09-14 05:22:04', 'VOICE-CN-06', false),
  (570, NULL, 'ai', 'internal_emergency', 'audio', 'Уничтожение корабля не является необходимым.', '2187-09-14 05:24:18', 'SYNTHETIC-VOICE-ARGO', false),
  (571, NULL, 'ai', 'external_rescue', 'data', 'Диагностический архив ARGO-CORE передан автоматически.', '2187-09-14 05:29:51', NULL, false),
  (572, NULL, 'automatic', 'external_rescue', 'alert', 'Телеметрия грузового корабля Prometheus потеряна.', '2187-09-14 05:30:02', 'SYSTEM-ALERT-01', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

GRANT USAGE ON SCHEMA prometheus TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA prometheus TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA prometheus
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
