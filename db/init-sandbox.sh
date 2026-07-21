#!/bin/sh
# Выполняется автоматически при первом старте контейнера postgres:
# создаёт базу-песочницу и read-only роль для запросов игроков.
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
  CREATE DATABASE sqlquest_sandbox;
  CREATE ROLE sqlquest_player LOGIN PASSWORD 'sqlquest_player';
  GRANT CONNECT ON DATABASE sqlquest_sandbox TO sqlquest_player;
EOSQL

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname sqlquest_sandbox <<-EOSQL
  GRANT USAGE ON SCHEMA public TO sqlquest_player;
  GRANT SELECT ON ALL TABLES IN SCHEMA public TO sqlquest_player;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public
    GRANT SELECT ON TABLES TO sqlquest_player;
EOSQL
