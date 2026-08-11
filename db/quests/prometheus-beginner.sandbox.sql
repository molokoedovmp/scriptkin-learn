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
   '2187-09-14 03:22:31', 'VOICE-LM-01', false),
  (507, 223, 'crew', 'communications', 'audio',
   'Связь с командным центром потеряна.',
   '2187-09-14 03:24:09', 'VOICE-RS-02', true),
  (508, NULL, 'automatic', 'internal_emergency', 'alert',
   'Закрытие герметичных дверей жилого сектора.',
   '2187-09-14 03:27:16', NULL, false),
  (509, 219, 'crew', 'internal_emergency', 'audio',
   'Не использовать основной коридор медицинского блока.',
   '2187-09-14 03:29:47', 'VOICE-LM-01', false),
  (510, 221, 'crew', 'security', 'audio',
   'Группа безопасности направляется в жилой сектор.',
   '2187-09-14 03:31:12', 'VOICE-GW-03', true),
  (511, NULL, 'automatic', 'internal_emergency', 'alert',
   'Зафиксировано движение в вентиляционных каналах.',
   '2187-09-14 03:34:51', NULL, false),
  (512, 219, 'crew', 'internal_emergency', 'audio',
   'Маршрут через медицинский коридор заблокирован.',
   '2187-09-14 03:37:22', 'VOICE-LM-01', false),
  (513, NULL, 'automatic', 'internal_emergency', 'alert',
   'Эвакуационный протокол временно недоступен.',
   '2187-09-14 03:41:08', NULL, false),
  (514, 219, 'crew', 'internal_emergency', 'audio',
   'Инженер, следуйте к эвакуационным капсулам через склад оборудования.',
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

GRANT USAGE ON SCHEMA prometheus_beginner TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA prometheus_beginner TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA prometheus_beginner
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
