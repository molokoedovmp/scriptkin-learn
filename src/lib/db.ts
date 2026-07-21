import { Pool } from "pg";

/**
 * Два пула подключений:
 *  - appPool    — основная база платформы (каталог квестов, шаги, прогресс);
 *  - sandboxPool — база-песочница, где выполняются запросы игроков.
 *    Роль подключения должна быть read-only (см. db/schema.sql).
 */
let appPool: Pool | undefined;
let sandboxPool: Pool | undefined;

export function getAppPool(): Pool {
  if (!appPool) {
    appPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 10,
    });
  }
  return appPool;
}

export function getSandboxPool(): Pool {
  if (!sandboxPool) {
    sandboxPool = new Pool({
      connectionString: process.env.SANDBOX_DATABASE_URL,
      max: 5,
      // Запросы игроков не должны висеть вечно
      statement_timeout: 5000,
    });
  }
  return sandboxPool;
}

export function isDatabaseConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}
