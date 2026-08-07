-- =============================================================
-- «Прометей · Новичок» — отдельная песочница первого этапа.
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

GRANT USAGE ON SCHEMA prometheus_beginner TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA prometheus_beginner TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA prometheus_beginner
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
