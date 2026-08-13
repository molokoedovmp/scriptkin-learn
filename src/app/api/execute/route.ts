import { NextResponse } from "next/server";
import { getAppPool, getSandboxPool, isDatabaseConfigured } from "@/lib/db";
import { getServerPracticeTask } from "@/lib/practice";
import { getSessionUser } from "@/lib/auth";
import { getQuestAccess } from "@/lib/quest-access";
import type { ExecuteRequest, ExecuteResponse } from "@/lib/types";

const MAX_ROWS = 250;
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

  if (!practiceTask && body.questSlug && isDatabaseConfigured()) {
    const user = await getSessionUser();
    const access = await getQuestAccess(user?.id, body.questSlug, user?.email);
    if (!access.allowed) {
      return json(
        { ok: false, error: "Сначала оплати эту историю в своём аккаунте." },
        403
      );
    }
  }

  const submarineDeleteChoice =
    body.questSlug === "submarine-crash" &&
    body.stepNumber === 20 &&
    /^delete\s+from\s+"?readings"?\s+where\s+"?timestamp"?\s*>\s*(?:timestamp\s*)?'1962-06-04(?: 00:00:00)?'$/i.test(
      sql.replace(/\s+/g, " ")
    );
  const submarineViewChoice =
    body.questSlug === "submarine-crash" &&
    body.stepNumber === 20 &&
    /^select\s+\*\s+from\s+"?readings"?$/i.test(sql.replace(/\s+/g, " "));

  if (submarineDeleteChoice) {
    const user = await getSessionUser();
    if (!user) {
      return json({ ok: false, error: "Нужно войти, чтобы сохранить выбор." }, 401);
    }
    const { rows: steps } = await getAppPool().query<{ story: string }>(
      `SELECT story FROM quest_steps
        WHERE quest_slug = 'submarine-crash' AND step_number = 20`
    );
    await saveQuestChoice(user.id, "submarine-crash", 20, "delete");
    return json(
      {
        ok: true,
        columns: [],
        rows: [],
        correct: true,
        storyUnlocked: steps[0]?.story,
        choiceKey: "delete",
      },
      200
    );
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
    const result = await client.query({ text: sql, rowMode: "array" });
    columns = makeUniqueColumnNames(result.fields.map((field) => field.name));
    rows = normalizeResultRows(
      result.rows.slice(0, MAX_ROWS).map((row) =>
        Object.fromEntries(columns.map((column, index) => [column, row[index]]))
      )
    );
    if (practiceTask) {
      const expectedResult = await client.query({
        text: practiceTask.expectedSql,
        rowMode: "array",
      });
      practiceExpectedColumns = makeUniqueColumnNames(
        expectedResult.fields.map((field) => field.name)
      );
      practiceExpectedRows = normalizeResultRows(
        expectedResult.rows
          .slice(0, MAX_ROWS)
          .map((row) =>
            Object.fromEntries(
              practiceExpectedColumns.map((column, index) => [column, row[index]])
            )
          )
      );
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
  let choiceKey: string | undefined;
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
        correct = submarineViewChoice || rowsMatch(rows, expected);
        if (
          correct &&
          body.questSlug === "submarine-crash" &&
          (body.stepNumber === 10 || body.stepNumber === 11)
        ) {
          correct = rows.every(
            (row, index) =>
              index === 0 ||
              Number(rows[index - 1].weight_kg) <= Number(row.weight_kg)
          );
        }
        if (
          correct &&
          body.questSlug === "submarine-crash" &&
          body.stepNumber === 12
        ) {
          correct = rows.every(
            (row, index) =>
              index === 0 ||
              Number(rows[index - 1].total_weight) >= Number(row.total_weight)
          );
        }
        if (correct) {
          storyUnlocked = steps[0].story;
          if (
            body.questSlug === "submarine-crash" &&
            body.stepNumber === 20
          ) {
            const user = await getSessionUser();
            if (user) {
              await saveQuestChoice(user.id, body.questSlug, 20, "view");
            }
            choiceKey = "view";
          }
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

  return json(
    { ok: true, columns, rows, correct, checkHint, storyUnlocked, choiceKey },
    200
  );
}

function json(body: ExecuteResponse, status: number) {
  return NextResponse.json(body, { status });
}

/**
 * В базе станции хранят полную дату и время, чтобы маршрут корректно
 * сортировался через полночь. В учебной таблице показываем только время.
 */
function normalizeResultRows(
  rows: Record<string, unknown>[]
): Record<string, unknown>[] {
  return rows.map((row) =>
    Object.fromEntries(
      Object.entries(row).map(([column, value]) => [
        column,
        value instanceof Date
          ? column === "arrival_time"
            ? formatTime(value)
            : formatDateTime(value)
          : isPostgresInterval(value)
            ? formatInterval(value)
          : value,
      ])
    )
  );
}

type PostgresIntervalValue = {
  years?: number;
  months?: number;
  days?: number;
  hours?: number;
  minutes?: number;
  seconds?: number;
  toPostgres: () => string;
};

function isPostgresInterval(value: unknown): value is PostgresIntervalValue {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { toPostgres?: unknown }).toPostgres === "function"
  );
}

function formatInterval(value: PostgresIntervalValue): string {
  const years = value.years ?? 0;
  const months = value.months ?? 0;
  const days = value.days ?? 0;
  const hours = value.hours ?? 0;
  const minutes = value.minutes ?? 0;
  const seconds = value.seconds ?? 0;
  const wholeSeconds = Math.trunc(seconds);
  const fraction = Math.abs(seconds - wholeSeconds);
  const secondsText =
    String(Math.abs(wholeSeconds)).padStart(2, "0") +
    (fraction > 0 ? fraction.toFixed(6).slice(1).replace(/0+$/, "") : "");
  const sign = hours < 0 || minutes < 0 || seconds < 0 ? "-" : "";
  const time = `${sign}${String(Math.abs(hours)).padStart(2, "0")}:${String(
    Math.abs(minutes)
  ).padStart(2, "0")}:${secondsText}`;
  const dateParts = [
    years ? `${years} ${Math.abs(years) === 1 ? "year" : "years"}` : "",
    months ? `${months} ${Math.abs(months) === 1 ? "mon" : "mons"}` : "",
    days ? `${days} ${Math.abs(days) === 1 ? "day" : "days"}` : "",
  ].filter(Boolean);

  return dateParts.length > 0 ? `${dateParts.join(" ")} ${time}` : time;
}

function formatTime(value: Date): string {
  return [value.getHours(), value.getMinutes(), value.getSeconds()]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

function formatDateTime(value: Date): string {
  const date = [value.getFullYear(), value.getMonth() + 1, value.getDate()]
    .map((part, index) => String(part).padStart(index === 0 ? 4 : 2, "0"))
    .join("-");
  return `${date} ${formatTime(value)}`;
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

function makeUniqueColumnNames(names: string[]): string[] {
  const occurrences = new Map<string, number>();
  return names.map((name) => {
    const count = occurrences.get(name) ?? 0;
    occurrences.set(name, count + 1);
    return count === 0 ? name : `${name}:${count}`;
  });
}

async function saveQuestChoice(
  userId: string,
  questSlug: string,
  stepNumber: number,
  choiceKey: string
): Promise<void> {
  await getAppPool().query(
    `INSERT INTO quest_choices (user_id, quest_slug, step_number, choice_key)
     VALUES ($1, $2, $3, $4)
     ON CONFLICT (user_id, quest_slug, step_number) DO UPDATE SET
       choice_key = EXCLUDED.choice_key,
       chosen_at = now()`,
    [userId, questSlug, stepNumber, choiceKey]
  );
}
