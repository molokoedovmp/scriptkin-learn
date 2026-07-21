"use client";

import { useState } from "react";
import type { ExecuteResponse } from "@/lib/types";
import { getQuestSqlSchema } from "@/lib/sql-schema";
import { Button } from "./Button";
import { SqlEditor } from "./SqlEditor";

/**
 * SQL-терминал квеста. Отправляет запрос игрока в /api/execute,
 * показывает результат и сообщает наверх о правильном ответе.
 */
export function SqlRunner({
  questSlug,
  stepNumber,
  onCorrect,
}: {
  questSlug: string;
  stepNumber: number;
  onCorrect?: () => void;
}) {
  const [sql, setSql] = useState("");
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const schema = getQuestSqlSchema(questSlug);

  async function run() {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questSlug, stepNumber, sql }),
      });
      const data = (await res.json()) as ExecuteResponse;
      setResult(data);
      if (data.ok && data.correct) {
        onCorrect?.();
      }
    } catch {
      setResult({ ok: false, error: "Не удалось связаться с сервером." });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border-2 border-[#e5e5e5]">
      <div className="rounded-t-[10px] border-b-2 border-[#e5e5e5] bg-night-ink px-4 py-2">
        <span className="text-caption font-bold uppercase tracking-wide text-fresh-leaf">
          SQL-терминал
        </span>
      </div>
      <div className="bg-night-ink">
        <SqlEditor
          value={sql}
          onChange={setSql}
          onRun={run}
          schema={schema}
          placeholder="-- напиши свой запрос, например: SELECT * FROM passengers"
        />
      </div>
      <div className="flex items-center justify-between gap-4 p-4">
        <p className="text-caption font-medium text-pencil-gray">
          Только SELECT — база доступна в режиме чтения.{" "}
          <span className="text-faded-gray">⌘/Ctrl + Enter — выполнить</span>
        </p>
        <Button onClick={run} disabled={loading || !sql.trim()}>
          {loading ? "Выполняю…" : "Выполнить"}
        </Button>
      </div>

      {result && (
        <div className="border-t-2 border-[#e5e5e5] p-4">
          {result.error && (
            <p className="text-body font-bold text-[#ea2b2b]">{result.error}</p>
          )}
          {result.ok && result.correct && (
            <p className="mb-3 text-body font-bold text-eager-green">
              Верно! Следующая глава открыта.
            </p>
          )}
          {result.ok && result.correct === false && (
            <p className="mb-3 text-body font-bold text-spark-blue">
              Запрос выполнен, но это ещё не ответ.{" "}
              {result.checkHint ??
                "Посмотри на результат и сверься с заданием: те ли колонки, те ли строки?"}
            </p>
          )}
          {result.ok && result.columns && result.rows && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-caption">
                <thead>
                  <tr>
                    {result.columns.map((col) => (
                      <th
                        key={col}
                        className="border-b-2 border-[#e5e5e5] px-3 py-2 font-bold uppercase text-pencil-gray"
                      >
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.rows.map((row, i) => (
                    <tr key={i}>
                      {result.columns!.map((col) => (
                        <td
                          key={col}
                          className="border-b border-[#f0f0f0] px-3 py-2 font-medium text-charcoal"
                        >
                          {String(row[col] ?? "")}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-caption font-medium text-faded-gray">
                {result.rows.length}{" "}
                {plural(result.rows.length, "строка", "строки", "строк")}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return few;
  return many;
}
