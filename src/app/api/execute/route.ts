import { NextResponse } from "next/server";
import { getAppPool, getSandboxPool, isDatabaseConfigured } from "@/lib/db";
import { getServerPracticeTask } from "@/lib/practice";
import type { ExecuteRequest, ExecuteResponse } from "@/lib/types";

const MAX_ROWS = 100;
const MAX_SQL_LENGTH = 5000;

/**
 * POST /api/execute — выполняет SQL-запрос игрока в базе-песочнице
 * и проверяет сюжетный шаг или упражнение из банка заданий.
 *
 * Защита в глубину:
 *  1) подключение к песочнице идёт под read-only ролью (db/schema.sql);
 *  2) запрос выполняется в READ ONLY транзакции со statement_timeout;
 *  3) на уровне API — только один statement и лимит на размер запроса.
 */
export async function POST(req: Request) {
  let body: ExecuteRequest;
  try {
    body = (await req.json()) as ExecuteRequest;
  } catch {
    return json({ ok: false, error: "Некорректный JSON." }, 400);
  }

  const sql = (body.sql ?? "").trim().replace(/;+\s*$/, "");
  if (!sql) {
    return json({ ok: false, error: "Пустой запрос." }, 400);
  }
  if (sql.length > MAX_SQL_LENGTH) {
    return json({ ok: false, error: "Запрос слишком длинный." }, 400);
  }
  if (sql.includes(";")) {
    return json(
      { ok: false, error: "Можно выполнить только один запрос за раз." },
      400
    );
  }

  if (!process.env.SANDBOX_DATABASE_URL) {
    return json(
      {
        ok: false,
        error:
          "База-песочница не настроена. Задай SANDBOX_DATABASE_URL (см. .env.example и README).",
      },
      503
    );
  }

  const practiceTask = body.practiceTaskId
    ? getServerPracticeTask(body.questSlug, body.practiceTaskId)
    : null;
  if (body.practiceTaskId && !practiceTask) {
    return json({ ok: false, error: "Задание из банка не найдено." }, 404);
  }

  // Мир каждого квеста живёт в своей схеме песочницы
  const schema = await getSandboxSchema(body.questSlug);

  const client = await getSandboxPool().connect();
  let columns: string[] = [];
  let rows: Record<string, unknown>[] = [];
  let practiceExpectedColumns: string[] = [];
  let practiceExpectedRows: Record<string, unknown>[] = [];
  try {
    await client.query("BEGIN TRANSACTION READ ONLY");
    await client.query("SET LOCAL statement_timeout = '5s'");
    await client.query(`SET LOCAL search_path = "${schema}"`);
    const result = await client.query(sql);
    columns = result.fields.map((f) => f.name);
    rows = result.rows.slice(0, MAX_ROWS);
    if (practiceTask) {
      const expectedResult = await client.query(practiceTask.expectedSql);
      practiceExpectedColumns = expectedResult.fields.map((field) => field.name);
      practiceExpectedRows = expectedResult.rows.slice(0, MAX_ROWS);
    }
    await client.query("ROLLBACK");
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    const message = err instanceof Error ? err.message : "Ошибка выполнения.";
    return json({ ok: false, error: `Ошибка SQL: ${message}` }, 200);
  } finally {
    client.release();
  }

  // Банк проверяется по серверному эталону и не затрагивает прогресс квеста.
  let correct: boolean | undefined;
  let checkHint: string | undefined;
  let storyUnlocked: string | undefined;
  if (practiceTask) {
    correct = rowsMatch(
      rows,
      practiceExpectedRows,
      Boolean(practiceTask.orderMatters)
    );
    if (!correct) {
      checkHint = buildCheckHint(
        columns,
        rows,
        practiceExpectedColumns,
        practiceExpectedRows,
        Boolean(practiceTask.orderMatters)
      );
    }
  } else if (isDatabaseConfigured() && body.questSlug && body.stepNumber) {
    try {
      const { rows: steps } = await getAppPool().query(
        `SELECT expected_rows, story
           FROM quest_steps
          WHERE quest_slug = $1 AND step_number = $2`,
        [body.questSlug, body.stepNumber]
      );
      if (steps.length > 0 && steps[0].expected_rows != null) {
        const expected = steps[0].expected_rows as Record<string, unknown>[];
        correct = rowsMatch(rows, expected);
        if (correct) {
          storyUnlocked = steps[0].story;
        } else {
          checkHint = buildCheckHint(
            columns,
            rows,
            Object.keys(expected[0] ?? {}),
            expected
          );
        }
      }
    } catch (err) {
      console.error("Failed to check step answer:", err);
    }
  }

  return json({ ok: true, columns, rows, correct, checkHint, storyUnlocked }, 200);
}

