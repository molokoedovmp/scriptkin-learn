-- =============================================================
-- «Полночный экспресс» — мир квеста в базе-песочнице.
-- Применять к базе SANDBOX (sqlquest_sandbox) под владельцем:
--   psql $SANDBOX_ADMIN -f db/quests/midnight-express.sandbox.sql
-- =============================================================

CREATE SCHEMA IF NOT EXISTS midnight_express;
SET search_path TO midnight_express;

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
  compartment integer NOT NULL
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
  arrival_time time NOT NULL,
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

INSERT INTO passengers (id, name, age, occupation, wagon, compartment) VALUES
  (1,  'Анна Карская',    34, 'журналистка',        1, 1),
  (2,  'Павел Мельник',   45, 'инженер',            1, 2),
  (3,  'Дарья Соколова',  28, 'художница',          2, 1),
  (4,  'Игорь Ветров',    52, 'профессор',          2, 3),
  (5,  'Лев Гончаров',    39, 'фотограф',           3, 2),
  (6,  'Марта Юдина',     61, 'пианистка',          3, 4),
  (7,  'Виктор Ланской',  47, 'антиквар',           4, 7),
  (8,  'Софья Белова',    30, 'врач',               4, 1),
  (9,  'Николай Крамер',  55, 'коллекционер',       4, 2),
  (10, 'Ирина Штерн',     33, 'переводчица',        4, 3),
  (11, 'Олег Тарасов',    41, 'машинист на пенсии', 5, 1),
  (12, 'Ева Ланге',       26, 'студентка',          5, 2);

INSERT INTO tickets (id, passenger_id, from_station, to_station, price, purchased_at) VALUES
  (1,  1,  'Москва', 'Санкт-Петербург', 3900, '2026-07-10'),
  (2,  2,  'Москва', 'Санкт-Петербург', 3900, '2026-07-08'),
  (3,  3,  'Москва', 'Бологое',         2100, '2026-07-12'),
  (4,  4,  'Москва', 'Санкт-Петербург', 4200, '2026-07-01'),
  (5,  5,  'Москва', 'Чудово',          3100, '2026-07-11'),
  (6,  6,  'Москва', 'Санкт-Петербург', 5600, '2026-06-28'),
  (7,  7,  'Москва', 'Санкт-Петербург', 4200, '2026-07-08'),
  -- Белова купила билет ПОСЛЕДНЕЙ, за день до отправления, — улика
  (8,  8,  'Москва', 'Санкт-Петербург', 3900, '2026-07-16'),
  (9,  9,  'Тверь',  'Санкт-Петербург', 3300, '2026-07-12'),
  (10, 11, 'Москва', 'Окуловка',        2800, '2026-07-09'),
  (11, 12, 'Москва', 'Санкт-Петербург', 2500, '2026-07-05');
-- У пассажира 10 (Ирина Штерн) билета нет — это часть сюжета.

INSERT INTO stations (id, name, arrival_time, stop_minutes) VALUES
  (1, 'Москва',          '23:55', 0),
  (2, 'Тверь',           '01:37', 3),
  (3, 'Вышний Волочёк',  '02:44', 2),
  (4, 'Бологое',         '03:05', 2),
  (5, 'Окуловка',        '04:02', 1),
  (6, 'Чудово',          '05:16', 2),
  (7, 'Санкт-Петербург', '06:55', 0);

INSERT INTO conductor_log (id, wagon, event_time, note) VALUES
  (1, 1, '00:15', 'обход: все пассажиры на местах'),
  (2, 4, '00:20', 'обход: все пассажиры на местах'),
  (3, 2, '01:37', 'стоянка Тверь, посадка пассажира'),
  (4, 4, '02:41', 'пассажир купе 7 попросил чай'),
  (5, 4, '02:58', 'хлопнула дверь тамбура'),
  (6, 4, '03:05', 'стоянка Бологое, две минуты'),
  (7, 5, '03:20', 'жалоба на шум в коридоре'),
  (8, 4, '03:12', 'купе 7 не отвечает, дверь приоткрыта'),
  (9, 4, '03:15', 'врач из купе 1 констатировала смерть'),
  (10,4, '03:25', 'купе 7 опечатано до прибытия');

INSERT INTO luggage (id, passenger_id, description, weight_kg) VALUES
  (1,  1, 'чемодан',                      9.0),
  (2,  2, 'рюкзак',                       6.5),
  (3,  4, 'портфель с рукописями',        5.0),
  (4,  6, 'дорожный кофр',               12.0),
  (5,  7, 'кофр с двойным дном',         17.5),
  (6,  7, 'дорожная сумка',               4.2),
  (7,  8, 'докторский саквояж',           7.2),
  (8,  9, 'саквояж с латунными уголками',11.3),
  (9, 12, 'рюкзак',                       5.4);

-- Доступ read-only роли игроков
GRANT USAGE ON SCHEMA midnight_express TO sqlquest_player;
GRANT SELECT ON ALL TABLES IN SCHEMA midnight_express TO sqlquest_player;
ALTER DEFAULT PRIVILEGES IN SCHEMA midnight_express
  GRANT SELECT ON TABLES TO sqlquest_player;

RESET search_path;
