/**
 * Схема песочницы каждого квеста для автодополнения в SQL-редакторе:
 * таблица → список колонок. Используется только клиентом (подсказки
 * в CodeMirror), поэтому здесь не текстов заданий и решений — просто
 * имена, безопасные для показа до решения шага.
 */
export const QUEST_SQL_SCHEMAS: Record<string, Record<string, string[]>> = {
  "midnight-express": {
    passengers: ["id", "name", "age", "occupation", "wagon", "coupe"],
    tickets: [
      "id",
      "passenger_id",
      "from_station",
      "to_station",
      "price",
      "purchased_at",
    ],
    stations: ["id", "name", "arrival_time", "stop_minutes"],
    conductor_log: ["id", "wagon", "event_time", "note"],
    luggage: ["id", "passenger_id", "description", "weight_kg"],
    onboard_check: ["passenger_id", "wagon", "checked_at"],
  },
};

export function getQuestSqlSchema(
  questSlug: string
): Record<string, string[]> | undefined {
  return QUEST_SQL_SCHEMAS[questSlug];
}
