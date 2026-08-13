-- «Крушение подлодки» — карточка истории в основной базе.

INSERT INTO quests (
  slug, title, tagline, intro, finale, difficulty, steps_count,
  emoji, status, preview_url, sandbox_schema, sort_order, price_kopecks
) VALUES (
  'submarine-crash',
  'Крушение подлодки',
  'Исследовательская субмарина «Кальмар» терпит аварию в океанской бездне. Восстановите системы, исследуя бортовую базу данных.',
  'Вы — капитан исследовательской субмарины «Кальмар». После мощного взрыва корабль погружается всё глубже, проходы разрушены, а основные системы не отвечают. Единственный работающий терминал сохранил бортовую базу данных. Запрос за запросом вам предстоит оценить повреждения и вернуть контроль над субмариной.',
  $finale$
**КВЕСТ ЗАВЕРШЁН**

Ваш последний приказ выполнен, а выбранная концовка сохранена. Спасательные капсулы продолжают подъём к поверхности.
$finale$,
  'beginner',
  20,
  '🌊',
  'available',
  '/how-it-works/submarine.png',
  'submarine_crash',
  2,
  0
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
  sort_order = EXCLUDED.sort_order,
  price_kopecks = EXCLUDED.price_kopecks;
