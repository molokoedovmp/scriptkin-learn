-- =============================================================
-- SQL Quest — схема основной базы данных (DATABASE_URL)
-- Каталог квестов, шаги с сюжетом и эталонными ответами, прогресс.
-- =============================================================

CREATE TABLE IF NOT EXISTS quests (
  slug           text PRIMARY KEY,
  title          text NOT NULL,
  tagline        text NOT NULL,
  intro          text NOT NULL,
  -- Финальная глава: показывается после решения последнего шага
  finale         text,
  difficulty     text NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  steps_count    integer NOT NULL DEFAULT 0,
  emoji          text NOT NULL DEFAULT '🗺️',
  status         text NOT NULL DEFAULT 'coming_soon' CHECK (status IN ('available', 'coming_soon')),
  -- Обложка квеста для карточек каталога (файл из public/)
  preview_url    text,
  -- Схема в базе-песочнице, где живёт «мир» этого квеста
  sandbox_schema text NOT NULL DEFAULT 'public',
  sort_order     integer NOT NULL DEFAULT 0,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS quest_steps (
  quest_slug    text NOT NULL REFERENCES quests(slug) ON DELETE CASCADE,
  step_number   integer NOT NULL,
  title         text NOT NULL,
  -- Глава сюжета, которую игрок читает перед заданием
  story         text NOT NULL,
  -- Развитие истории после правильного ответа: что дал результат запроса
  outcome       text,
  -- Обучающий блок: какие команды нужны на шаге и как они работают.
  -- Разметка: **жирный**, `код`, ```блоки кода```, списки через "- "
  theory        text,
  -- Задание для игрока
  task          text NOT NULL,
  hint          text,
  -- Эталонный результат: массив объектов-строк, с которым сравнивается
  -- результат запроса игрока (без учёта порядка строк)
  expected_rows jsonb,
  PRIMARY KEY (quest_slug, step_number)
);

-- Сцены визуальной новеллы между уровнями: кадры с картинкой, репликой
-- и говорящим. after_step = 0 — пролог перед первым шагом,
-- after_step = N — сцена после решения шага N.
CREATE TABLE IF NOT EXISTS quest_scenes (
  quest_slug  text NOT NULL REFERENCES quests(slug) ON DELETE CASCADE,
  after_step  integer NOT NULL,
  frame_order integer NOT NULL,
  -- Путь к иллюстрации (например /quests/<slug>/scene.svg из public/)
  image_url   text,
  -- Кто говорит; NULL — текст рассказчика
  speaker     text,
  text        text NOT NULL,
  PRIMARY KEY (quest_slug, after_step, frame_order)
);

-- Пользователи. Пароль хранится как scrypt-хеш в формате "salt:hash".
CREATE TABLE IF NOT EXISTS users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  name          text NOT NULL,
  bio           text,
  password_hash text NOT NULL,
  -- Момент согласия на обработку персональных данных (152-ФЗ)
  pd_consent_at timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE users ADD COLUMN IF NOT EXISTS bio text;
ALTER TABLE users DROP CONSTRAINT IF EXISTS users_bio_check;
ALTER TABLE users ADD CONSTRAINT users_bio_check
  CHECK (bio IS NULL OR char_length(bio) <= 500);

-- Серверные сессии: httpOnly-cookie хранит только случайный токен.
CREATE TABLE IF NOT EXISTS sessions (
  token      text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS sessions_user_id_idx ON sessions(user_id);

-- Одноразовые ссылки восстановления пароля. В базе хранится только SHA-256
-- токена из письма; после смены пароля все старые сессии отзываются.
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  token_hash text PRIMARY KEY,
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at timestamptz NOT NULL,
  used_at    timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS password_reset_tokens_user_idx
  ON password_reset_tokens(user_id, created_at DESC);

-- Прогресс игроков по квестам.
CREATE TABLE IF NOT EXISTS quest_progress (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_slug   text NOT NULL REFERENCES quests(slug) ON DELETE CASCADE,
  current_step integer NOT NULL DEFAULT 1,
  completed_at timestamptz,
  updated_at   timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_slug)
);

-- Запросы в друзья. Пара пользователей может иметь только одну связь,
-- независимо от того, кто первым отправил приглашение.
CREATE TABLE IF NOT EXISTS friendships (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  addressee_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  status       text NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'accepted')),
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  CHECK (requester_id <> addressee_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS friendships_pair_idx
  ON friendships (
    LEAST(requester_id, addressee_id),
    GREATEST(requester_id, addressee_id)
  );
CREATE INDEX IF NOT EXISTS friendships_requester_idx ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS friendships_addressee_idx ON friendships(addressee_id);

-- Короткие публикации пользователя. В ленте видны свои посты и посты друзей.
CREATE TABLE IF NOT EXISTS user_posts (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content    text NOT NULL CHECK (char_length(content) BETWEEN 1 AND 5000),
  tags       text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Старые установки создавали ограничение на 1000 символов. Форматированные
-- публикации и блоки кода могут быть длиннее.
ALTER TABLE user_posts DROP CONSTRAINT IF EXISTS user_posts_content_check;
ALTER TABLE user_posts ADD CONSTRAINT user_posts_content_check
  CHECK (char_length(content) BETWEEN 1 AND 5000);

ALTER TABLE user_posts ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';
ALTER TABLE user_posts DROP CONSTRAINT IF EXISTS user_posts_tags_check;
ALTER TABLE user_posts ADD CONSTRAINT user_posts_tags_check CHECK (
  cardinality(tags) <= 3
  AND tags <@ ARRAY['sql', 'question', 'solution', 'progress', 'help', 'useful']::text[]
);

CREATE INDEX IF NOT EXISTS user_posts_user_created_idx
  ON user_posts(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS user_posts_tags_idx ON user_posts USING gin(tags);

-- События для календаря активности: решённые шаги квестов и задания банка.
-- reference_key не позволяет одному действию начислиться дважды.
CREATE TABLE IF NOT EXISTS learning_activity (
  id             bigserial PRIMARY KEY,
  user_id        uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_type  text NOT NULL CHECK (activity_type IN ('quest_step', 'practice_task')),
  reference_key  text NOT NULL,
  quest_slug     text REFERENCES quests(slug) ON DELETE SET NULL,
  points         integer NOT NULL DEFAULT 1 CHECK (points > 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, activity_type, reference_key)
);

CREATE INDEX IF NOT EXISTS learning_activity_user_created_idx
  ON learning_activity(user_id, created_at DESC);

-- Старый прогресс тоже появляется на календаре хотя бы одной точкой в день.
INSERT INTO learning_activity (
  user_id, activity_type, reference_key, quest_slug, points, created_at
)
SELECT user_id,
       'quest_step',
       'legacy:' || quest_slug,
       quest_slug,
       GREATEST(current_step - 1, CASE WHEN completed_at IS NOT NULL THEN 1 ELSE 0 END),
       updated_at
  FROM quest_progress
 WHERE current_step > 1 OR completed_at IS NOT NULL
ON CONFLICT (user_id, activity_type, reference_key) DO NOTHING;

-- =============================================================
-- База-песочница (SANDBOX_DATABASE_URL) — отдельная база, в которой
-- живут «миры» квестов и выполняются запросы игроков.
--
-- Выполни в базе sqlquest_sandbox под суперпользователем:
--
--   CREATE ROLE sqlquest_player LOGIN PASSWORD 'sqlquest_player';
--   GRANT CONNECT ON DATABASE sqlquest_sandbox TO sqlquest_player;
--   GRANT USAGE ON SCHEMA public TO sqlquest_player;
--   GRANT SELECT ON ALL TABLES IN SCHEMA public TO sqlquest_player;
--   ALTER DEFAULT PRIVILEGES IN SCHEMA public
--     GRANT SELECT ON TABLES TO sqlquest_player;
--
-- Таблицы миров (crew, compartments, sensor_logs, …) добавятся
-- вместе с контентом квестов.
-- =============================================================
