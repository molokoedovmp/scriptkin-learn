import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import pg from "pg";

const { Client } = pg;
const MIGRATION_LOCK_ID = 731_904_221;
const PLAYER_ROLE = "sqlquest_player";

const mainDatabaseUrl = requiredEnvironment("DATABASE_URL");
const sandboxAdminDatabaseUrl = requiredEnvironment(
  "SANDBOX_ADMIN_DATABASE_URL"
);
const sandboxPlayerPassword = requiredEnvironment("SANDBOX_PLAYER_PASSWORD");

if (sandboxPlayerPassword.length < 24) {
  throw new Error("SANDBOX_PLAYER_PASSWORD должен содержать не менее 24 символов.");
}

await migrateDatabase(mainDatabaseUrl, "основная база", [
  ["001-main-schema", "db/schema.sql"],
  ["002-main-seed", "db/seed.sql"],
  ["003-midnight-express-steps", "db/quests/midnight-express.steps.sql"],
  ["004-midnight-express-scenes", "db/quests/midnight-express.scenes.sql"],
]);

const sandboxClient = new Client({ connectionString: sandboxAdminDatabaseUrl });
await sandboxClient.connect();

try {
  await configureSandboxPlayer(sandboxClient, sandboxPlayerPassword);
  await runMigrations(sandboxClient, "песочница", [
    [
      "001-midnight-express-sandbox",
      "db/quests/midnight-express.sandbox.sql",
    ],
  ]);
} finally {
  await sandboxClient.end();
}

console.log("[database] Инициализация завершена.");

async function migrateDatabase(connectionString, label, migrations) {
  const client = new Client({ connectionString });
  await client.connect();

  try {
    await runMigrations(client, label, migrations);
  } finally {
    await client.end();
  }
}

async function runMigrations(client, label, migrations) {
  await client.query("SELECT pg_advisory_lock($1)", [MIGRATION_LOCK_ID]);

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.scriptkin_migrations (
        name       text PRIMARY KEY,
        checksum   text NOT NULL,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    for (const [name, relativePath] of migrations) {
      await applyMigration(client, label, name, relativePath);
    }
  } finally {
    await client.query("SELECT pg_advisory_unlock($1)", [MIGRATION_LOCK_ID]);
  }
}

async function applyMigration(client, label, name, relativePath) {
  const sql = await readFile(resolve(process.cwd(), relativePath), "utf8");
  const checksum = createHash("sha256").update(sql).digest("hex");
  const existing = await client.query(
    "SELECT checksum FROM public.scriptkin_migrations WHERE name = $1",
    [name]
  );

  if (existing.rows[0]?.checksum === checksum) {
    console.log(`[database] ${label}: ${name} уже применена.`);
    return;
  }

  console.log(`[database] ${label}: применяю ${name}...`);
  await client.query("BEGIN");

  try {
    await client.query(sql);
    await client.query(
      `INSERT INTO public.scriptkin_migrations (name, checksum, applied_at)
       VALUES ($1, $2, now())
       ON CONFLICT (name) DO UPDATE
         SET checksum = EXCLUDED.checksum,
             applied_at = EXCLUDED.applied_at`,
      [name, checksum]
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

async function configureSandboxPlayer(client, password) {
  const role = await client.query(
    "SELECT 1 FROM pg_roles WHERE rolname = $1",
    [PLAYER_ROLE]
  );

  if (role.rowCount === 0) {
    await client.query(`CREATE ROLE ${quoteIdentifier(PLAYER_ROLE)} LOGIN`);
  }

  await client.query(`
    ALTER ROLE ${quoteIdentifier(PLAYER_ROLE)}
      WITH LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOREPLICATION NOBYPASSRLS
      PASSWORD ${quoteLiteral(password)}
  `);
  await client.query(`
    ALTER ROLE ${quoteIdentifier(PLAYER_ROLE)}
      SET default_transaction_read_only = on
  `);
  await client.query(`
    ALTER ROLE ${quoteIdentifier(PLAYER_ROLE)}
      SET statement_timeout = '5s'
  `);

  const database = await client.query("SELECT current_database() AS name");
  const databaseName = database.rows[0].name;
  await client.query(
    `REVOKE TEMPORARY ON DATABASE ${quoteIdentifier(databaseName)} FROM PUBLIC`
  );
  await client.query(
    `GRANT CONNECT ON DATABASE ${quoteIdentifier(databaseName)} TO ${quoteIdentifier(PLAYER_ROLE)}`
  );
}

function requiredEnvironment(name) {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Не задана обязательная переменная ${name}.`);
  return value;
}

function quoteIdentifier(value) {
  return `"${String(value).replaceAll('"', '""')}"`;
}

function quoteLiteral(value) {
  if (value.includes("\0")) throw new Error("Пароль содержит недопустимый символ.");
  return `'${value.replaceAll("'", "''")}'`;
}
