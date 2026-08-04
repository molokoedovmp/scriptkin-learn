-- =============================================================
-- «Полночный экспресс» — мир квеста в базе-песочнице.
-- Применять к базе SANDBOX (sqlquest_sandbox) под владельцем:
--   psql $SANDBOX_ADMIN -f db/quests/midnight-express.sandbox.sql
-- =============================================================

CREATE SCHEMA IF NOT EXISTS midnight_express;
SET search_path TO midnight_express;

DROP TABLE IF EXISTS onboard_check;
DROP TABLE IF EXISTS luggage;
DROP TABLE IF EXISTS conductor_log;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS stations;
DROP TABLE IF EXISTS passengers;

CREATE TABLE passengers (
  id          integer PRIMARY KEY,
  name        text NOT NULL,
  age         integer NOT NULL,
  occupation  text NOT NULL,
  wagon       integer NOT NULL,
  coupe       integer NOT NULL
);

CREATE TABLE tickets (
  id           integer PRIMARY KEY,
  passenger_id integer NOT NULL REFERENCES passengers(id),
  from_station text NOT NULL,
  to_station   text NOT NULL,
  price        integer NOT NULL,
  purchased_at date NOT NULL
);

CREATE TABLE stations (
  id           integer PRIMARY KEY,
  name         text NOT NULL,
  -- Полная дата нужна для корректной сортировки маршрута через полночь.
  arrival_time timestamp NOT NULL,
  stop_minutes integer NOT NULL
);

CREATE TABLE conductor_log (
  id         integer PRIMARY KEY,
  wagon      integer NOT NULL,
  event_time time NOT NULL,
  note       text NOT NULL
);

CREATE TABLE luggage (
  id           integer PRIMARY KEY,
  passenger_id integer NOT NULL REFERENCES passengers(id),
  description  text NOT NULL,
  weight_kg    numeric(4,1) NOT NULL
);

-- Результат повторной именной переклички после Окуловки.
-- В отличие от исходного списка passengers, здесь только те, кого
-- проводники лично нашли в поезде во время контрольного обхода.
CREATE TABLE onboard_check (
  passenger_id integer PRIMARY KEY REFERENCES passengers(id),
  wagon        integer NOT NULL,
  checked_at   time NOT NULL
);

INSERT INTO passengers (id, name, age, occupation, wagon, coupe) VALUES
  (1,  'Алексей Северин', 38, 'сотрудник транспортной полиции', 1, 1),
  (2,  'Марина Осокина',  31, 'журналистка',                    1, 3),
  (3,  'Павел Гущин',     45, 'инженер-путеец',                 1, 5),
  (4,  'Алиса Вейс',      29, 'художница',                      2, 2),
  (5,  'Игорь Ветров',    63, 'профессор истории искусств',     2, 4),
  (6,  'Денис Царёв',     33, 'фотограф',                       3, 1),
  (7,  'Ева Ланге',       27, 'пианистка',                      3, 6),
  (8,  'Софья Белова',    36, 'врач-кардиолог',                 4, 1),
  (9,  'Николай Крамер',  61, 'коллекционер',                   4, 2),
  (10, 'Виктор Ланской',  47, 'антиквар',                       4, 7),
  (11, 'Степан Ковач',    68, 'машинист на пенсии',             5, 2),
  (12, 'Дарья Мельник',   20, 'студентка',                      5, 5),
  (13, 'Ирина Штерн',     44, 'переводчица',                    4, 3);

INSERT INTO tickets (id, passenger_id, from_station, to_station, price, purchased_at) VALUES
  (1,  1,  'Москва', 'Санкт-Петербург', 3900, '2026-07-10'),
  (2,  2,  'Москва', 'Санкт-Петербург', 3900, '2026-07-08'),
  (3,  3,  'Москва', 'Санкт-Петербург', 4100, '2026-07-12'),
  (4,  4,  'Москва', 'Санкт-Петербург', 3900, '2026-07-01'),
  (5,  5,  'Москва', 'Санкт-Петербург', 4200, '2026-07-11'),
  (6,  6,  'Москва', 'Чудово',          3100, '2026-06-28'),
  (7,  7,  'Москва', 'Санкт-Петербург', 5600, '2026-07-05'),
  (8,  8,  'Москва', 'Санкт-Петербург', 3900, '2026-07-16'),
  (9,  9,  'Тверь',  'Санкт-Петербург', 3300, '2026-07-12'),
  (10, 10, 'Москва', 'Санкт-Петербург', 4200, '2026-07-08'),
  (11, 11, 'Москва', 'Санкт-Петербург', 3900, '2026-07-09'),
  (12, 12, 'Москва', 'Санкт-Петербург', 2500, '2026-07-05');
-- У пассажира 13 (Ирина Штерн) билета нет — это часть сюжета.

INSERT INTO stations (id, name, arrival_time, stop_minutes) VALUES
  (1, 'Москва',          '2026-07-17 23:55:00', 0),
  (2, 'Тверь',           '2026-07-18 01:37:00', 3),
  (3, 'Вышний Волочёк',  '2026-07-18 02:44:00', 2),
  (4, 'Бологое',         '2026-07-18 03:05:00', 2),
  (5, 'Окуловка',        '2026-07-18 04:02:00', 1),
  (6, 'Чудово',          '2026-07-18 05:16:00', 2),
  (7, 'Санкт-Петербург', '2026-07-18 06:55:00', 0);

INSERT INTO conductor_log (id, wagon, event_time, note) VALUES
  (1, 1, '00:15', 'обход: все пассажиры на местах'),
  (2, 4, '00:20', 'обход: все пассажиры на местах'),
  (3, 4, '01:37', 'стоянка Тверь, посадка пассажира'),
  (4, 4, '02:41', 'Пассажир купе 7 попросил чай'),
  (5, 4, '02:58', 'Датчик зафиксировал открытие двери тамбура'),
  (6, 4, '03:05', 'Стоянка на станции Бологое'),
  (7, 5, '03:20', 'жалоба на шум в коридоре'),
  (8, 4, '03:12', 'купе 7 не отвечает, дверь приоткрыта'),
  (9, 4, '03:15', 'врач из купе 1 констатировала смерть'),
  (10,4, '03:25', 'купе 7 опечатано до прибытия');

INSERT INTO luggage (id, passenger_id, description, weight_kg) VALUES
  (1,  1, 'чемодан',                      9.0),
  (2,  2, 'рюкзак',                       6.5),
  (3,  5, 'портфель с рукописями',        5.0),
  (4,  7, 'дорожный кофр',               12.0),
  (5, 10, 'Деревянный кофр',             17.5),
  (6, 10, 'дорожная сумка',               4.2),
  (7,  8, 'докторский саквояж',           7.2),
  (8,  9, 'саквояж с латунными уголками',11.3),
  (9, 12, 'рюкзак',                       5.4);

INSERT INTO onboard_check (passenger_id, wagon, checked_at) VALUES
  (1,  1, '04:11'),
  (2,  1, '04:12'),
  (3,  1, '04:13'),
  (4,  2, '04:14'),
  (5,  2, '04:15'),
  (6,  3, '04:16'),
  (7,  3, '04:17'),
  (8,  4, '04:18'),
  (9,  4, '04:19'),
  (10, 4, '04:20'),
  (13, 4, '04:21'),
  (11, 5, '04:22'),
  (12, 5, '04:23');

-- Доступ read-only роли игроков
GRANT USAGE ON SCHEMA midnight_express TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA midnight_express TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA midnight_express
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
