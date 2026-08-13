-- =============================================================
-- Скрипткин — стартовые данные каталога (совпадают с демо-данными
-- в src/lib/quests.ts).
--
-- Первый играбельный квест «Полночный экспресс» добавляется отдельно:
--   psql $DATABASE_URL          -f db/quests/midnight-express.steps.sql
--   psql $SANDBOX_ADMIN_URL     -f db/quests/midnight-express.sandbox.sql
-- =============================================================

INSERT INTO quests (slug, title, tagline, intro, difficulty, steps_count, emoji, status, preview_url, price_kopecks, sort_order) VALUES
(
  'submarine-crash',
  'Крушение подлодки',
  'Исследовательская субмарина «Кальмар» терпит аварию в океанской бездне. Восстановите системы, исследуя бортовую базу данных.',
  'Вы — капитан исследовательской субмарины «Кальмар». После мощного взрыва корабль погружается всё глубже, проходы разрушены, а основные системы не отвечают. Единственный работающий терминал сохранил бортовую базу данных. Запрос за запросом вам предстоит оценить повреждения и вернуть контроль над субмариной.',
  'beginner', 20, '🌊', 'available', '/how-it-works/submarine.png', 0, 2
),
(
  'midnight-heist',
  'Ограбление галереи',
  'Из галереи исчезла картина. Логи пропусков и камер уже ждут твоих JOIN-ов.',
  'Ночью из городской галереи пропало полотно XVII века. Сигнализация молчала. У следствия есть база: сотрудники, пропуска, записи камер и график смен. Найди вора раньше, чем он покинет город.',
  'intermediate', 10, '🖼️', 'coming_soon', '/quests/midnight-heist/preview.webp', 50000, 3
),
(
  'mars-station',
  'Станция «Арес-9»',
  'Марсианская станция теряет кислород. Ответ спрятан в телеметрии за 400 солов.',
  'Датчики станции «Арес-9» фиксируют медленную утечку кислорода, но не могут сказать где. Тебе доступна телеметрия за 400 солов: миллионы показаний, оконные функции и очень мало времени.',
  'advanced', 12, '🚀', 'coming_soon', '/quests/mars-station/preview.webp', 50000, 4
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  intro = EXCLUDED.intro,
  difficulty = EXCLUDED.difficulty,
  steps_count = EXCLUDED.steps_count,
  emoji = EXCLUDED.emoji,
  status = EXCLUDED.status,
  preview_url = EXCLUDED.preview_url,
  price_kopecks = EXCLUDED.price_kopecks,
  sort_order = EXCLUDED.sort_order;
