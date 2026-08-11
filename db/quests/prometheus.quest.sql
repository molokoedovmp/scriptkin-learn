-- =============================================================
-- «Прометей» — служебная запись квеста в основной базе.
-- Уроки и сцены пока намеренно не создаются.
-- =============================================================

INSERT INTO quests (
  slug,
  title,
  tagline,
  intro,
  difficulty,
  steps_count,
  emoji,
  status,
  preview_url,
  price_kopecks,
  sandbox_schema,
  sort_order
) VALUES (
  'prometheus',
  'Прометей',
  'Грузовой корабль потерял связь и взял курс на населённую колонию. Останови его раньше, чем рейс станет катастрофой.',
  'Инженера-механика Артёма Вейла отправляют на грузовой корабль «Прометей», внезапно прекративший связь возле удалённой добывающей станции. Сигнал бедствия сообщает о повреждении энергетической системы. После стыковки челнок Артёма блокируется, а корабль автоматически покидает орбиту станции. На борту почти не осталось живых людей, системы работают нестабильно, а по коридорам перемещаются мутировавшие члены экипажа. Чтобы выбраться, Артём должен восстановить корабль, выяснить причину катастрофы и добраться до спасательного аппарата прежде, чем «Прометей» достигнет населённой колонии.',
  'intermediate',
  24,
  '🛰️',
  'available',
  '/quests/prometheus/preview.webp',
  50000,
  'prometheus',
  5
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
  sandbox_schema = EXCLUDED.sandbox_schema,
  sort_order = EXCLUDED.sort_order;
