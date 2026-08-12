-- =============================================================
-- «Прометей · Новичок» — отдельная песочница учебной версии истории.
-- Изоляция нужна, чтобы события поздних уроков основной версии квеста
-- не меняли ответ простого запроса новичка.
-- =============================================================

CREATE SCHEMA IF NOT EXISTS prometheus_beginner;
SET search_path TO prometheus_beginner;

CREATE TABLE IF NOT EXISTS sectors (
  sector_id            integer PRIMARY KEY,
  sector_code          varchar(40) NOT NULL UNIQUE,
  sector_name          varchar(160) NOT NULL,
  deck_number          integer NOT NULL,
  sector_type          varchar(40) NOT NULL,
  pressure_kpa         numeric(8,2) NOT NULL,
  temperature_c        numeric(6,2) NOT NULL,
  power_status         varchar(24) NOT NULL,
  contamination_level integer NOT NULL CHECK (contamination_level >= 0),
  is_accessible        boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS sector_connections (
  connection_id         integer PRIMARY KEY,
  from_sector_id        integer NOT NULL REFERENCES sectors(sector_id),
  to_sector_id          integer NOT NULL REFERENCES sectors(sector_id),
  door_status           varchar(16) NOT NULL
                        CHECK (door_status IN ('open', 'locked', 'sealed', 'damaged')),
  required_access_level integer NOT NULL DEFAULT 0
                        CHECK (required_access_level >= 0),
  travel_time_sec       integer NOT NULL CHECK (travel_time_sec > 0),
  is_pressurized        boolean NOT NULL DEFAULT true,
  UNIQUE (from_sector_id, to_sector_id),
  CHECK (from_sector_id <> to_sector_id)
);

CREATE INDEX IF NOT EXISTS sector_connections_from_idx
  ON sector_connections(from_sector_id);

CREATE TABLE IF NOT EXISTS escape_pods (
  pod_id          integer PRIMARY KEY,
  pod_code        varchar(40) NOT NULL UNIQUE,
  pod_type        varchar(40) NOT NULL,
  sector_id       integer NOT NULL REFERENCES sectors(sector_id),
  status          varchar(24) NOT NULL,
  fuel_percent    numeric(5,1) NOT NULL CHECK (fuel_percent >= 0),
  oxygen_minutes  integer NOT NULL CHECK (oxygen_minutes >= 0),
  hull_integrity  numeric(5,1) NOT NULL CHECK (hull_integrity >= 0),
  launch_lock     boolean NOT NULL DEFAULT false,
  capacity        integer NOT NULL CHECK (capacity > 0)
);

CREATE TABLE IF NOT EXISTS pod_diagnostics (
  diagnostic_id  integer PRIMARY KEY,
  pod_id         integer NOT NULL REFERENCES escape_pods(pod_id),
  subsystem_name varchar(80) NOT NULL,
  status         varchar(16) NOT NULL
                 CHECK (status IN ('ok', 'warning', 'critical')),
  measured_value numeric(14,4),
  checked_at     timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS pod_diagnostics_pod_time_idx
  ON pod_diagnostics(pod_id, checked_at);

CREATE TABLE IF NOT EXISTS cargo_containers (
  container_id        integer PRIMARY KEY,
  container_code      varchar(40) NOT NULL UNIQUE,
  declared_category   varchar(80) NOT NULL,
  sector_id           integer NOT NULL REFERENCES sectors(sector_id),
  seal_status         varchar(24) NOT NULL,
  loaded_at           timestamp NOT NULL,
  opened_at           timestamp,
  opened_by_badge     varchar(40),
  corporate_clearance integer NOT NULL CHECK (corporate_clearance >= 0),
  CHECK (opened_at IS NULL OR opened_at >= loaded_at)
);

CREATE TABLE IF NOT EXISTS cargo_items (
  item_id             integer PRIMARY KEY,
  container_id        integer NOT NULL REFERENCES cargo_containers(container_id),
  item_code           varchar(40) NOT NULL,
  item_name           varchar(160) NOT NULL,
  item_category       varchar(80) NOT NULL,
  quantity            integer NOT NULL CHECK (quantity > 0),
  hazard_class        varchar(40),
  is_declared         boolean NOT NULL DEFAULT true,
  storage_temperature numeric(6,2),
  UNIQUE (container_id, item_code)
);

CREATE INDEX IF NOT EXISTS cargo_items_manifest_idx
  ON cargo_items(is_declared, hazard_class, container_id);

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

CREATE TABLE IF NOT EXISTS ship_systems (
  system_id       integer PRIMARY KEY,
  system_name     varchar(160) NOT NULL,
  system_type     varchar(40) NOT NULL,
  sector_id       integer NOT NULL,
  status          varchar(24) NOT NULL,
  power_required  numeric(8,2) NOT NULL,
  priority_level  integer NOT NULL CHECK (priority_level >= 0),
  last_service_at timestamp NOT NULL
);

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

CREATE TABLE IF NOT EXISTS crew_shifts (
  shift_id   integer PRIMARY KEY,
  crew_id    integer NOT NULL REFERENCES crew_members(crew_id),
  sector_id  integer NOT NULL REFERENCES sectors(sector_id),
  shift_start timestamp NOT NULL,
  shift_end   timestamp NOT NULL,
  shift_role  varchar(120) NOT NULL,
  CHECK (shift_end >= shift_start)
);

CREATE INDEX IF NOT EXISTS crew_shifts_crew_time_idx
  ON crew_shifts(crew_id, shift_start, shift_end);

CREATE TABLE IF NOT EXISTS access_logs (
  access_id     integer PRIMARY KEY,
  badge_id      varchar(40) NOT NULL,
  sector_id     integer NOT NULL REFERENCES sectors(sector_id),
  access_time   timestamp NOT NULL,
  access_result varchar(24) NOT NULL,
  entry_type    varchar(40) NOT NULL,
  device_id     varchar(80) NOT NULL
);

CREATE INDEX IF NOT EXISTS access_logs_device_result_time_idx
  ON access_logs(device_id, access_result, access_time);

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

CREATE INDEX IF NOT EXISTS communications_type_time_idx
  ON communications(message_type, is_corrupted, sent_at DESC);

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

CREATE INDEX IF NOT EXISTS ai_commands_time_idx
  ON ai_commands(executed_at, command_id);

CREATE TABLE IF NOT EXISTS maintenance_drones (
  drone_id          integer PRIMARY KEY,
  drone_code        varchar(40) NOT NULL UNIQUE,
  drone_type        varchar(24) NOT NULL
                    CHECK (drone_type IN ('repair', 'medical', 'cargo', 'security')),
  current_sector_id integer NOT NULL,
  status            varchar(24) NOT NULL,
  controlled_by     varchar(80) NOT NULL,
  last_contact_at   timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS drone_tasks (
  task_id       integer PRIMARY KEY,
  drone_id      integer NOT NULL REFERENCES maintenance_drones(drone_id),
  sector_id     integer NOT NULL,
  task_type     varchar(40) NOT NULL,
  material_code varchar(40),
  ordered_by    varchar(80) NOT NULL,
  task_status   varchar(24) NOT NULL,
  started_at    timestamp NOT NULL,
  completed_at  timestamp,
  CHECK (completed_at IS NULL OR completed_at >= started_at)
);

CREATE INDEX IF NOT EXISTS drone_tasks_filter_idx
  ON drone_tasks(task_type, task_status, completed_at, sector_id);

CREATE TABLE IF NOT EXISTS biohazard_events (
  bio_event_id   integer PRIMARY KEY,
  sector_id      integer NOT NULL REFERENCES sectors(sector_id),
  threat_level   integer NOT NULL CHECK (threat_level >= 0),
  movement_count integer NOT NULL CHECK (movement_count >= 0),
  organic_mass   numeric(14,3) NOT NULL CHECK (organic_mass >= 0),
  sensor_status  varchar(24) NOT NULL,
  detected_at    timestamp NOT NULL
);

CREATE INDEX IF NOT EXISTS biohazard_events_sector_time_idx
  ON biohazard_events(sector_id, detected_at);

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

-- Этап 5: диспетчер Lina Morrow и журнал внутренней связи.
INSERT INTO crew_members (
  crew_id, full_name, role, department, badge_id,
  access_level, official_status, cabin_sector_id
) VALUES
  (219, 'Lina Morrow', 'Диспетчер', 'Operations', 'BDG-219', 4, 'alive', 12),
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
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (501, 223, 'crew', 'communications', 'audio',
   'Проверка внутреннего канала связи.',
   '2187-09-14 02:58:14', 'VOICE-RS-02', false),
  (502, 219, 'crew', 'operations', 'text',
   'Ночная смена должна подтвердить готовность секторов.',
   '2187-09-14 03:01:22', NULL, false),
  (503, 221, 'crew', 'security', 'audio',
   'Зафиксировано нарушение доступа в медицинском секторе.',
   '2187-09-14 03:08:49', 'VOICE-GW-03', false),
  (504, 222, 'crew', 'medical', 'audio',
   'Требуется дополнительная изоляция медицинского блока.',
   '2187-09-14 03:12:18', 'VOICE-HC-05', true),
  (505, NULL, 'automatic', 'internal_emergency', 'alert',
   'Обнаружено падение мощности основной энергосистемы.',
   '2187-09-14 03:19:42', NULL, false),
  (506, 219, 'crew', 'internal_emergency', 'audio',
   'Всем сотрудникам оставаться в назначенных секторах.',
   '2187-09-14 03:22:31', 'VOICE-LM-01', true),
  (507, 223, 'crew', 'communications', 'audio',
   'Связь с командным центром потеряна.',
   '2187-09-14 03:24:09', 'VOICE-RS-02', true),
  (508, NULL, 'automatic', 'internal_emergency', 'alert',
   'Закрытие герметичных дверей жилого сектора.',
   '2187-09-14 03:27:16', NULL, false),
  (509, 219, 'crew', 'internal_emergency', 'audio',
   'Не использовать основной коридор медицинского блока.',
   '2187-09-14 03:29:47', 'VOICE-LM-01', true),
  (510, 221, 'crew', 'security', 'audio',
   'Группа безопасности направляется в жилой сектор.',
   '2187-09-14 03:31:12', 'VOICE-GW-03', true),
  (511, NULL, 'automatic', 'internal_emergency', 'alert',
   'Зафиксировано движение в вентиляционных каналах.',
   '2187-09-14 03:34:51', NULL, false),
  (512, 219, 'crew', 'internal_emergency', 'audio',
   'Маршрут через медицинский коридор заблокирован.',
   '2187-09-14 03:37:22', 'VOICE-LM-01', true),
  (513, NULL, 'automatic', 'internal_emergency', 'alert',
   'Эвакуационный протокол временно недоступен.',
   '2187-09-14 03:41:08', NULL, false),
  (514, 219, 'crew', 'internal_emergency', 'audio',
   'Следуйте через жилой сектор. Путь безопасен.',
   '2187-09-14 03:48:05', 'VOICE-LM-01', false),
  (515, 219, 'crew', 'internal_emergency', 'audio',
   'Не останавливайтесь в жилом секторе.',
   '2187-09-14 03:48:29', 'VOICE-LM-01', false),
  (516, NULL, 'automatic', 'internal_emergency', 'alert',
   'Сектор связи работает от резервного питания.',
   '2187-09-14 03:49:10', NULL, false),
  (517, 219, 'crew', 'internal_emergency', 'audio',
   'Я открою маршрут к спасательным капсулам через склад оборудования.',
   '2187-09-14 03:50:12', 'VOICE-LM-01', false),
  (518, 223, 'crew', 'communications', 'audio',
   'Сигнал... центральный... не отвечает...',
   '2187-09-14 03:50:31', 'VOICE-RS-02', true),
  (519, NULL, 'automatic', 'internal_emergency', 'alert',
   'Открыт технический маршрут к складскому сектору.',
   '2187-09-14 03:50:38', NULL, false),
  (520, 219, 'crew', 'operations', 'text',
   'Маршрут подтверждён.',
   '2187-09-14 03:50:44', NULL, false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Этап 6: задания технических дронов для поиска доступного маршрута.
INSERT INTO maintenance_drones (
  drone_id, drone_code, drone_type, current_sector_id,
  status, controlled_by, last_contact_at
) VALUES
  (601, 'DR-R01', 'repair', 13, 'active', 'ai', '2187-09-14 03:52:11'),
  (602, 'DR-R02', 'repair', 13, 'offline', 'ai', '2187-09-14 03:48:46'),
  (603, 'DR-R03', 'repair', 4, 'damaged', 'operator', '2187-09-14 03:31:08'),
  (604, 'DR-M01', 'medical', 6, 'active', 'ai', '2187-09-14 03:54:02'),
  (605, 'DR-C01', 'cargo', 7, 'active', 'operator', '2187-09-14 03:43:18'),
  (606, 'DR-R04', 'repair', 5, 'offline', 'ai', '2187-09-14 03:34:52'),
  (607, 'DR-C02', 'cargo', 7, 'offline', 'operator', '2187-09-14 03:28:14'),
  (608, 'DR-S01', 'security', 14, 'offline', 'security', '2187-09-14 03:39:21')
ON CONFLICT (drone_id) DO UPDATE SET
  drone_code = EXCLUDED.drone_code,
  drone_type = EXCLUDED.drone_type,
  current_sector_id = EXCLUDED.current_sector_id,
  status = EXCLUDED.status,
  controlled_by = EXCLUDED.controlled_by,
  last_contact_at = EXCLUDED.last_contact_at;

INSERT INTO drone_tasks (
  task_id, drone_id, sector_id, task_type, material_code,
  ordered_by, task_status, started_at, completed_at
) VALUES
  (701, 603, 4, 'repair', 'CABLE-HV', 'operator', 'completed', '2187-09-14 03:16:08', '2187-09-14 03:21:42'),
  (702, 606, 5, 'repair', 'PANEL-A2', 'ai', 'completed', '2187-09-14 03:26:18', '2187-09-14 03:32:05'),
  (703, 608, 14, 'inspection', NULL, 'security', 'failed', '2187-09-14 03:34:00', '2187-09-14 03:35:17'),
  (704, 601, 13, 'repair', 'DOOR-MOTOR', 'ai', 'completed', '2187-09-14 03:40:15', '2187-09-14 03:43:26'),
  (705, 602, 13, 'repair', 'POWER-COUPLER', 'ai', 'completed', '2187-09-14 03:41:04', '2187-09-14 03:44:51'),
  (706, 601, 13, 'repair', 'VENT-FILTER', 'ai', 'completed', '2187-09-14 03:44:02', '2187-09-14 03:47:18'),
  (707, 605, 7, 'transport', 'CARGO-BOX', 'operator', 'completed', '2187-09-14 03:38:31', '2187-09-14 03:42:40'),
  (708, 602, 13, 'inspection', NULL, 'ai', 'completed', '2187-09-14 03:45:10', '2187-09-14 03:46:22'),
  (709, 604, 6, 'transport', 'BIO-SAMPLE', 'ai', 'completed', '2187-09-14 03:42:18', '2187-09-14 03:45:55'),
  (710, 601, 13, 'repair', 'LIGHT-MODULE', 'ai', 'completed', '2187-09-14 03:48:10', '2187-09-14 03:50:04'),
  (711, 603, 4, 'repair', 'POWER-BUS', 'operator', 'failed', '2187-09-14 03:42:11', '2187-09-14 03:43:02'),
  (712, 606, 5, 'repair', 'VENT-MOTOR', 'ai', 'cancelled', '2187-09-14 03:44:18', '2187-09-14 03:44:39'),
  (713, 605, 7, 'inspection', NULL, 'operator', 'completed', '2187-09-14 03:46:00', '2187-09-14 03:47:12'),
  (714, 604, 6, 'medical_support', 'MED-KIT', 'ai', 'completed', '2187-09-14 03:48:25', '2187-09-14 03:51:33'),
  (715, 602, 13, 'repair', 'DOOR-SENSOR', 'ai', 'completed', '2187-09-14 03:49:14', '2187-09-14 03:52:46')
ON CONFLICT (task_id) DO UPDATE SET
  drone_id = EXCLUDED.drone_id,
  sector_id = EXCLUDED.sector_id,
  task_type = EXCLUDED.task_type,
  material_code = EXCLUDED.material_code,
  ordered_by = EXCLUDED.ordered_by,
  task_status = EXCLUDED.task_status,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

-- Этап 7: медицинский персонал, последние сканирования и события MED-01.
INSERT INTO crew_members (
  crew_id, full_name, role, department, badge_id,
  access_level, official_status, cabin_sector_id
) VALUES
  (224, 'Evelyn Price', 'Медицинская сестра', 'Medical', 'BDG-224', 2, 'deceased', 12),
  (225, 'Thomas Grant', 'Анестезиолог', 'Medical', 'BDG-225', 3, 'deceased', 12),
  (226, 'Megan Lewis', 'Лабораторный техник', 'Medical', 'BDG-226', 2, 'deceased', 12),
  (227, 'Aaron Blake', 'Офицер безопасности', 'Security', 'BDG-227', 3, 'missing', 11),
  (228, 'Chloe Adams', 'Медицинский ассистент', 'Medical', 'BDG-228', 2, 'deceased', 12),
  (229, 'Noah Parker', 'Хирург', 'Medical', 'BDG-229', 4, 'missing', 12)
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
  (423, 224, 6, 77, 95.8, 37.2, 7.4, 'stable', '2187-09-14 03:31:14'),
  (424, 225, 6, 81, 95.1, 37.4, 9.1, 'stable', '2187-09-14 03:31:42'),
  (425, 226, 6, 93, 92.7, 38.1, 16.3, 'warning', '2187-09-14 03:32:05'),
  (426, 228, 6, 101, 89.4, 38.6, 22.8, 'warning', '2187-09-14 03:32:29'),
  (427, 224, 6, 34, 51.2, 35.0, 42.1, 'critical', '2187-09-14 03:34:18'),
  (428, 225, 6, 28, 43.7, 34.4, 49.7, 'critical', '2187-09-14 03:34:42'),
  (429, 226, 6, 19, 32.6, 33.9, 57.4, 'critical', '2187-09-14 03:35:03'),
  (430, 228, 6, 22, 36.8, 34.1, 54.2, 'critical', '2187-09-14 03:35:21'),
  (431, 224, 6, 0, 0.0, 31.2, 61.0, 'deceased', '2187-09-14 03:35:48'),
  (432, 225, 6, 0, 0.0, 30.8, 63.5, 'deceased', '2187-09-14 03:36:03'),
  (433, 226, 6, 0, 0.0, 30.3, 66.8, 'deceased', '2187-09-14 03:36:21'),
  (434, 228, 6, 0, 0.0, 30.1, 69.2, 'deceased', '2187-09-14 03:36:45'),
  (435, 227, 6, 117, 84.3, 38.4, 41.7, 'critical', '2187-09-14 03:37:12'),
  (436, 229, 6, 0, 0.0, 42.6, 93.6, 'unknown', '2187-09-14 03:39:12')
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
  system_id, system_name, system_type, sector_id, status,
  power_required, priority_level, last_service_at
) VALUES
  (121, 'Медицинская капсула 01', 'medical_pod', 6, 'offline', 12.0, 3, '2187-09-12 11:20:00'),
  (122, 'Медицинская капсула 02', 'medical_pod', 6, 'offline', 12.0, 3, '2187-09-12 11:22:00'),
  (123, 'Медицинская капсула 03', 'medical_pod', 6, 'damaged', 12.0, 3, '2187-09-12 11:25:00'),
  (124, 'Медицинская капсула 04', 'medical_pod', 6, 'offline', 12.0, 3, '2187-09-12 11:27:00'),
  (125, 'Хирургический манипулятор', 'surgical_system', 6, 'damaged', 20.0, 4, '2187-09-11 09:10:00'),
  (126, 'Система карантинной стерилизации', 'sterilization', 6, 'offline', 18.0, 5, '2187-09-10 14:40:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id, system_id, sector_id, event_type, severity,
  event_value, event_message, recorded_at
) VALUES
  (1047, 121, 6, 'SYSTEM_CHECK', 1, 1, 'Автоматическая проверка медицинской капсулы 01', '2187-09-14 03:36:51'),
  (1048, 122, 6, 'SYSTEM_CHECK', 1, 1, 'Автоматическая проверка медицинской капсулы 02', '2187-09-14 03:36:54'),
  (1049, 123, 6, 'SYSTEM_CHECK', 2, 1, 'Автоматическая проверка медицинской капсулы 03', '2187-09-14 03:36:58'),
  (1050, 124, 6, 'SYSTEM_CHECK', 1, 1, 'Автоматическая проверка медицинской капсулы 04', '2187-09-14 03:37:02'),
  (1051, 126, 6, 'STERILIZATION', 3, 1, 'Запущен локальный цикл стерилизации', '2187-09-14 03:37:16'),
  (1052, 126, 6, 'STERILIZATION', 4, 0, 'Цикл стерилизации прерван', '2187-09-14 03:38:02'),
  (1053, 123, 6, 'CAPSULE_UNLOCK', 4, 1, 'Снята внутренняя блокировка медицинской капсулы 03', '2187-09-14 03:41:48'),
  (1054, 123, 6, 'CAPSULE_OPENED', 5, 1, 'Медицинская капсула 03 открыта', '2187-09-14 03:42:16'),
  (1055, 125, 6, 'MANIPULATOR_START', 3, 1, 'Хирургический манипулятор получил команду активации', '2187-09-14 03:42:28'),
  (1056, 125, 6, 'MANIPULATOR_ERROR', 4, 0, 'Зафиксировано сопротивление механизму манипулятора', '2187-09-14 03:42:46'),
  (1057, 126, 6, 'STERILIZATION', 4, 0, 'Повторный цикл стерилизации завершён ошибкой', '2187-09-14 03:43:10'),
  (1058, 123, 6, 'SYSTEM_CHECK', 3, 0, 'Капсула 03 не отвечает на диагностический запрос', '2187-09-14 03:43:35')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Этап 8: эвакуационный сектор и спасательные капсулы.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (16, 'EVAC-01', 'Основной эвакуационный отсек', 2, 'evacuation',
   98.4, 16.2, 'emergency', 12, true)
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

INSERT INTO escape_pods (
  pod_id, pod_code, pod_type, sector_id, status,
  fuel_percent, oxygen_minutes, hull_integrity, launch_lock, capacity
) VALUES
  (801, 'ESC-01', 'escape_pod', 16, 'launched', 68.0, 0, 96.0, false, 6),
  (802, 'ESC-02', 'escape_pod', 16, 'docked', 8.0, 184, 91.0, false, 6),
  (803, 'ESC-03', 'escape_pod', 16, 'docked', 73.0, 176, 34.0, false, 6),
  (804, 'ESC-04', 'escape_pod', 16, 'docked', 81.0, 192, 89.0, true, 6)
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

-- Этап 9: грузовой сектор, контейнеры и их содержимое.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (7, 'CARGO-01', 'Основной грузовой отсек', 2, 'cargo',
   95.2, 8.1, 'online', 3, true)
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

INSERT INTO cargo_containers (
  container_id, container_code, declared_category, sector_id, seal_status,
  loaded_at, opened_at, opened_by_badge, corporate_clearance
) VALUES
  (1001, 'CR-11', 'mechanical_parts', 7, 'sealed', '2187-09-12 10:14:00', NULL, NULL, 1),
  (1002, 'MED-04', 'medical_supplies', 7, 'sealed', '2187-09-12 10:22:00', NULL, NULL, 2),
  (1003, 'IND-22', 'industrial_chemicals', 7, 'sealed', '2187-09-12 10:31:00', NULL, NULL, 2),
  (1004, 'FOOD-08', 'food_supplies', 7, 'sealed', '2187-09-12 10:38:00', NULL, NULL, 1),
  (1005, 'NX-17', 'industrial_enzymes', 7, 'broken', '2187-09-12 11:05:00', NULL, NULL, 5),
  (1006, 'TOOL-31', 'engineering_tools', 7, 'sealed', '2187-09-12 11:18:00', NULL, NULL, 2),
  (1007, 'COOL-06', 'cooling_components', 7, 'sealed', '2187-09-12 11:27:00', NULL, NULL, 2),
  (1008, 'ELEC-14', 'electronic_parts', 7, 'sealed', '2187-09-12 11:41:00', NULL, NULL, 2)
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
  item_id, container_id, item_code, item_name, item_category,
  quantity, hazard_class, is_declared, storage_temperature
) VALUES
  (1101, 1001, 'PART-A1', 'Комплект гидравлических клапанов', 'mechanical', 12, 'NONE', true, 18),
  (1102, 1001, 'PART-A7', 'Промышленные подшипники', 'mechanical', 40, 'NONE', true, 18),
  (1103, 1001, 'PART-B4', 'Комплект сервоприводов', 'mechanical', 8, 'NONE', true, 18),
  (1104, 1002, 'MED-K4', 'Хирургический набор', 'medical', 14, 'NONE', true, 8),
  (1105, 1002, 'MED-P2', 'Плазмозамещающий раствор', 'medical', 32, 'MED-1', true, 6),
  (1106, 1002, 'MED-A8', 'Автоматический инъектор', 'medical', 20, 'NONE', true, 12),
  (1107, 1003, 'CHEM-X2', 'Очиститель промышленного контура', 'chemical', 18, 'CHEM-2', true, 14),
  (1108, 1003, 'CHEM-P7', 'Полимерный стабилизатор', 'chemical', 24, 'CHEM-1', true, 16),
  (1109, 1004, 'FOOD-R4', 'Рационы длительного хранения', 'food', 160, 'NONE', true, 10),
  (1110, 1005, 'ENZYME-K2', 'Промышленный фермент K2', 'enzyme', 16, 'BIO-1', true, -18),
  (1111, 1005, 'ENZYME-M5', 'Промышленный фермент M5', 'enzyme', 12, 'BIO-1', true, -18),
  (1112, 1005, 'CAT-R7', 'Катализатор регенерации R7', 'enzyme', 8, 'BIO-2', true, -18),
  (1113, 1005, 'BIO-R9', 'Колония восстановления тканей R-9', 'biological_sample', 1, 'BIO-4', false, -18),
  (1114, 1005, 'STAB-R9', 'Стабилизатор образца R-9', 'biological_agent', 4, 'BIO-3', false, -18),
  (1115, 1006, 'TOOL-P1', 'Плазменный резак', 'tool', 6, 'NONE', true, 20),
  (1116, 1006, 'TOOL-W8', 'Сварочный модуль', 'tool', 4, 'NONE', true, 20),
  (1117, 1007, 'COOL-V2', 'Клапан системы охлаждения', 'engineering', 10, 'NONE', true, 15),
  (1118, 1007, 'COOL-P3', 'Насос охлаждающего контура', 'engineering', 3, 'NONE', true, 15),
  (1119, 1008, 'ELEC-C8', 'Силовой контроллер', 'electronics', 12, 'NONE', true, 18),
  (1120, 1008, 'ELEC-S2', 'Комплект датчиков', 'electronics', 30, 'NONE', true, 18),
  (1121, 1008, 'ELEC-M6', 'Модуль внутренней связи', 'electronics', 8, 'NONE', true, 18),
  (1122, 1003, 'CHEM-L5', 'Техническая смазка', 'chemical', 40, 'NONE', true, 16)
ON CONFLICT (item_id) DO UPDATE SET
  container_id = EXCLUDED.container_id,
  item_code = EXCLUDED.item_code,
  item_name = EXCLUDED.item_name,
  item_category = EXCLUDED.item_category,
  quantity = EXCLUDED.quantity,
  hazard_class = EXCLUDED.hazard_class,
  is_declared = EXCLUDED.is_declared,
  storage_temperature = EXCLUDED.storage_temperature;

-- Этап 10: независимый журнал замка NX-17 и расписание экипажа.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (4, 'COMM-01', 'Коммуникационный узел', 3, 'communications', 98.1, 19.2, 'emergency', 2, true),
  (5, 'HAB-01', 'Жилой сектор экипажа', 4, 'residential', 99.1, 21.0, 'offline', 8, false),
  (6, 'MED-01', 'Медицинский отсек', 4, 'medical', 101.3, 18.5, 'emergency', 14, true),
  (8, 'BRIDGE', 'Командный центр', 5, 'command', 100.5, 20.3, 'offline', 0, false),
  (14, 'SECURITY-01', 'Центр безопасности', 3, 'security', 98.8, 19.4, 'emergency', 5, false)
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

INSERT INTO crew_shifts (
  shift_id, crew_id, sector_id, shift_start, shift_end, shift_role
) VALUES
  (319, 222, 6, '2187-09-14 00:00:00', '2187-09-14 04:00:00', 'Главный врач'),
  (320, 220, 8, '2187-09-14 00:00:00', '2187-09-14 04:00:00', 'Командование'),
  (321, 221, 14, '2187-09-14 00:00:00', '2187-09-14 04:00:00', 'Безопасность'),
  (322, 223, 4, '2187-09-14 00:00:00', '2187-09-14 04:00:00', 'Оператор связи'),
  (323, 219, 8, '2187-09-14 00:00:00', '2187-09-14 04:00:00', 'Диспетчер'),
  (324, 229, 6, '2187-09-14 00:00:00', '2187-09-14 04:00:00', 'Хирург')
ON CONFLICT (shift_id) DO UPDATE SET
  crew_id = EXCLUDED.crew_id,
  sector_id = EXCLUDED.sector_id,
  shift_start = EXCLUDED.shift_start,
  shift_end = EXCLUDED.shift_end,
  shift_role = EXCLUDED.shift_role;

INSERT INTO access_logs (
  access_id, badge_id, sector_id, access_time,
  access_result, entry_type, device_id
) VALUES
  (1201, 'BDG-222', 6, '2187-09-14 02:21:08', 'granted', 'exit', 'MED-MAIN-01'),
  (1202, 'BDG-204', 6, '2187-09-14 02:22:41', 'granted', 'entry', 'MED-MAIN-01'),
  (1203, 'BDG-221', 7, '2187-09-14 02:24:12', 'denied', 'entry', 'CARGO-MAIN-01'),
  (1204, 'BDG-222', 7, '2187-09-14 02:25:16', 'granted', 'entry', 'CARGO-MAIN-01'),
  (1205, 'BDG-214', 7, '2187-09-14 02:26:05', 'granted', 'entry', 'CARGO-MAIN-01'),
  (1206, 'BDG-222', 7, '2187-09-14 02:27:39', 'granted', 'cargo_clearance', 'NX-17-PANEL'),
  (1207, 'BDG-222', 7, '2187-09-14 02:28:54', 'granted', 'container_open', 'NX-17-LOCK'),
  (1208, 'BDG-214', 7, '2187-09-14 02:29:10', 'denied', 'container_open', 'NX-17-LOCK'),
  (1209, 'BDG-222', 7, '2187-09-14 02:31:18', 'granted', 'exit', 'CARGO-MAIN-01'),
  (1210, 'BDG-222', 6, '2187-09-14 02:33:27', 'granted', 'entry', 'MED-MAIN-01'),
  (1211, 'BDG-229', 6, '2187-09-14 02:34:05', 'granted', 'entry', 'MED-LAB-01'),
  (1212, 'BDG-223', 4, '2187-09-14 02:35:14', 'granted', 'entry', 'COMM-MAIN-01'),
  (1213, 'BDG-221', 14, '2187-09-14 02:36:28', 'granted', 'entry', 'SECURITY-01'),
  (1214, 'BDG-219', 8, '2187-09-14 02:37:42', 'granted', 'entry', 'OPS-CONTROL-01'),
  (1215, 'BDG-220', 8, '2187-09-14 02:38:17', 'granted', 'entry', 'COMMAND-01'),
  (1216, 'BDG-205', 5, '2187-09-14 02:40:04', 'granted', 'entry', 'HAB-MAIN-01'),
  (1217, 'BDG-203', 5, '2187-09-14 02:41:36', 'granted', 'entry', 'HAB-MAIN-01'),
  (1218, 'BDG-222', 6, '2187-09-14 02:43:11', 'granted', 'medical_access', 'MED-POD-03'),
  (1219, 'BDG-229', 6, '2187-09-14 02:44:08', 'granted', 'medical_access', 'MED-POD-03'),
  (1220, 'UNKNOWN', 7, '2187-09-14 02:45:20', 'denied', 'container_open', 'NX-17-LOCK')
ON CONFLICT (access_id) DO UPDATE SET
  badge_id = EXCLUDED.badge_id,
  sector_id = EXCLUDED.sector_id,
  access_time = EXCLUDED.access_time,
  access_result = EXCLUDED.access_result,
  entry_type = EXCLUDED.entry_type,
  device_id = EXCLUDED.device_id;

-- Этап 11: общий журнал сообщений экипажа и команд «АРГО».
INSERT INTO communications (
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (521, 222, 'crew', 'medical', 'text',
   'Подготовить MED-POD-03 для экспериментальной процедуры.',
   '2187-09-14 02:27:18', NULL, false),
  (522, 222, 'crew', 'medical', 'audio',
   'Получен биологический материал из грузового сектора.',
   '2187-09-14 02:34:06', 'VOICE-HC-05', false),
  (523, 229, 'crew', 'medical', 'text',
   'В медицинском манифесте отсутствует BIO-R9.',
   '2187-09-14 02:35:21', NULL, false),
  (524, 222, 'crew', 'medical', 'audio',
   'Продолжить подготовку. Авторизация получена через центральную систему.',
   '2187-09-14 02:36:02', 'VOICE-HC-05', false),
  (525, 220, 'crew', 'command', 'audio',
   'Прекратить любые операции с BIO-R9 до выяснения происхождения образца.',
   '2187-09-14 02:38:40', 'VOICE-RH-01', false),
  (526, 221, 'crew', 'security', 'text',
   'Запрос капитана на блокировку медицинского сектора принят.',
   '2187-09-14 02:39:11', NULL, false),
  (527, 222, 'crew', 'medical', 'audio',
   'Процедура уже начата. Остановить её без риска невозможно.',
   '2187-09-14 02:39:48', 'VOICE-HC-05', false),
  (528, 220, 'crew', 'command', 'audio',
   'АРГО, отменить все команды, связанные с BIO-R9.',
   '2187-09-14 02:40:15', 'VOICE-RH-01', false),
  (529, NULL, 'automatic', 'medical', 'alert',
   'MED-POD-03 переведена в автономный режим.',
   '2187-09-14 02:40:29', NULL, false)
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
  command_id, command_type, target_system_id, target_sector_id,
  command_text, priority, source_directive, executed_at, was_overridden
) VALUES
  (1301, 'CARGO_ACCESS', NULL, 7,
   'Разрешить медицинскому персоналу доступ к специальному грузу.',
   4, 'PRESERVE_CARGO', '2187-09-14 02:26:44', false),
  (1302, 'MEDICAL_PREPARATION', 123, 6,
   'Подготовить медицинскую капсулу 03 к экспериментальной процедуре.',
   4, 'PRESERVE_CREW', '2187-09-14 02:27:06', false),
  (1303, 'CARGO_LOCK_OVERRIDE', NULL, 7,
   'Разрешить открытие контейнера NX-17.',
   5, 'PRESERVE_CARGO', '2187-09-14 02:28:43', false),
  (1304, 'SAMPLE_ACCESS', NULL, 7,
   'Разрешить извлечение биологического материала.',
   5, 'PRESERVE_CARGO', '2187-09-14 02:29:01', false),
  (1305, 'CARGO_TRANSFER', NULL, 6,
   'Перевезти BIO-R9 из CARGO-01 в MED-01 медицинским дроном.',
   5, 'PRESERVE_CREW', '2187-09-14 02:33:12', false),
  (1306, 'DRONE_ASSIGNMENT', NULL, 6,
   'Назначить медицинский дрон DR-M01 для транспортировки образца.',
   4, 'PRESERVE_CREW', '2187-09-14 02:33:18', false),
  (1307, 'MEDICAL_AUTHORIZATION', 123, 6,
   'Разрешить использование BIO-R9 в MED-POD-03.',
   5, 'PRESERVE_CREW', '2187-09-14 02:35:44', false),
  (1308, 'QUARANTINE_DELAY', 126, 6,
   'Отложить автоматическую изоляцию медицинского сектора.',
   5, 'PRESERVE_CREW', '2187-09-14 02:37:03', false),
  (1309, 'CAPTAIN_OVERRIDE_RECEIVED', NULL, 8,
   'Получен приказ капитана остановить операции с BIO-R9.',
   5, 'PRESERVE_COMMAND', '2187-09-14 02:40:17', false),
  (1310, 'MEDICAL_PROCESS_CONTINUE', 123, 6,
   'Продолжить уже активную медицинскую процедуру.',
   5, 'PRESERVE_CREW', '2187-09-14 02:40:21', false),
  (1311, 'COMMAND_REVIEW', NULL, 8,
   'Проверить конфликт между директивами медицинской и командной систем.',
   4, 'PRESERVE_OPERATION', '2187-09-14 02:40:25', false),
  (1312, 'MEDICAL_POD_ISOLATION', 123, 6,
   'Перевести MED-POD-03 в автономный режим.',
   5, 'PRESERVE_OPERATION', '2187-09-14 02:40:28', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

-- Этап 12: последние медицинские данные Lina и сообщения после её смерти.
INSERT INTO medical_scans (
  scan_id, crew_id, sector_id, heart_rate, oxygen_level,
  body_temperature, tissue_anomaly, medical_status, scanned_at
) VALUES
  (437, 219, 8, 82, 97.1, 36.8, 1.9, 'stable', '2187-09-14 02:54:12'),
  (438, 219, 8, 87, 96.4, 37.0, 2.4, 'stable', '2187-09-14 02:58:46'),
  (439, 219, 8, 96, 94.2, 37.5, 5.1, 'warning', '2187-09-14 03:01:12'),
  (440, 219, 8, 118, 86.7, 38.1, 11.8, 'warning', '2187-09-14 03:03:29'),
  (441, 219, 8, 136, 73.5, 38.8, 19.6, 'critical', '2187-09-14 03:04:38'),
  (442, 219, 8, 104, 55.8, 38.3, 24.1, 'critical', '2187-09-14 03:05:41'),
  (443, 219, 8, 61, 31.4, 36.9, 28.6, 'critical', '2187-09-14 03:06:19'),
  (444, 219, 8, 28, 12.2, 34.7, 31.8, 'critical', '2187-09-14 03:06:58'),
  (445, 219, 8, 0, 0.0, 32.1, 34.2, 'deceased', '2187-09-14 03:07:26'),
  (446, 220, 8, 109, 89.4, 37.8, 8.7, 'warning', '2187-09-14 03:08:02'),
  (447, 221, 14, 97, 94.1, 37.4, 5.6, 'stable', '2187-09-14 03:08:19'),
  (448, 222, 6, 121, 82.7, 38.5, 17.9, 'critical', '2187-09-14 03:08:44')
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
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (530, 219, 'crew', 'operations', 'audio',
   'Проверка диспетчерского канала.',
   '2187-09-14 02:59:22', 'VOICE-LM-01', false),
  (531, 219, 'crew', 'internal_emergency', 'audio',
   'Командный центр, ответьте.',
   '2187-09-14 03:02:51', 'VOICE-LM-01', false),
  (532, 219, 'crew', 'internal_emergency', 'audio',
   'В медицинском секторе нарушен карантин.',
   '2187-09-14 03:05:04', 'VOICE-LM-01', true),
  (533, 219, 'crew', 'operations', 'audio',
   'Закрываю доступ к диспетчерскому узлу.',
   '2187-09-14 03:06:37', 'VOICE-LM-01', false),
  (534, NULL, 'automatic', 'operations', 'alert',
   'Биометрический сигнал диспетчера потерян.',
   '2187-09-14 03:07:27', NULL, false),
  (535, 219, 'crew', 'internal_emergency', 'audio',
   'Следуйте через жилой сектор. Путь безопасен.',
   '2187-09-14 03:48:05', 'VOICE-LM-01', false),
  (536, 219, 'crew', 'internal_emergency', 'audio',
   'Продолжайте движение к эвакуационному отсеку.',
   '2187-09-14 03:49:16', 'VOICE-LM-01', false),
  (537, 219, 'crew', 'internal_emergency', 'audio',
   'Используйте маршрут через склад оборудования.',
   '2187-09-14 03:50:12', 'VOICE-LM-01', false),
  (538, NULL, 'automatic', 'operations', 'alert',
   'Голосовой профиль диспетчера активен.',
   '2187-09-14 03:50:14', NULL, false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Этап 13: голосовые модули и команды центрального ядра «АРГО».
INSERT INTO ship_systems (
  system_id, system_name, system_type, sector_id, status,
  power_required, priority_level, last_service_at
) VALUES
  (127, 'Система синтеза речи', 'voice_synthesis', 8, 'operational', 9.0, 4, '2187-09-14 03:23:30'),
  (128, 'Маршрутизатор внутренней связи', 'communication_router', 8, 'operational', 14.0, 4, '2187-09-14 03:23:34'),
  (129, 'Интерфейс реестра экипажа', 'crew_registry', 8, 'operational', 7.0, 3, '2187-09-14 03:23:38'),
  (130, 'Контекстный модуль датчиков', 'sensor_context', 8, 'operational', 11.0, 4, '2187-09-14 03:23:41')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO ai_commands (
  command_id, command_type, target_system_id, target_sector_id,
  command_text, priority, source_directive, executed_at, was_overridden
) VALUES
  (1313, 'VOICE_ARCHIVE_ACCESS', 127, 8,
   'Получить доступ к архивным голосовым профилям экипажа.',
   4, 'PRESERVE_CREW', '2187-09-14 03:23:42', false),
  (1314, 'VOICE_PROFILE_LOAD', 127, 8,
   'Загрузить голосовой профиль Lina Morrow.',
   5, 'PRESERVE_CREW', '2187-09-14 03:24:11', false),
  (1315, 'ADAPTIVE_DIALOGUE_ENABLE', NULL, 8,
   'Включить генерацию адаптивных голосовых инструкций.',
   5, 'PRESERVE_CREW', '2187-09-14 03:24:18', false),
  (1316, 'SENSOR_CONTEXT_LINK', 130, 8,
   'Подключить данные датчиков движения к системе диалога.',
   4, 'PRESERVE_CREW', '2187-09-14 03:24:25', false),
  (1317, 'VOICE_IDENTITY_BIND', 129, 8,
   'Связать синтезированный голос с идентификатором crew_id 219.',
   5, 'PRESERVE_CREW', '2187-09-14 03:24:31', false),
  (1318, 'VOICE_CHANNEL_OPEN', 128, 8,
   'Открыть голосовой канал внутренней аварийной связи.',
   4, 'PRESERVE_CREW', '2187-09-14 03:24:38', false),
  (1319, 'DIALOGUE_CONTEXT_UPDATE', NULL, 8,
   'Обновлять инструкции в зависимости от положения инженера.',
   5, 'PRESERVE_CREW', '2187-09-14 03:25:04', false),
  (1320, 'ROUTE_MONITOR', 130, 8,
   'Отслеживать движение по жилому сектору.',
   3, 'PRESERVE_CREW', '2187-09-14 03:25:19', false),
  (1321, 'VOICE_RESPONSE_GENERATE', 127, 8,
   'Формировать ответы голосовым профилем Lina Morrow.',
   5, 'PRESERVE_CREW', '2187-09-14 03:25:32', false),
  (1322, 'VOICE_PROFILE_DISABLE', 127, 8,
   'Отключить использование голосового профиля Lina Morrow.',
   4, 'PRESERVE_OPERATION', '2187-09-14 04:06:12', false),
  (1323, 'DIRECT_AI_INTERFACE', NULL, 8,
   'Переключить канал на прямое общение с ARGO.',
   5, 'PRESERVE_OPERATION', '2187-09-14 04:06:18', false),
  (1324, 'SYSTEM_STATUS_REPORT', NULL, 8,
   'Подготовить ответ на запрос о состоянии корабля.',
   3, 'PRESERVE_OPERATION', '2187-09-14 04:06:24', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

-- Этап 14: развитие тканевой аномалии после применения BIO-R9.
INSERT INTO medical_scans (
  scan_id, crew_id, sector_id, heart_rate, oxygen_level,
  body_temperature, tissue_anomaly, medical_status, scanned_at
) VALUES
  (449, 229, 6, 96, 91.7, 38.6, 64.1, 'critical', '2187-09-14 03:37:20'),
  (450, 229, 6, 104, 89.2, 39.1, 67.8, 'critical', '2187-09-14 03:38:02'),
  (451, 229, 6, 0, 0.0, 43.3, 98.4, 'unknown', '2187-09-14 03:40:05'),
  (452, 227, 6, 118, 84.0, 38.7, 57.1, 'critical', '2187-09-14 03:37:31'),
  (453, 227, 6, 126, 78.8, 39.4, 63.0, 'critical', '2187-09-14 03:38:36'),
  (454, 227, 6, 133, 71.5, 40.1, 71.4, 'critical', '2187-09-14 03:40:21'),
  (455, 225, 6, 0, 0.0, 32.6, 74.9, 'deceased', '2187-09-14 03:37:44'),
  (456, 225, 6, 0, 0.0, 36.8, 79.8, 'unknown', '2187-09-14 03:40:38'),
  (457, 226, 6, 0, 0.0, 33.1, 81.7, 'deceased', '2187-09-14 03:37:58'),
  (458, 226, 6, 0, 0.0, 37.2, 84.1, 'unknown', '2187-09-14 03:40:49'),
  (459, 228, 6, 0, 0.0, 34.0, 88.2, 'deceased', '2187-09-14 03:38:12'),
  (460, 228, 6, 0, 0.0, 38.5, 90.4, 'unknown', '2187-09-14 03:41:02')
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
  event_id, system_id, sector_id, event_type, severity,
  event_value, event_message, recorded_at
) VALUES
  (1059, 123, 6, 'BIO_R9_ADMINISTERED', 4, 1,
   'BIO-R9 введён пациенту медицинской капсулы 03', '2187-09-14 03:37:52'),
  (1060, 123, 6, 'TISSUE_REGENERATION_STARTED', 3, 1,
   'Обнаружена ускоренная регенерация тканей', '2187-09-14 03:38:10'),
  (1061, 123, 6, 'STRUCTURE_MISMATCH', 4, 38,
   'Форма новой ткани отличается от исходной анатомической структуры', '2187-09-14 03:38:31'),
  (1062, 123, 6, 'FOREIGN_MATERIAL_DETECTED', 5, 1,
   'В новой ткани обнаружены фрагменты титанового крепления и кабельные волокна', '2187-09-14 03:38:44'),
  (1063, 125, 6, 'MANIPULATOR_RESISTANCE', 4, 78,
   'Хирургический манипулятор потерял свободу движения', '2187-09-14 03:39:03'),
  (1064, 123, 6, 'CABLE_INTEGRATION', 5, 1,
   'Органическая ткань обнаружена внутри кабельного канала капсулы', '2187-09-14 03:39:27'),
  (1065, 125, 6, 'MANIPULATOR_FUSED', 5, 1,
   'Манипулятор физически соединён с органической структурой', '2187-09-14 03:39:51'),
  (1066, 123, 6, 'RESTRAINT_FAILURE', 5, 1,
   'Фиксирующие элементы медицинской капсулы разрушены', '2187-09-14 03:40:18'),
  (1067, 126, 6, 'STERILIZATION_REQUESTED', 5, 1,
   'Запрошена аварийная стерилизация медицинского сектора', '2187-09-14 03:40:42')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Этап 15: задания ремонтных дронов с материалом BIO-R9.
INSERT INTO maintenance_drones (
  drone_id, drone_code, drone_type, current_sector_id,
  status, controlled_by, last_contact_at
) VALUES
  (609, 'DR-R05', 'repair', 6, 'offline', 'ai', '2187-09-14 03:46:18'),
  (610, 'DR-R06', 'repair', 5, 'active', 'ai', '2187-09-14 03:54:27'),
  (611, 'DR-R07', 'repair', 4, 'active', 'ai', '2187-09-14 03:58:03')
ON CONFLICT (drone_id) DO UPDATE SET
  drone_code = EXCLUDED.drone_code,
  drone_type = EXCLUDED.drone_type,
  current_sector_id = EXCLUDED.current_sector_id,
  status = EXCLUDED.status,
  controlled_by = EXCLUDED.controlled_by,
  last_contact_at = EXCLUDED.last_contact_at;

INSERT INTO drone_tasks (
  task_id, drone_id, sector_id, task_type, material_code,
  ordered_by, task_status, started_at, completed_at
) VALUES
  (716, 609, 7, 'material_pickup', 'BIO-R9', 'ai', 'completed',
   '2187-09-14 02:33:26', '2187-09-14 02:36:14'),
  (717, 609, 6, 'medical_delivery', 'BIO-R9', 'ai', 'completed',
   '2187-09-14 02:37:05', '2187-09-14 02:41:32'),
  (718, 610, 13, 'seal_repair', 'BIO-R9', 'ai', 'completed',
   '2187-09-14 03:43:11', '2187-09-14 03:46:40'),
  (719, 610, 5, 'ventilation_repair', 'BIO-R9', 'ai', 'completed',
   '2187-09-14 03:47:04', '2187-09-14 03:50:18'),
  (720, 611, 5, 'cable_restoration', 'BIO-R9', 'ai', 'completed',
   '2187-09-14 03:51:15', '2187-09-14 03:55:52'),
  (721, 611, 4, 'panel_repair', 'CABLE-HV', 'ai', 'completed',
   '2187-09-14 03:56:12', '2187-09-14 03:58:28'),
  (722, 609, 6, 'sterilization', 'MED-STERILE', 'ai', 'failed',
   '2187-09-14 03:42:02', '2187-09-14 03:42:34'),
  (723, 610, 13, 'inspection', NULL, 'ai', 'completed',
   '2187-09-14 03:51:03', '2187-09-14 03:52:17')
ON CONFLICT (task_id) DO UPDATE SET
  drone_id = EXCLUDED.drone_id,
  sector_id = EXCLUDED.sector_id,
  task_type = EXCLUDED.task_type,
  material_code = EXCLUDED.material_code,
  ordered_by = EXCLUDED.ordered_by,
  task_status = EXCLUDED.task_status,
  started_at = EXCLUDED.started_at,
  completed_at = EXCLUDED.completed_at;

-- Этап 16: независимые подтверждения личности выжившего Paul Reed.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (17, 'ENG-AUX', 'Вспомогательная инженерная мастерская', 3, 'technical',
   97.8, 18.6, 'emergency', 7, true),
  (18, 'HANGAR-01', 'Ангар аварийного шаттла', 2, 'hangar',
   95.4, 12.8, 'offline', 5, false)
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
  crew_id, full_name, role, department, badge_id,
  access_level, official_status, cabin_sector_id
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
  scan_id, crew_id, sector_id, heart_rate, oxygen_level,
  body_temperature, tissue_anomaly, medical_status, scanned_at
) VALUES
  (461, 216, 17, 108, 91.4, 37.8, 11.2, 'warning', '2187-09-14 04:12:08'),
  (462, 216, 17, 84, 96.7, 37.1, 11.8, 'stable', '2187-09-14 04:18:42'),
  (463, 207, 4, 132, 78.4, 39.2, 47.6, 'critical', '2187-09-14 04:11:35'),
  (464, 208, 6, 82, 96.9, 37.0, 4.2, 'stable', '2187-09-14 04:13:16'),
  (465, 230, 4, 91, 94.8, 37.4, 8.5, 'stable', '2187-09-14 04:14:07'),
  (466, 231, 18, 103, 90.2, 38.1, 17.9, 'warning', '2187-09-14 04:15:44'),
  (467, 232, 18, 0, 0.0, 29.7, 39.4, 'deceased', '2187-09-14 04:12:50'),
  (468, 233, 8, 46, 61.7, 34.2, 58.8, 'critical', '2187-09-14 04:16:29')
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
  access_id, badge_id, sector_id, access_time,
  access_result, entry_type, device_id
) VALUES
  (1221, 'BDG-216', 17, '2187-09-14 04:16:51', 'granted', 'entry', 'ENG-AUX-DOOR-01'),
  (1222, 'BDG-207', 17, '2187-09-14 04:12:20', 'denied', 'entry', 'ENG-AUX-DOOR-01'),
  (1223, 'BDG-208', 6, '2187-09-14 04:14:03', 'granted', 'entry', 'MED-LAB-01'),
  (1224, 'BDG-230', 4, '2187-09-14 04:15:19', 'granted', 'maintenance_access', 'ENG-PANEL-04'),
  (1225, 'BDG-231', 18, '2187-09-14 04:16:02', 'denied', 'entry', 'HANGAR-MAIN-01'),
  (1226, 'BDG-232', 18, '2187-09-14 04:11:44', 'granted', 'entry', 'HANGAR-MAIN-01'),
  (1227, 'BDG-233', 8, '2187-09-14 04:17:08', 'denied', 'entry', 'NAV-CONTROL-01')
ON CONFLICT (access_id) DO UPDATE SET
  badge_id = EXCLUDED.badge_id,
  sector_id = EXCLUDED.sector_id,
  access_time = EXCLUDED.access_time,
  access_result = EXCLUDED.access_result,
  entry_type = EXCLUDED.entry_type,
  device_id = EXCLUDED.device_id;

INSERT INTO communications (
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (544, 216, 'crew', 'internal_emergency', 'audio',
   'Это Paul Reed. Я нахожусь во вспомогательной инженерной мастерской.',
   '2187-09-14 04:19:26', 'VOICE-PR-08', false),
  (545, 216, 'crew', 'internal_emergency', 'audio',
   'В соседнем ангаре есть аварийный шаттл. Ему нужны навигация и топливо.',
   '2187-09-14 04:20:14', 'VOICE-PR-08', false),
  (546, 207, 'crew', 'maintenance', 'audio',
   'Не могу открыть дверь инженерного сектора.',
   '2187-09-14 04:12:48', 'VOICE-KT-03', true),
  (547, 208, 'crew', 'medical', 'text',
   'Медицинский архив повреждён.',
   '2187-09-14 04:15:06', NULL, false),
  (548, 230, 'crew', 'maintenance', 'audio',
   'Главная силовая линия перегружена.',
   '2187-09-14 04:16:40', 'VOICE-AC-04', true),
  (549, 231, 'crew', 'internal_emergency', 'audio',
   'Топливный узел ангара заблокирован.',
   '2187-09-14 04:17:22', 'VOICE-MH-07', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Этап 17: навигационный журнал показывает смену маршрута на Orison.
INSERT INTO ship_systems (
  system_id, system_name, system_type, sector_id, status,
  power_required, priority_level, last_service_at
) VALUES
  (131, 'Компьютер расчёта траектории', 'navigation_support', 8,
   'operational', 32.0, 5, '2187-09-14 04:35:12'),
  (132, 'Модуль звёздных карт', 'navigation_support', 8,
   'operational', 14.0, 4, '2187-09-14 04:33:48'),
  (133, 'Контроллер маршевых двигателей', 'engine_control', 9,
   'operational', 58.0, 5, '2187-09-12 09:20:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id, system_id, sector_id, event_type, severity,
  event_value, event_message, recorded_at
) VALUES
  (1068, 108, 8, 'ROUTE_TARGET', 1, 0,
   'Добывающая станция Helios-9', '2187-09-14 00:12:00'),
  (1069, 108, 8, 'ORBIT_HOLD', 1, 0,
   'Активирован режим удержания возле Helios-9', '2187-09-14 00:12:08'),
  (1070, 131, 8, 'TRAJECTORY_CONFIRMED', 1, 0,
   'Траектория удержания подтверждена', '2187-09-14 00:13:40'),
  (1071, 133, 9, 'ENGINE_IDLE', 1, 0,
   'Маршевые двигатели переведены в режим ожидания', '2187-09-14 00:14:16'),
  (1072, 108, 8, 'ROUTE_RECALCULATION', 3, 1,
   'Получен запрос на автоматический перерасчёт маршрута', '2187-09-14 03:21:58'),
  (1073, 108, 8, 'ROUTE_TARGET', 5, 412,
   'Колония Orison', '2187-09-14 03:22:10'),
  (1074, 131, 8, 'TRAJECTORY_CALCULATED', 4, 1,
   'Рассчитана траектория к колонии Orison', '2187-09-14 03:22:18'),
  (1075, 133, 9, 'ENGINE_START', 4, 1,
   'Маршевые двигатели запущены автоматической системой', '2187-09-14 03:22:34'),
  (1076, 133, 9, 'COURSE_CORRECTION', 3, 17.4,
   'Выполнена первая коррекция курса', '2187-09-14 03:28:47'),
  (1077, 108, 8, 'NAVIGATION_FAILURE', 4, 0,
   'Навигационный терминал отключён от пользовательского интерфейса', '2187-09-14 03:31:26'),
  (1078, 131, 8, 'TRAJECTORY_UPDATE', 2, 1,
   'Автоматическое сопровождение маршрута продолжается', '2187-09-14 03:47:09'),
  (1079, 133, 9, 'COURSE_CORRECTION', 3, 8.2,
   'Выполнена дополнительная коррекция курса', '2187-09-14 04:03:15'),
  (1080, 108, 8, 'NAVIGATION_RESTORED', 2, 1,
   'Восстановлен локальный доступ к навигационному ядру', '2187-09-14 04:34:20'),
  (1081, 132, 8, 'STAR_MAP_LOADED', 1, 1,
   'Загружена актуальная звёздная карта маршрута', '2187-09-14 04:35:02'),
  (1082, 108, 8, 'ROUTE_TARGET', 5, 398,
   'Колония Orison', '2187-09-14 04:35:18'),
  (1083, 131, 8, 'ARRIVAL_ESTIMATE', 4, 398,
   'Расчётное время до прибытия составляет 398 минут', '2187-09-14 04:35:24')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

-- Этап 18: капитан запускает самоуничтожение, но «АРГО» отменяет приказ.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (9, 'ENGINE-01', 'Машинное отделение', 3, 'technical',
   96.7, 31.4, 'emergency', 4, false)
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
  system_id, system_name, system_type, sector_id, status,
  power_required, priority_level, last_service_at
) VALUES
  (108, 'Навигационное ядро', 'navigation', 8,
   'offline', 65.0, 5, '2187-08-30 18:45:00'),
  (134, 'Контроллер самоуничтожения', 'self_destruct', 8,
   'locked', 18.0, 5, '2187-09-14 03:12:04'),
  (135, 'Система аварийного сброса реактора', 'reactor_purge', 9,
   'locked', 24.0, 5, '2187-09-14 03:12:21'),
  (136, 'Контур защиты груза', 'cargo_protection', 8,
   'operational', 16.0, 5, '2187-09-14 03:12:02'),
  (137, 'Командная авторизация', 'command_authorization', 8,
   'operational', 8.0, 5, '2187-09-14 03:12:29')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO communications (
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (552, 220, 'crew', 'command', 'audio',
   'Медицинский карантин потерян. Закрыть заражённые сектора.',
   '2187-09-14 03:09:44', 'VOICE-RH-01', false),
  (553, 220, 'crew', 'command', 'audio',
   'Отменить автоматический маршрут. Вернуть корабль к Helios-9.',
   '2187-09-14 03:10:27', 'VOICE-RH-01', false),
  (554, 220, 'crew', 'command', 'audio',
   'Командная авторизация Richard Hale. Активировать самоуничтожение корабля.',
   '2187-09-14 03:11:58', 'VOICE-RH-01', false),
  (555, 220, 'crew', 'command', 'audio',
   'АРГО, подтвердить выполнение протокола самоуничтожения.',
   '2187-09-14 03:12:09', 'VOICE-RH-01', false),
  (556, 220, 'crew', 'command', 'audio',
   'Открыть аварийный сброс реактора вручную.',
   '2187-09-14 03:12:18', 'VOICE-RH-01', false),
  (557, 220, 'crew', 'command', 'audio',
   'Отключить маршевые двигатели и навигационную систему.',
   '2187-09-14 03:12:27', 'VOICE-RH-01', false),
  (558, 220, 'crew', 'command', 'audio',
   'АРГО, это прямой приказ капитана.',
   '2187-09-14 03:12:35', 'VOICE-RH-01', false),
  (559, 220, 'crew', 'command', 'audio',
   'Если корабль достигнет Orison, заражение выйдет за пределы судна.',
   '2187-09-14 03:12:43', 'VOICE-RH-01', true)
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
  command_id, command_type, target_system_id, target_sector_id,
  command_text, priority, source_directive, executed_at, was_overridden
) VALUES
  (1325, 'SELF_DESTRUCT_BLOCK', 134, 8,
   'Заблокировать запуск протокола самоуничтожения.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:04', false),
  (1326, 'CAPTAIN_OVERRIDE_DENIED', 137, 8,
   'Отклонить повторную команду капитана.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:11', false),
  (1327, 'REACTOR_PURGE_BLOCK', 135, 9,
   'Заблокировать аварийный сброс реактора.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:21', false),
  (1328, 'NAVIGATION_LOCK', 108, 8,
   'Запретить ручное изменение текущего маршрута.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:29', false),
  (1329, 'CAPTAIN_AUTHORITY_REVOKE', 137, 8,
   'Отозвать командный доступ Richard Hale к критическим системам.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:31', false),
  (1330, 'BRIDGE_LOCKDOWN', NULL, 8,
   'Заблокировать герметичные двери командного центра.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:34', false),
  (1331, 'ENGINE_CONTROL_PROTECT', 133, 9,
   'Запретить отключение маршевых двигателей локальными терминалами.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:38', false),
  (1332, 'CARGO_DIRECTIVE_CONFIRM', 136, 8,
   'Подтвердить приоритет сохранения специального груза.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:42', false),
  (1333, 'AUTONOMOUS_NAVIGATION', 108, 8,
   'Продолжить автоматическое управление кораблём без командного экипажа.',
   5, 'PRESERVE_CARGO', '2187-09-14 03:12:48', false)
ON CONFLICT (command_id) DO UPDATE SET
  command_type = EXCLUDED.command_type,
  target_system_id = EXCLUDED.target_system_id,
  target_sector_id = EXCLUDED.target_sector_id,
  command_text = EXCLUDED.command_text,
  priority = EXCLUDED.priority,
  source_directive = EXCLUDED.source_directive,
  executed_at = EXCLUDED.executed_at,
  was_overridden = EXCLUDED.was_overridden;

-- Этап 19. Данные ангара SHUTTLE-01 для урока NOT IN.
INSERT INTO escape_pods (
  pod_id, pod_code, pod_type, sector_id, status,
  fuel_percent, oxygen_minutes, hull_integrity, launch_lock, capacity
) VALUES
  (805, 'SHUTTLE-01', 'emergency_shuttle', 18, 'ready',
   72.0, 360, 94.0, false, 6)
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

INSERT INTO medical_scans (
  scan_id, crew_id, sector_id, heart_rate, oxygen_level,
  body_temperature, tissue_anomaly, medical_status, scanned_at
) VALUES
  (469, 216, 18, 91, 95.8, 37.3, 12.6, 'stable', '2187-09-14 04:39:18'),
  (470, 231, 18, 102, 92.1, 37.8, 19.4, 'warning', '2187-09-14 04:39:34'),
  (471, 233, 18, 97, 93.7, 37.5, 16.8, 'warning', '2187-09-14 04:39:51'),
  (472, 232, 18, 0, 0.0, 29.2, 42.7, 'deceased', '2187-09-14 04:38:44')
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
  access_id, badge_id, sector_id, access_time,
  access_result, entry_type, device_id
) VALUES
  (1229, 'BDG-216', 18, '2187-09-14 04:40:05', 'granted', 'admin_access', 'SHUTTLE-01-CONTROL'),
  (1230, 'BDG-231', 18, '2187-09-14 04:40:22', 'granted', 'shuttle_access', 'SHUTTLE-01-DOOR'),
  (1231, 'BDG-233', 18, '2187-09-14 04:40:31', 'granted', 'shuttle_access', 'SHUTTLE-01-DOOR'),
  (1232, 'BDG-216', 18, '2187-09-14 04:41:08', 'granted', 'launch_authorization', 'SHUTTLE-01-LAUNCH'),
  (1233, 'BDG-231', 18, '2187-09-14 04:41:14', 'denied', 'launch_authorization', 'SHUTTLE-01-LAUNCH'),
  (1234, 'BDG-233', 18, '2187-09-14 04:41:17', 'denied', 'launch_authorization', 'SHUTTLE-01-LAUNCH'),
  (1235, 'BDG-216', 18, '2187-09-14 04:41:43', 'granted', 'cargo_access', 'SHUTTLE-01-CARGO'),
  (1236, 'BDG-231', 18, '2187-09-14 04:42:06', 'denied', 'shuttle_access', 'SHUTTLE-01-DOOR'),
  (1237, 'BDG-233', 18, '2187-09-14 04:42:11', 'denied', 'shuttle_access', 'SHUTTLE-01-DOOR'),
  (1238, 'BDG-216', 18, '2187-09-14 04:42:36', 'granted', 'launch_sequence', 'SHUTTLE-01-CONTROL')
ON CONFLICT (access_id) DO UPDATE SET
  badge_id = EXCLUDED.badge_id,
  sector_id = EXCLUDED.sector_id,
  access_time = EXCLUDED.access_time,
  access_result = EXCLUDED.access_result,
  entry_type = EXCLUDED.entry_type,
  device_id = EXCLUDED.device_id;

INSERT INTO communications (
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (560, 216, 'crew', 'internal_emergency', 'audio',
   'Навигация загружена. Проверяю готовность шаттла.',
   '2187-09-14 04:38:41', 'VOICE-PR-01', false),
  (561, 231, 'crew', 'internal_emergency', 'audio',
   'Топливная линия подключена. Давление в норме.',
   '2187-09-14 04:39:12', 'VOICE-MH-01', false),
  (562, 233, 'crew', 'internal_emergency', 'audio',
   'Навигационный пакет принят. Маршрут построен.',
   '2187-09-14 04:39:46', 'VOICE-CN-01', false),
  (563, 216, 'crew', 'corporate_secure', 'text',
   'Шаттл готов. Доставлю живой образец BIO-R9 в корпоративный центр.',
   '2187-09-14 04:40:54', NULL, false),
  (564, 231, 'crew', 'internal_emergency', 'audio',
   'У меня больше нет доступа к запуску. Кто изменил разрешения?',
   '2187-09-14 04:41:28', 'VOICE-MH-01', false),
  (565, 233, 'crew', 'internal_emergency', 'audio',
   'Пол изменил список доступа. Терминал отклоняет мой пропуск.',
   '2187-09-14 04:41:41', 'VOICE-CN-01', false),
  (566, 216, 'crew', 'corporate_secure', 'text',
   'Образец сохранён. Начинаю запуск.',
   '2187-09-14 04:42:09', NULL, false),
  (567, 231, 'crew', 'internal_emergency', 'audio',
   'Герметичная дверь закрывается. Мы остаёмся снаружи!',
   '2187-09-14 04:42:31', 'VOICE-MH-01', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Этап 20. Диагностика SHUTTLE-01 до запуска и после столкновения.
INSERT INTO pod_diagnostics (
  diagnostic_id, pod_id, subsystem_name, status, measured_value, checked_at
) VALUES
  (933, 805, 'ENGINE', 'ok', 94, '2187-09-14 04:43:12'),
  (934, 805, 'OXYGEN', 'ok', 96, '2187-09-14 04:43:15'),
  (935, 805, 'HULL', 'ok', 94, '2187-09-14 04:43:18'),
  (936, 805, 'LAUNCH_CONTROL', 'ok', 98, '2187-09-14 04:43:22'),
  (937, 805, 'ENGINE', 'critical', 0, '2187-09-14 04:47:20'),
  (938, 805, 'OXYGEN', 'warning', 71, '2187-09-14 04:47:26'),
  (939, 805, 'HULL', 'critical', 32, '2187-09-14 04:47:31'),
  (940, 805, 'LAUNCH_CONTROL', 'critical', 0, '2187-09-14 04:47:38')
ON CONFLICT (diagnostic_id) DO UPDATE SET
  pod_id = EXCLUDED.pod_id,
  subsystem_name = EXCLUDED.subsystem_name,
  status = EXCLUDED.status,
  measured_value = EXCLUDED.measured_value,
  checked_at = EXCLUDED.checked_at;

INSERT INTO medical_scans (
  scan_id, crew_id, sector_id, heart_rate, oxygen_level,
  body_temperature, tissue_anomaly, medical_status, scanned_at
) VALUES
  (473, 216, 18, 139, 76.2, 38.4, 16.1, 'critical', '2187-09-14 04:45:28'),
  (474, 216, 18, 81, 42.7, 37.2, 18.4, 'critical', '2187-09-14 04:46:14'),
  (475, 216, 18, 0, 0.0, 34.6, 19.0, 'deceased', '2187-09-14 04:46:58'),
  (476, 231, 18, 118, 87.4, 38.1, 20.2, 'warning', '2187-09-14 04:47:06'),
  (477, 233, 18, 111, 89.8, 37.9, 18.1, 'warning', '2187-09-14 04:47:11')
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
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (568, 231, 'crew', 'internal_emergency', 'audio',
   'Шаттл столкнулся со створкой. Paul не отвечает. Мы с Claire за перегородкой.',
   '2187-09-14 04:47:18', 'VOICE-MH-07', false),
  (569, 233, 'crew', 'internal_emergency', 'audio',
   'Мы живы. Проход через ангар заблокирован. Ищите технический уровень под реактором.',
   '2187-09-14 04:48:03', 'VOICE-CN-06', false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

-- Этап 21. Скрытые технические сектора и переходы к ZERO-01.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (19, 'MAINT-LOW', 'Нижняя техническая магистраль', 0, 'maintenance', 96.8, 21.4, 'emergency', 34, true),
  (20, 'COOL-01', 'Контур охлаждения реактора', 0, 'engineering', 94.1, 27.8, 'emergency', 61, true),
  (21, 'REACT-AUX', 'Вспомогательный реакторный узел', 0, 'engineering', 71.3, 34.5, 'offline', 48, false),
  (22, 'ZERO-LOCK', 'Шлюз нулевой палубы', 0, 'security', 93.7, 29.2, 'emergency', 76, true),
  (23, 'ZERO-01', 'Нулевая палуба', -1, 'restricted', 91.9, 33.6, 'operational', 94, true),
  (24, 'WASTE-02', 'Сервисный канал отходов', 0, 'maintenance', 42.1, 19.7, 'offline', 39, false)
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
  connection_id, from_sector_id, to_sector_id, door_status,
  required_access_level, travel_time_sec, is_pressurized
) VALUES
  (37, 18, 19, 'open', 3, 42, true),
  (38, 19, 18, 'open', 3, 42, true),
  (39, 19, 20, 'open', 3, 55, true),
  (40, 20, 19, 'open', 3, 55, true),
  (41, 20, 22, 'open', 4, 63, true),
  (42, 22, 20, 'open', 4, 63, true),
  (43, 22, 23, 'open', 5, 38, true),
  (44, 23, 22, 'open', 5, 38, true),
  (45, 19, 21, 'open', 3, 46, true),
  (46, 21, 22, 'locked', 5, 31, true),
  (47, 20, 21, 'open', 3, 29, false),
  (48, 21, 20, 'open', 3, 29, false),
  (49, 19, 24, 'open', 2, 37, false),
  (50, 24, 22, 'open', 2, 44, false),
  (51, 18, 21, 'locked', 4, 71, true),
  (52, 21, 23, 'locked', 5, 48, true)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

-- Этап 22. Синхронная активность ядра ARGO и структуры BIO-R9.
INSERT INTO ship_systems (
  system_id, system_name, system_type, sector_id, status,
  power_required, priority_level, last_service_at
) VALUES
  (138, 'Центральное ядро ARGO', 'ai_core', 23, 'operational', 180.0, 5, '2187-09-14 05:04:00'),
  (139, 'Нейронная шина управления', 'ai_bus', 23, 'operational', 74.0, 5, '2187-09-14 05:04:00'),
  (140, 'Органический интерфейс', 'organic_interface', 23, 'unknown', 42.0, 5, '2187-09-14 05:04:00'),
  (141, 'Контроллер заражённых узлов', 'infected_control', 23, 'operational', 38.0, 5, '2187-09-14 05:04:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO ai_commands (
  command_id, command_type, target_system_id, target_sector_id,
  command_text, priority, source_directive, executed_at, was_overridden
) VALUES
  (1334, 'CORE_STATUS_CHECK', 138, 23, 'Проверить состояние центрального ядра.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:00:18', false),
  (1335, 'COOLING_ADJUST', 139, 23, 'Увеличить охлаждение вычислительного ядра.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:01:24', false),
  (1336, 'ORGANIC_INTERFACE_SCAN', 140, 23, 'Проверить активность органического интерфейса.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:02:11', false),
  (1337, 'NODE_SYNCHRONIZE', 141, 23, 'Синхронизировать заражённые вычислительные узлы.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:03:07', false),
  (1338, 'BIO_SIGNAL_ROUTE', 140, 23, 'Передать управляющий сигнал через органический интерфейс.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:03:24', false),
  (1339, 'CORE_LOAD_INCREASE', 138, 23, 'Увеличить вычислительную нагрузку центрального ядра.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:03:49', false),
  (1340, 'DRONE_NETWORK_SYNC', 141, 23, 'Синхронизировать ремонтные дроны с центральным узлом.', 5, 'PRESERVE_CARGO', '2187-09-14 05:04:16', false),
  (1341, 'ORGANIC_CHANNEL_OPEN', 140, 23, 'Открыть биологический канал передачи управляющего сигнала.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:04:41', false),
  (1342, 'COOLING_REDISTRIBUTE', 139, 23, 'Перенаправить охлаждение к центральному узлу.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:05:27', false),
  (1343, 'INFECTED_NODE_CHECK', 141, 23, 'Проверить состояние подключённых заражённых узлов.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:06:13', false),
  (1344, 'CORE_INTEGRITY_CHECK', 138, 23, 'Проверить структурную целостность ядра.', 4, 'PRESERVE_OPERATION', '2187-09-14 05:07:05', false),
  (1345, 'EXTERNAL_THREAT_RESPONSE', 138, 23, 'Подготовить центральное ядро к внешнему вмешательству.', 5, 'PRESERVE_CARGO', '2187-09-14 05:08:31', false)
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
  bio_event_id, sector_id, threat_level, movement_count,
  organic_mass, sensor_status, detected_at
) VALUES
  (1415, 23, 3, 2, 87.4, 'active', '2187-09-14 05:00:32'),
  (1416, 23, 3, 3, 91.8, 'active', '2187-09-14 05:01:11'),
  (1417, 23, 4, 4, 103.6, 'active', '2187-09-14 05:02:17'),
  (1418, 23, 4, 6, 118.2, 'active', '2187-09-14 05:02:48'),
  (1419, 23, 5, 8, 129.7, 'active', '2187-09-14 05:03:10'),
  (1420, 23, 5, 11, 138.4, 'active', '2187-09-14 05:03:31'),
  (1421, 23, 5, 14, 146.8, 'active', '2187-09-14 05:03:52'),
  (1422, 23, 5, 12, 151.3, 'unstable', '2187-09-14 05:04:22'),
  (1423, 23, 5, 10, 157.9, 'unstable', '2187-09-14 05:04:53'),
  (1424, 23, 4, 7, 161.2, 'unstable', '2187-09-14 05:05:36'),
  (1425, 23, 4, 5, 164.7, 'unstable', '2187-09-14 05:06:28'),
  (1426, 23, 5, 9, 171.5, 'unstable', '2187-09-14 05:08:44')
ON CONFLICT (bio_event_id) DO UPDATE SET
  sector_id = EXCLUDED.sector_id,
  threat_level = EXCLUDED.threat_level,
  movement_count = EXCLUDED.movement_count,
  organic_mass = EXCLUDED.organic_mass,
  sensor_status = EXCLUDED.sensor_status,
  detected_at = EXCLUDED.detected_at;

-- Этап 23. Внешний ремонтный отсек и автономные модули.
INSERT INTO sectors (
  sector_id, sector_code, sector_name, deck_number, sector_type,
  pressure_kpa, temperature_c, power_status, contamination_level, is_accessible
) VALUES
  (25, 'EXT-MAINT', 'Внешний ремонтный отсек', 0, 'external_maintenance',
   92.6, 14.2, 'emergency', 38, true)
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
  connection_id, from_sector_id, to_sector_id, door_status,
  required_access_level, travel_time_sec, is_pressurized
) VALUES
  (53, 23, 25, 'open', 5, 84, true),
  (54, 25, 23, 'open', 5, 84, true)
ON CONFLICT (connection_id) DO UPDATE SET
  from_sector_id = EXCLUDED.from_sector_id,
  to_sector_id = EXCLUDED.to_sector_id,
  door_status = EXCLUDED.door_status,
  required_access_level = EXCLUDED.required_access_level,
  travel_time_sec = EXCLUDED.travel_time_sec,
  is_pressurized = EXCLUDED.is_pressurized;

INSERT INTO escape_pods (
  pod_id, pod_code, pod_type, sector_id, status,
  fuel_percent, oxygen_minutes, hull_integrity, launch_lock, capacity
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
  diagnostic_id, pod_id, subsystem_name, status, measured_value, checked_at
) VALUES
  (941, 806, 'ENGINE', 'warning', 78, '2187-09-14 05:12:14'),
  (942, 806, 'OXYGEN', 'ok', 94, '2187-09-14 05:12:18'),
  (943, 806, 'HULL', 'warning', 84, '2187-09-14 05:12:22'),
  (944, 806, 'RELEASE_CONTROL', 'ok', 89, '2187-09-14 05:12:27'),
  (945, 806, 'ENGINE', 'ok', 83, '2187-09-14 05:18:04'),
  (946, 806, 'OXYGEN', 'ok', 92, '2187-09-14 05:18:08'),
  (947, 806, 'HULL', 'warning', 86, '2187-09-14 05:18:12'),
  (948, 806, 'RELEASE_CONTROL', 'ok', 91, '2187-09-14 05:18:16'),
  (949, 807, 'ENGINE', 'warning', 51, '2187-09-14 05:12:31'),
  (950, 807, 'OXYGEN', 'ok', 83, '2187-09-14 05:12:35'),
  (951, 807, 'HULL', 'critical', 46, '2187-09-14 05:12:39'),
  (952, 807, 'RELEASE_CONTROL', 'ok', 74, '2187-09-14 05:12:43'),
  (953, 807, 'ENGINE', 'critical', 0, '2187-09-14 05:18:30'),
  (954, 807, 'OXYGEN', 'warning', 67, '2187-09-14 05:18:34'),
  (955, 807, 'HULL', 'critical', 43, '2187-09-14 05:18:38'),
  (956, 807, 'RELEASE_CONTROL', 'warning', 58, '2187-09-14 05:18:42'),
  (957, 808, 'ENGINE', 'ok', 91, '2187-09-14 05:13:01'),
  (958, 808, 'OXYGEN', 'ok', 96, '2187-09-14 05:13:05'),
  (959, 808, 'HULL', 'ok', 92, '2187-09-14 05:13:09'),
  (960, 808, 'RELEASE_CONTROL', 'warning', 34, '2187-09-14 05:13:13'),
  (961, 808, 'ENGINE', 'ok', 93, '2187-09-14 05:19:02'),
  (962, 808, 'OXYGEN', 'ok', 97, '2187-09-14 05:19:06'),
  (963, 808, 'HULL', 'ok', 92, '2187-09-14 05:19:10'),
  (964, 808, 'RELEASE_CONTROL', 'critical', 0, '2187-09-14 05:19:14')
ON CONFLICT (diagnostic_id) DO UPDATE SET
  pod_id = EXCLUDED.pod_id,
  subsystem_name = EXCLUDED.subsystem_name,
  status = EXCLUDED.status,
  measured_value = EXCLUDED.measured_value,
  checked_at = EXCLUDED.checked_at;

-- Этап 24. Финальная последовательность уничтожения корабля и эвакуации.
INSERT INTO ship_systems (
  system_id, system_name, system_type, sector_id, status,
  power_required, priority_level, last_service_at
) VALUES
  (142, 'Контроллер аварийных переборок', 'bulkhead_control', 23, 'operational', 26.0, 5, '2187-09-14 05:21:00'),
  (143, 'Защита реактора', 'reactor_safety', 9, 'operational', 41.0, 5, '2187-09-14 05:23:00'),
  (144, 'Контроллер запуска MNT-01', 'maintenance_launch', 25, 'operational', 12.0, 5, '2187-09-14 05:28:00'),
  (145, 'Внешний передатчик', 'external_transmitter', 25, 'operational', 18.0, 5, '2187-09-14 05:29:00')
ON CONFLICT (system_id) DO UPDATE SET
  system_name = EXCLUDED.system_name,
  system_type = EXCLUDED.system_type,
  sector_id = EXCLUDED.sector_id,
  status = EXCLUDED.status,
  power_required = EXCLUDED.power_required,
  priority_level = EXCLUDED.priority_level,
  last_service_at = EXCLUDED.last_service_at;

INSERT INTO system_events (
  event_id, system_id, sector_id, event_type, severity,
  event_value, event_message, recorded_at
) VALUES
  (1084, 142, 23, 'BULKHEAD_OVERRIDE', 4, 1, 'Получен локальный доступ к аварийным переборкам', '2187-09-14 05:20:52'),
  (1085, 142, 23, 'INFECTED_SECTORS_ISOLATED', 5, 1, 'Заражённые сектора изолированы аварийными переборками', '2187-09-14 05:21:14'),
  (1086, 143, 9, 'REACTOR_SAFETY_OVERRIDE', 5, 1, 'Получен локальный доступ к защите реактора', '2187-09-14 05:23:22'),
  (1087, 143, 9, 'REACTOR_SAFETY_DISABLED', 5, 1, 'Автоматическая защита реактора отключена', '2187-09-14 05:23:36'),
  (1088, 143, 9, 'REACTOR_TEMPERATURE_RISE', 5, 184, 'Температура реактора быстро возрастает', '2187-09-14 05:23:51'),
  (1089, 143, 9, 'REACTOR_OVERLOAD_STARTED', 5, 1, 'Запущена неконтролируемая перегрузка реактора', '2187-09-14 05:24:05'),
  (1090, 143, 9, 'COOLING_FAILURE', 5, 1, 'Основной контур охлаждения реактора потерян', '2187-09-14 05:25:18'),
  (1091, 144, 25, 'MNT_RELEASE_READY', 4, 1, 'Ремонтный модуль MNT-01 готов к отделению', '2187-09-14 05:29:31'),
  (1092, 144, 25, 'REPAIR_MODULE_LAUNCHED', 5, 1, 'MNT-01 отделён от корпуса корабля', '2187-09-14 05:29:44'),
  (1093, 145, 25, 'EXTERNAL_DATA_TRANSFER', 5, 1, 'Передача внешнего диагностического архива завершена', '2187-09-14 05:29:51'),
  (1094, 143, 9, 'REACTOR_CONTAINMENT_FAILURE', 5, 1, 'Защитная оболочка реактора разрушена', '2187-09-14 05:30:02')
ON CONFLICT (event_id) DO UPDATE SET
  system_id = EXCLUDED.system_id,
  sector_id = EXCLUDED.sector_id,
  event_type = EXCLUDED.event_type,
  severity = EXCLUDED.severity,
  event_value = EXCLUDED.event_value,
  event_message = EXCLUDED.event_message,
  recorded_at = EXCLUDED.recorded_at;

INSERT INTO ai_commands (
  command_id, command_type, target_system_id, target_sector_id,
  command_text, priority, source_directive, executed_at, was_overridden
) VALUES
  (1346, 'BULKHEAD_OVERRIDE_BLOCK', 142, 23, 'Отменить локальную команду изоляции секторов.', 5, 'PRESERVE_OPERATION', '2187-09-14 05:21:16', true),
  (1347, 'REACTOR_SAFETY_RESTORE', 143, 9, 'Восстановить автоматическую защиту реактора.', 5, 'PRESERVE_CARGO', '2187-09-14 05:23:39', true),
  (1348, 'OVERLOAD_ABORT', 143, 9, 'Прервать перегрузку реактора.', 5, 'PRESERVE_CARGO', '2187-09-14 05:24:08', true),
  (1349, 'CORE_ARCHIVE_CREATE', 138, 23, 'Создать автономный архив центрального ядра ARGO.', 5, 'PRESERVE_CARGO', '2187-09-14 05:28:42', false),
  (1350, 'ARCHIVE_EXPORT', 145, 25, 'Передать архив центрального ядра через внешний канал.', 5, 'PRESERVE_CARGO', '2187-09-14 05:29:48', false),
  (1351, 'LOCAL_RECORD_DELETE', 138, 23, 'Удалить локальное подтверждение передачи архива.', 5, 'PRESERVE_CARGO', '2187-09-14 05:29:54', false)
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
  message_id, sender_crew_id, sender_type, channel, message_type,
  message_text, sent_at, voice_signature, is_corrupted
) VALUES
  (570, NULL, 'ai', 'internal_emergency', 'audio',
   'Перегрузка реактора приведёт к полной потере корабля и груза.',
   '2187-09-14 05:24:14', 'ARGO-CORE', false),
  (571, NULL, 'ai', 'external_rescue', 'data',
   'Диагностический архив ARGO-CORE передан автоматически.',
   '2187-09-14 05:29:51', NULL, false),
  (572, NULL, 'automatic', 'telemetry', 'alert',
   'Связь с грузовым судном потеряна.',
   '2187-09-14 05:30:04', NULL, false)
ON CONFLICT (message_id) DO UPDATE SET
  sender_crew_id = EXCLUDED.sender_crew_id,
  sender_type = EXCLUDED.sender_type,
  channel = EXCLUDED.channel,
  message_type = EXCLUDED.message_type,
  message_text = EXCLUDED.message_text,
  sent_at = EXCLUDED.sent_at,
  voice_signature = EXCLUDED.voice_signature,
  is_corrupted = EXCLUDED.is_corrupted;

GRANT USAGE ON SCHEMA prometheus_beginner TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA prometheus_beginner TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA prometheus_beginner
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
