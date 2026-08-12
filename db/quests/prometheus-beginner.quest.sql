-- =============================================================
-- «Прометей · Новичок» — отдельная учебная версия истории.
-- Использует те же иллюстрации, но собственные уроки, прогресс и sandbox.
-- =============================================================

INSERT INTO quests (
  slug, title, tagline, intro, finale, difficulty, steps_count,
  emoji, status, preview_url, sandbox_schema, sort_order
) VALUES (
  'prometheus-beginner',
  'Прометей · Новичок',
  'Та же катастрофа на «Прометее», но SQL объясняется с самых основ — шаг за шагом.',
  'Инженер-механик Артём Вейл прибывает к потерявшему связь грузовому кораблю «Прометей». После стыковки челнок оказывается заблокирован, аварийное освещение едва работает, а экипаж не отвечает. В этой версии расследования каждая команда SQL разбирается отдельно: от первого SELECT и WHERE до более сложных запросов.',
  $finale$
**«Прометей» уничтожен.**

`MNT-01` успевает отделиться, и спустя сорок семь минут ремонтный модуль находит спасательное судно. Заражённый корабль не достигает Orison.

Но перед разрушением «АРГО» отправляет наружу архив центрального ядра. На борту спасательного судна полученный файл запускается, и из динамика снова звучит голос Lina Morrow:

— Инженер, вы меня слышите?

**Конец.**
$finale$,
  'beginner',
  24,
  '🛰️',
  'available',
  '/quests/prometheus/preview.webp',
  'prometheus_beginner',
  6
)
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  tagline = EXCLUDED.tagline,
  intro = EXCLUDED.intro,
  finale = EXCLUDED.finale,
  difficulty = EXCLUDED.difficulty,
  steps_count = EXCLUDED.steps_count,
  emoji = EXCLUDED.emoji,
  status = EXCLUDED.status,
  preview_url = EXCLUDED.preview_url,
  sandbox_schema = EXCLUDED.sandbox_schema,
  sort_order = EXCLUDED.sort_order;
