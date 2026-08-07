-- =============================================================
-- «Прометей · Новичок» — отдельная песочница учебной версии истории.
-- Изоляция нужна, чтобы события поздних уроков основной версии квеста
-- не меняли ответ простого запроса новичка.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS prometheus_beginner;
SET search_path TO prometheus_beginner;

CREATE TABLE IF NOT EXISTS system_events (
  event_id      integer PRIMARY KEY,
  system_id     integer NOT NULL,
  sector_id     integer NOT NULL,
  event_type    varchar(40) NOT NULL,
  severity      integer NOT NULL CHECK (severity >= 0),
  event_value   numeric(14,4),
  event_message text NOT NULL,
  recorded_at   timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS system_events_sector_severity_time_idx
  ON system_events(sector_id, severity, recorded_at DESC);

CREATE TABLE IF NOT EXISTS crew_members (
  crew_id          integer PRIMARY KEY,
  full_name        varchar(120) NOT NULL,
  role             varchar(120) NOT NULL,
  department       varchar(80) NOT NULL,
  badge_id         varchar(32) NOT NULL UNIQUE,
  access_level     integer NOT NULL CHECK (access_level >= 0),
  official_status  varchar(16) NOT NULL
                   CHECK (official_status IN ('alive', 'missing', 'deceased')),
  cabin_sector_id  integer NOT NULL
);

CREATE INDEX IF NOT EXISTS crew_members_cabin_status_idx
  ON crew_members(cabin_sector_id, official_status);

CREATE TABLE IF NOT EXISTS medical_scans (
  scan_id           integer PRIMARY KEY,
  crew_id           integer NOT NULL REFERENCES crew_members(crew_id),
  sector_id         integer NOT NULL,
  heart_rate        integer NOT NULL CHECK (heart_rate >= 0),
  oxygen_level      numeric(5,1) NOT NULL CHECK (oxygen_level >= 0),
  body_temperature  numeric(5,1) NOT NULL,
  tissue_anomaly    numeric(5,1) NOT NULL CHECK (tissue_anomaly >= 0),
  medical_status    varchar(20) NOT NULL
                    CHECK (medical_status IN ('stable', 'warning', 'critical', 'deceased', 'unknown')),
  scanned_at        timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS medical_scans_crew_time_idx
  ON medical_scans(crew_id, scanned_at);

INSERT INTO system_events (
  event_id, system_id, sector_id, event_type, severity,
  event_value, event_message, recorded_at
) VALUES
  (1001, 101, 1, 'SYSTEM_CHECK', 1, 1, 'Проверка системы фиксации завершена', '2187-09-14 03:14:12'),
  (1002, 102, 1, 'PRESSURE_CHECK', 1, 101.2, 'Давление в шлюзе соответствует норме', '2187-09-14 03:14:48'),
  (1003, 103, 1, 'DOOR_OPEN', 2, 1, 'Внутренняя дверь стыковочного шлюза открыта', '2187-09-14 03:15:21'),
  (1004, 101, 1, 'SHUTTLE_DETECTED', 1, 1, 'Обнаружен входящий челнок', '2187-09-14 03:15:46'),
  (1005, 101, 1, 'DOCKING_STARTED', 2, 1, 'Начата автоматическая процедура стыковки', '2187-09-14 03:16:08'),
  (1006, 101, 1, 'CLAMP_ENGAGED', 2, 4, 'Стыковочные фиксаторы активированы', '2187-09-14 03:16:54'),
  (1007, 102, 1, 'PRESSURE_STABLE', 1, 101.0, 'Давление между кораблём и челноком выровнено', '2187-09-14 03:17:11'),
  (1008, 101, 1, 'DOCKING_COMPLETE', 2, 1, 'Стыковка успешно завершена', '2187-09-14 03:17:26'),
  (1009, 104, 2, 'POWER_WARNING', 3, 42, 'Зафиксировано падение мощности технического сектора', '2187-09-14 03:17:51'),
  (1010, 101, 1, 'CONTROL_OVERRIDE', 4, 1, 'Получена внешняя команда управления фиксаторами', '2187-09-14 03:18:17'),
  (1011, 103, 1, 'DOOR_LOCK', 3, 1, 'Стыковочный шлюз переведён в защищённый режим', '2187-09-14 03:18:29'),
  (1012, 101, 1, 'AUTOMATIC_LOCK', 5, 1, 'Система фиксации челнока заблокирована автоматической командой', '2187-09-14 03:18:42'),
  (1013, 105, 3, 'SENSOR_ERROR', 2, 0, 'Потеря сигнала датчика коридора', '2187-09-14 03:18:57'),
  (1014, 104, 2, 'POWER_FAILURE', 4, 0, 'Основная линия питания отключена', '2187-09-14 03:19:12'),
  (1023, 107, 4, 'VOLTAGE_CHECK', 1, 100, 'Напряжение основной линии соответствует норме', '2187-09-14 03:18:32'),
  (1024, 107, 4, 'LOAD_CHANGE', 2, 74, 'Зафиксировано увеличение нагрузки основной энергомагистрали', '2187-09-14 03:18:51'),
  (1025, 108, 4, 'COOLING_CHECK', 1, 91, 'Система охлаждения силового узла работает нормально', '2187-09-14 03:19:04'),
  (1026, 107, 4, 'POWER_BUS_WARNING', 3, 61, 'Обнаружено нестандартное изменение нагрузки', '2187-09-14 03:19:17'),
  (1027, 107, 4, 'MANUAL_SHUTDOWN', 5, 0, 'Основная энергомагистраль отключена ручной командой', '2187-09-14 03:19:34'),
  (1028, 107, 4, 'MAIN_BUS_OFFLINE', 5, 0, 'Главная линия питания полностью отключена', '2187-09-14 03:19:39'),
  (1029, 109, 4, 'BATTERY_CHECK', 2, 82, 'Аварийные аккумуляторы готовы к подключению', '2187-09-14 03:19:42'),
  (1030, 109, 4, 'EMERGENCY_POWER', 4, 1, 'Аварийная линия питания автоматически активирована', '2187-09-14 03:19:46'),
  (1031, 109, 4, 'EMERGENCY_LOAD', 2, 38, 'Второстепенные системы отключены для снижения нагрузки', '2187-09-14 03:19:52'),
  (1032, 108, 4, 'COOLING_REDUCED', 2, 55, 'Контур охлаждения переведён в экономичный режим', '2187-09-14 03:20:11'),
  (1033, 107, 4, 'AUTO_RESTART_FAILED', 4, 0, 'Автоматический перезапуск основной линии запрещён', '2187-09-14 03:20:28'),
  (1034, 110, 9, 'REACTOR_OUTPUT_STABLE', 1, 87, 'Выходная мощность реактора находится в норме', '2187-09-14 03:20:41')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

INSERT INTO crew_members (
  crew_id, full_name, role, department, badge_id,
  access_level, official_status, cabin_sector_id
) VALUES
  (201, 'Emily Carter', 'Навигатор', 'Navigation', 'BDG-201', 3, 'missing', 5),
  (202, 'Daniel Brooks', 'Оператор грузового комплекса', 'Cargo', 'BDG-202', 2, 'missing', 5),
  (203, 'Jason Miller', 'Техник', 'Engineering', 'BDG-203', 2, 'missing', 5),
  (204, 'Rachel Morgan', 'Медицинский техник', 'Medical', 'BDG-204', 2, 'missing', 5),
  (205, 'Marcus Hayes', 'Офицер безопасности', 'Security', 'BDG-205', 3, 'missing', 5),
  (206, 'Olivia Bennett', 'Оператор связи', 'Communications', 'BDG-206', 2, 'missing', 5),
  (207, 'Kevin Turner', 'Инженер', 'Engineering', 'BDG-207', 3, 'alive', 11),
  (208, 'Sarah Mitchell', 'Врач', 'Medical', 'BDG-208', 4, 'alive', 11),
  (209, 'Nathan Cooper', 'Кладовщик', 'Cargo', 'BDG-209', 2, 'missing', 11),
  (210, 'Jessica Ward', 'Специалист по логистике', 'Cargo', 'BDG-210', 2, 'alive', 11),
  (211, 'Brian Foster', 'Охранник', 'Security', 'BDG-211', 2, 'missing', 11),
  (212, 'Anthony Reed', 'Старший инженер', 'Engineering', 'BDG-212', 4, 'deceased', 12),
  (213, 'Laura Chen', 'Биолог', 'Science', 'BDG-213', 4, 'missing', 12),
  (214, 'Robert Mason', 'Начальник грузовой смены', 'Cargo', 'BDG-214', 3, 'deceased', 12),
  (215, 'Emma Ross', 'Хирург', 'Medical', 'BDG-215', 4, 'missing', 12),
  (216, 'Paul Reed', 'Инженер-механик', 'Engineering', 'BDG-216', 4, 'alive', 11),
  (217, 'Michael Kane', 'Техник реактора', 'Engineering', 'BDG-217', 4, 'missing', 11),
  (218, 'Sophie Brown', 'Оператор дронов', 'Engineering', 'BDG-218', 3, 'missing', 11)
ON CONFLICT (crew_id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  role = EXCLUDED.role,
  department = EXCLUDED.department,
  badge_id = EXCLUDED.badge_id,
  access_level = EXCLUDED.access_level,
  official_status = EXCLUDED.official_status,
  cabin_sector_id = EXCLUDED.cabin_sector_id;

INSERT INTO medical_scans (
  scan_id, crew_id, sector_id, heart_rate, oxygen_level,
  body_temperature, tissue_anomaly, medical_status, scanned_at
) VALUES
  (401, 201, 5, 91, 96.4, 37.2, 3.1, 'stable', '2187-09-14 03:21:14'),
  (402, 202, 5, 88, 97.0, 36.9, 2.4, 'stable', '2187-09-14 03:21:47'),
  (403, 204, 5, 102, 94.1, 37.8, 8.7, 'warning', '2187-09-14 03:22:10'),
  (404, 205, 5, 96, 95.2, 37.5, 5.2, 'stable', '2187-09-14 03:22:31'),
  (405, 206, 5, 99, 95.8, 37.6, 4.9, 'stable', '2187-09-14 03:22:54'),
  (406, 203, 5, 112, 92.4, 38.1, 11.6, 'warning', '2187-09-14 03:23:12'),
  (407, 203, 5, 124, 87.1, 38.8, 22.3, 'warning', '2187-09-14 03:25:46'),
  (408, 203, 5, 137, 78.6, 39.4, 38.5, 'critical', '2187-09-14 03:28:19'),
  (409, 203, 5, 148, 66.3, 40.1, 51.8, 'critical', '2187-09-14 03:31:02'),
  (410, 203, 5, 156, 51.2, 40.8, 64.9, 'critical', '2187-09-14 03:33:41'),
  (411, 203, 5, 131, 37.8, 41.4, 73.6, 'critical', '2187-09-14 03:35:15'),
  (412, 203, 5, 104, 24.6, 41.9, 81.7, 'critical', '2187-09-14 03:37:02'),
  (413, 203, 5, 72, 13.1, 42.3, 88.9, 'critical', '2187-09-14 03:39:26'),
  (414, 203, 5, 31, 4.8, 42.7, 93.2, 'critical', '2187-09-14 03:41:18'),
  (415, 203, 5, 0, 0.0, 42.9, 95.4, 'deceased', '2187-09-14 03:42:07'),
  (416, 203, 5, 0, 0.0, 43.1, 96.1, 'unknown', '2187-09-14 03:43:42'),
  (417, 203, 5, 0, 0.0, 43.2, 96.5, 'unknown', '2187-09-14 03:44:55'),
  (418, 203, 5, 0, 0.0, 43.4, 96.7, 'unknown', '2187-09-14 03:46:00'),
  (419, 209, 11, 86, 96.1, 37.0, 3.8, 'stable', '2187-09-14 03:22:05'),
  (420, 211, 11, 93, 95.7, 37.3, 4.1, 'stable', '2187-09-14 03:22:42'),
  (421, 217, 11, 89, 96.8, 36.8, 2.7, 'stable', '2187-09-14 03:23:01'),
  (422, 218, 11, 92, 96.0, 37.1, 3.4, 'stable', '2187-09-14 03:23:18')
ON CONFLICT (scan_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  heart_rate = EXCLUDED.heart_rate,
  oxygen_level = EXCLUDED.oxygen_level,
  body_temperature = EXCLUDED.body_temperature,
  tissue_anomaly = EXCLUDED.tissue_anomaly,
  medical_status = EXCLUDED.medical_status,
  scanned_at = EXCLUDED.scanned_at;

GRANT USAGE ON SCHEMA prometheus_beginner TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA prometheus_beginner TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA prometheus_beginner
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