function json(body: ExecuteResponse, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * Схема песочницы для квеста из quests.sandbox_schema.
 * Имя проверяется по строгому шаблону — оно попадает в SET search_path.
 */
async function getSandboxSchema(questSlug?: string): Promise<string> {
  if (!questSlug || !isDatabaseConfigured()) return "public";
  try {
    const { rows } = await getAppPool().query<{ sandbox_schema: string }>(
      `SELECT sandbox_schema FROM quests WHERE slug = $1`,
      [questSlug]
    );
    const schema = rows[0]?.sandbox_schema;
    if (schema && /^[a-z_][a-z0-9_]{0,62}$/.test(schema)) return schema;
  } catch (err) {
    console.error("Failed to resolve sandbox schema:", err);
  }
  return "public";
}

/**
 * Конкретная причина несовпадения: сначала сверяем набор колонок,
 * затем число строк. Названия колонок есть в тексте задания,
 * поэтому подсказка ничего не спойлерит.
 */
function buildCheckHint(
  columns: string[],
  rows: Record<string, unknown>[],
  expectedColumns: string[],
  expected: Record<string, unknown>[],
  orderMatters = false
): string | undefined {
  const expectedCols = [...expectedColumns].sort();
  const actualCols = [...columns].sort();
  if (JSON.stringify(expectedCols) !== JSON.stringify(actualCols)) {
    const missing = expectedCols.filter((c) => !actualCols.includes(c));
    const extra = actualCols.filter((c) => !expectedCols.includes(c));
    const parts: string[] = [
      `Ожидаются колонки: ${expectedCols.join(", ")}.`,
    ];
    if (missing.length > 0) parts.push(`Не хватает: ${missing.join(", ")}.`);
    if (extra.length > 0) parts.push(`Лишние: ${extra.join(", ")}.`);
    return parts.join(" ");
  }
  if (rows.length !== expected.length) {
    return `Колонки верные, но строк ${rows.length}, а ожидается ${expected.length}. Проверь условие WHERE.`;
  }
  if (
    orderMatters &&
    rowsMatch(rows, expected, false) &&
    !rowsMatch(rows, expected, true)
  ) {
    return "Данные верные, но порядок строк отличается. Добавь или проверь ORDER BY.";
  }
  return "Колонки и число строк верные — проверь сами значения: возможно, условие захватывает не те строки.";
}

/**
 * Сравнение результата игрока с эталоном. Для сюжетных шагов порядок
 * не важен, а тренировочное задание может явно потребовать ORDER BY.
 * Значения приводятся к строкам, чтобы не спотыкаться о типы драйвера.
 */
function rowsMatch(
  actual: Record<string, unknown>[],
  expected: Record<string, unknown>[],
  orderMatters = false
): boolean {
  if (!Array.isArray(expected) || actual.length !== expected.length) {
    return false;
  }
  const canon = (rows: Record<string, unknown>[]) => {
    const normalized = rows.map((row) =>
        JSON.stringify(
          Object.keys(row)
            .sort()
            .map((k) => [k, String(row[k])])
        )
      );
    return orderMatters ? normalized : normalized.sort();
  };
  const a = canon(actual);
  const b = canon(expected);
  return a.every((row, i) => row === b[i]);
}
