CREATE TABLE IF NOT EXISTS quest_choices (
  user_id      uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quest_slug   text NOT NULL REFERENCES quests(slug) ON DELETE CASCADE,
  step_number  integer NOT NULL CHECK (step_number > 0),
  choice_key   text NOT NULL,
  chosen_at    timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, quest_slug, step_number)
);

CREATE INDEX IF NOT EXISTS quest_choices_quest_step_idx
  ON quest_choices(quest_slug, step_number, choice_key);
