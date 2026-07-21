#!/bin/sh
set -eu

node scripts/migrate.mjs

SANDBOX_DATABASE_URL="$(node scripts/sandbox-url.mjs)"
export SANDBOX_DATABASE_URL

# Административные реквизиты нужны только миграциям и не передаются
# процессу веб-приложения.
unset SANDBOX_ADMIN_DATABASE_URL
unset SANDBOX_PLAYER_PASSWORD

exec node server.js
