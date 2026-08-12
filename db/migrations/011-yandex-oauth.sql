ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

CREATE TABLE IF NOT EXISTS oauth_accounts (
  provider         text NOT NULL,
  provider_user_id text NOT NULL,
  user_id          uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at       timestamptz NOT NULL DEFAULT now(),
  updated_at       timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (provider, provider_user_id),
  UNIQUE (provider, user_id)
);

CREATE INDEX IF NOT EXISTS oauth_accounts_user_id_idx
  ON oauth_accounts(user_id);
