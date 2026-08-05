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
  badge_id     varchar(40) NOT NULL REFERENCES crew_members(badge_id),
  sector_id    integer NOT NULL REFERENCES sectors(sector_id),
  access_time  timestamp NOT NULL,
  access_result varchar(16) NOT NULL
                CHECK (access_result IN ('granted', 'denied')),
  entry_type   varchar(8) NOT NULL CHECK (entry_type IN ('entry', 'exit')),
  device_id    varchar(40) NOT NULL
);

CREATE TABLE IF NOT EXISTS communications (
  message_id       integer PRIMARY KEY,
  sender_crew_id   integer REFERENCES crew_members(crew_id),
  sender_type      varchar(16) NOT NULL
                   CHECK (sender_type IN ('crew', 'ai', 'automatic')),
  channel          varchar(40) NOT NULL,
  message_type     varchar(16) NOT NULL
                   CHECK (message_type IN ('text', 'audio', 'alarm', 'alert')),
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
  CHECK (message_type IN ('text', 'audio', 'alarm', 'alert'));

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
                  CHECK (pod_type IN ('pod', 'shuttle', 'repair_module')),
  sector_id       integer NOT NULL REFERENCES sectors(sector_id),
  status          varchar(16) NOT NULL
                  CHECK (status IN ('ready', 'damaged', 'launched')),
  fuel_percent    numeric(5,2) NOT NULL CHECK (fuel_percent BETWEEN 0 AND 100),
  oxygen_minutes  integer NOT NULL CHECK (oxygen_minutes >= 0),
  hull_integrity  numeric(5,2) NOT NULL CHECK (hull_integrity BETWEEN 0 AND 100),
  launch_lock     boolean NOT NULL DEFAULT false,
  capacity        integer NOT NULL CHECK (capacity > 0)
);

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

GRANT USAGE ON SCHEMA prometheus TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA prometheus TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA prometheus
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
