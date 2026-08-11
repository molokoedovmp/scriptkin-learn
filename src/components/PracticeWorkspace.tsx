"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import type {
  ExecuteResponse,
  PracticeDatabase,
  PracticeDifficulty,
  PracticeTask,
} from "@/lib/types";
import { SqlEditor } from "./SqlEditor";

const DIFFICULTY: Record<
  PracticeDifficulty,
  { label: string; className: string; dot: string }
> = {
  easy: {
    label: "Легко",
    className: "bg-[#efffdf] text-[#3f9900]",
    dot: "bg-eager-green",
  },
  medium: {
    label: "Средне",
    className: "bg-[#e8f7ff] text-[#0784bf]",
    dot: "bg-spark-blue",
  },
  hard: {
    label: "Сложно",
    className: "bg-[#eeeff8] text-night-ink",
    dot: "bg-night-ink",
  },
};

type DifficultyFilter = "all" | PracticeDifficulty;

export function PracticeWorkspace({
  databases,
}: {
  databases: PracticeDatabase[];
}) {
  const [databaseSlug, setDatabaseSlug] = useState(databases[0]?.questSlug ?? "");
  const database =
    databases.find((item) => item.questSlug === databaseSlug) ?? databases[0];
  const [activeTaskId, setActiveTaskId] = useState(database?.tasks[0]?.id ?? "");
  const activeTask =
    database?.tasks.find((task) => task.id === activeTaskId) ?? database?.tasks[0];
  const [filter, setFilter] = useState<DifficultyFilter>("all");
  const [sql, setSql] = useState(activeTask?.starterSql ?? "");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [result, setResult] = useState<ExecuteResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [solved, setSolved] = useState<string[]>([]);

  const storageKey = `skriptkin-practice-${database?.questSlug ?? "default"}`;

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      setSolved(saved ? (JSON.parse(saved) as string[]) : []);
    } catch {
      setSolved([]);
    }
  }, [storageKey]);

  const visibleTasks = useMemo(
    () =>
      database?.tasks.filter(
        (task) => filter === "all" || task.difficulty === filter
      ) ?? [],
    [database, filter]
  );

  if (!database || !activeTask) {
    return (
      <div className="rounded-xl border-2 border-[#e5e5e5] bg-paper-white p-8 text-center">
        <p className="text-body font-bold text-charcoal">
          Тренировочные базы скоро появятся.
        </p>
      </div>
    );
  }

  function selectDatabase(slug: string) {
    const next = databases.find((item) => item.questSlug === slug);
    if (!next?.tasks[0]) return;
    setDatabaseSlug(slug);
    setActiveTaskId(next.tasks[0].id);
    setSql(next.tasks[0].starterSql);
    resetFeedback();
  }

  function selectTask(task: PracticeTask) {
    setDrafts((current) => ({ ...current, [activeTask.id]: sql }));
    setActiveTaskId(task.id);
    setSql(drafts[task.id] ?? task.starterSql);
    resetFeedback();
  }

  function resetFeedback() {
    setResult(null);
    setShowHint(false);
    setShowSolution(false);
  }

  function resetEditor() {
    setSql(activeTask.starterSql);
    setResult(null);
  }

  async function run() {
    if (!sql.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const response = await fetch("/api/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          questSlug: database.questSlug,
          practiceTaskId: activeTask.id,
          sql,
        }),
      });
      const data = (await response.json()) as ExecuteResponse;
      setResult(data);
      if (data.ok && data.correct) {
        fetch("/api/activity", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            questSlug: database.questSlug,
            practiceTaskId: activeTask.id,
          }),
        }).catch(() => {});
        setSolved((current) => {
          if (current.includes(activeTask.id)) return current;
          const next = [...current, activeTask.id];
          window.localStorage.setItem(storageKey, JSON.stringify(next));
          return next;
        });
      }
    } catch {
      setResult({ ok: false, error: "Не удалось связаться с сервером." });
    } finally {
      setLoading(false);
    }
  }

  const solvedInDatabase = database.tasks.filter((task) =>
    solved.includes(task.id)
  ).length;
  const progress = Math.round((solvedInDatabase / database.tasks.length) * 100);

  const editorSchema = useMemo(
    () =>
      Object.fromEntries(
        database.tables.map((table) => [table.name, table.columns])
      ),
    [database]
  );

  return (
    <div>
      <section className="mb-6 overflow-hidden rounded-xl border-2 border-[#e5e5e5] bg-paper-white">
        <div className="flex flex-col gap-5 p-5 sm:p-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#efffdf] text-3xl">
              {database.emoji}
            </div>
            <div>
              <p className="mb-1 text-caption font-bold uppercase tracking-wide text-faded-gray">
                База из истории
              </p>
              <h1 className="text-subheading font-extrabold text-charcoal">
                Практика SQL на базе «{database.title}»
              </h1>
              <p className="mt-1 max-w-[720px] text-[15px] font-medium leading-relaxed text-pencil-gray">
                {database.description}
              </p>
            </div>
          </div>
          {databases.length > 1 && (
            <select
              value={database.questSlug}
              onChange={(event) => selectDatabase(event.target.value)}
              className="rounded-xl border-2 border-[#e5e5e5] bg-paper-white px-4 py-3 font-bold text-charcoal outline-none focus:border-spark-blue"
              aria-label="Выбрать базу данных"
            >
              {databases.map((item) => (
                <option key={item.questSlug} value={item.questSlug}>
                  {item.emoji} {item.title}
                </option>
              ))}
            </select>
          )}
        </div>
        <div className="border-t-2 border-[#e5e5e5] px-5 py-4 sm:px-6">
          <div className="mb-2 flex items-center justify-between text-caption font-bold">
            <span className="text-pencil-gray">Прогресс практики</span>
            <span className="text-eager-green">
              {solvedInDatabase} из {database.tasks.length}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-[#e5e5e5]">
            <div
              className="h-full rounded-full bg-eager-green transition-[width]"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </section>

      <details className="mb-6 rounded-xl border-2 border-[#e5e5e5] bg-paper-white">
        <summary className="cursor-pointer list-none px-5 py-4 text-nav-label font-extrabold uppercase text-spark-blue marker:hidden sm:px-6">
          Схема базы · {database.tables.length} таблиц
          <span className="ml-2 text-faded-gray">↓</span>
        </summary>
        <div className="grid items-start gap-4 border-t-2 border-[#e5e5e5] p-5 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
          {database.tables.map((table) => (
            <article
              key={table.name}
              className="overflow-hidden rounded-xl border-2 border-[#e5e5e5] bg-[#f7f7f7]"
            >
              <header className="p-4">
                <code className="font-mono text-[15px] font-extrabold text-night-ink">
                  {table.name}
                </code>
                <p className="mt-1.5 text-caption font-medium leading-relaxed text-pencil-gray">
                  {table.description}
                </p>
              </header>
              <div className="border-t-2 border-[#e5e5e5] bg-paper-white">
                <p className="border-b border-[#e5e5e5] px-4 py-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-faded-gray">
                  Поля · {table.columns.length}
                </p>
                <ol className="divide-y divide-[#ededed]">
                  {table.columns.map((column, columnIndex) => (
                    <li
                      key={column}
                      className="flex min-w-0 items-center gap-3 px-4 py-2.5"
                    >
                      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-[#eef0f5] font-mono text-[10px] font-bold text-faded-gray">
                        {columnIndex + 1}
                      </span>
                      <code className="min-w-0 break-all font-mono text-[12px] font-bold text-charcoal">
                        {column}
                      </code>
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          ))}
        </div>
        {database.schemaDescription && (
          <section className="border-t-2 border-[#e5e5e5] px-5 py-6 sm:px-6 sm:py-7">
            <p className="mb-2 text-caption font-extrabold uppercase tracking-wide text-spark-blue">
              О базе данных
            </p>
            <h2 className="text-subheading font-extrabold text-charcoal">
              Как устроена база «{database.title}»
            </h2>
            <div className="mt-3 max-w-[900px] space-y-3">
              {database.schemaDescription.split("\n\n").map((paragraph) => (
                <p
                  key={paragraph}
                  className="text-[15px] font-medium leading-relaxed text-pencil-gray"
                >
                  {paragraph}
                </p>
              ))}
            </div>
          </section>
        )}
        {database.erDiagramUrl && (
          <SchemaDiagram
            url={database.erDiagramUrl}
            databaseTitle={database.title}
          />
        )}
      </details>

      <div className="grid items-start gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
        <aside className="overflow-hidden rounded-xl border-2 border-[#e5e5e5] bg-paper-white lg:sticky lg:top-[90px]">
          <div className="border-b-2 border-[#e5e5e5] p-4">
            <p className="mb-3 text-caption font-extrabold uppercase tracking-wide text-faded-gray">
              Сложность
            </p>
            <div className="flex flex-wrap gap-2">
              {(
                [
                  ["all", "Все"],
                  ["easy", "Легко"],
                  ["medium", "Средне"],
                  ["hard", "Сложно"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFilter(value)}
                  className={`rounded-xl px-3 py-2 text-caption font-bold transition-colors ${
                    filter === value
                      ? "bg-night-ink text-paper-white"
                      : "bg-[#f1f1f1] text-pencil-gray hover:text-charcoal"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="max-h-[560px] overflow-y-auto p-2">
            {visibleTasks.map((task) => {
              const active = task.id === activeTask.id;
              const isSolved = solved.includes(task.id);
              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => selectTask(task)}
                  className={`practice-task-option flex w-full items-center gap-3 rounded-xl p-3 text-left transition-colors ${
                    active ? "is-active bg-[#efffdf]" : "hover:bg-[#f7f7f7]"
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-caption font-extrabold ${
                      isSolved
                        ? "bg-eager-green text-paper-white"
                        : active
                          ? "bg-paper-white text-eager-green"
                          : "bg-[#ededed] text-pencil-gray"
                    }`}
                  >
                    {isSolved ? "✓" : task.number}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block truncate text-[15px] font-extrabold ${
                        active ? "text-[#3f9900]" : "text-charcoal"
                      }`}
                    >
                      {task.title}
                    </span>
                    <span className="mt-0.5 flex items-center gap-1.5 text-caption font-bold text-faded-gray">
                      <span
                        className={`h-2 w-2 rounded-full ${DIFFICULTY[task.difficulty].dot}`}
                      />
                      {DIFFICULTY[task.difficulty].label}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        </aside>

        <section className="min-w-0 overflow-hidden rounded-xl border-2 border-[#e5e5e5] bg-paper-white">
          <div className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center gap-3">
              <span className="text-caption font-extrabold uppercase tracking-wide text-faded-gray">
                Задание {activeTask.number}
              </span>
              <span
                className={`rounded-full px-3 py-1 text-caption font-bold ${DIFFICULTY[activeTask.difficulty].className}`}
              >
                {DIFFICULTY[activeTask.difficulty].label}
              </span>
              {solved.includes(activeTask.id) && (
                <span className="rounded-full bg-eager-green px-3 py-1 text-caption font-bold text-paper-white">
                  Решено
                </span>
              )}
            </div>
            <h2 className="mb-3 text-heading-sm font-extrabold text-charcoal">
              {activeTask.title}
            </h2>
            <TaskText text={activeTask.description} />
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => setShowHint((value) => !value)}
                className="text-nav-label font-bold text-spark-blue hover:underline"
              >
                {showHint ? "Скрыть подсказку" : "Подсказка"}
              </button>
              <button
                type="button"
                onClick={() => setShowSolution((value) => !value)}
                className="text-nav-label font-bold text-pencil-gray hover:text-charcoal hover:underline"
              >
                {showSolution ? "Скрыть решение" : "Показать решение"}
              </button>
            </div>
            {showHint && (
              <div className="mt-4 rounded-xl border-2 border-[#bfe8fb] bg-[#eef9ff] p-4 text-[15px] font-medium text-[#24647f]">
                💡 {activeTask.hint}
              </div>
            )}
            {showSolution && (
              <div className="mt-4 overflow-x-auto rounded-xl bg-[#f1f2f8] p-4">
                <p className="mb-2 text-caption font-bold uppercase text-pencil-gray">
                  Один из вариантов
                </p>
                <pre className="font-mono text-[13px] leading-relaxed text-night-ink">
                  {activeTask.solution}
                </pre>
              </div>
            )}
          </div>

          <div className="border-t-2 border-[#e5e5e5] bg-night-ink">
            <div className="flex items-center justify-between border-b border-[#252951] px-4 py-3">
              <span className="text-caption font-bold uppercase tracking-wide text-fresh-leaf">
                SQL-редактор
              </span>
              <button
                type="button"
                onClick={resetEditor}
                className="text-caption font-bold text-[#9da3c7] hover:text-paper-white"
              >
                Сбросить
              </button>
            </div>
            <SqlEditor
              value={sql}
              onChange={setSql}
              onRun={() => void run()}
              schema={editorSchema}
            />
            <div className="flex flex-col gap-3 border-t border-[#252951] p-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-caption font-medium text-[#9da3c7]">
                ⌘/Ctrl + Enter · только чтение · до 100 строк
              </p>
              <button
                type="button"
                disabled={loading || !sql.trim()}
                onClick={() => void run()}
                className="rounded-xl bg-eager-green px-6 py-3 text-nav-label font-bold uppercase text-paper-white transition-colors hover:bg-[#4cb002] disabled:pointer-events-none disabled:opacity-50"
              >
                {loading ? "Проверяю…" : "Выполнить и проверить"}
              </button>
            </div>
          </div>

          {result && <PracticeResult result={result} />}
        </section>
      </div>
    </div>
  );
}

function SchemaDiagram({
  url,
  databaseTitle,
}: {
  url: string;
  databaseTitle: string;
}) {
  const [failed, setFailed] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const viewportRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({
    active: false,
    pointerId: -1,
    startX: 0,
    startY: 0,
    scrollLeft: 0,
    scrollTop: 0,
  });

  useEffect(() => {
    setFailed(false);
    setExpanded(false);
    setZoom(1);
    setDragging(false);
  }, [url]);

  useEffect(() => {
    if (!expanded) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") setExpanded(false);
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [expanded]);

  function changeZoom(delta: number) {
    setZoom((current) => Math.min(4, Math.max(1, current + delta)));
  }

  function startPan(event: ReactPointerEvent<HTMLDivElement>) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    const viewport = viewportRef.current;
    if (!viewport) return;

    dragState.current = {
      active: true,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      scrollLeft: viewport.scrollLeft,
      scrollTop: viewport.scrollTop,
    };
    viewport.setPointerCapture(event.pointerId);
    setDragging(true);
    event.preventDefault();
  }

  function movePan(event: ReactPointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    const viewport = viewportRef.current;
    if (!state.active || state.pointerId !== event.pointerId || !viewport) {
      return;
    }

    viewport.scrollLeft = state.scrollLeft - (event.clientX - state.startX);
    viewport.scrollTop = state.scrollTop - (event.clientY - state.startY);
    event.preventDefault();
  }

  function stopPan(event: ReactPointerEvent<HTMLDivElement>) {
    const state = dragState.current;
    const viewport = viewportRef.current;
    if (!state.active || state.pointerId !== event.pointerId) return;

    dragState.current.active = false;
    if (viewport?.hasPointerCapture(event.pointerId)) {
      viewport.releasePointerCapture(event.pointerId);
    }
    setDragging(false);
  }

  return (
    <section className="border-t-2 border-[#e5e5e5] p-5 sm:p-6">
      <p className="mb-4 text-caption font-extrabold uppercase tracking-wide text-faded-gray">
        ER-диаграмма
      </p>
      {failed ? (
        <div className="flex min-h-52 flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#d9d9d9] bg-[#f7f8fa] px-5 py-10 text-center">
          <span className="mb-3 text-4xl" aria-hidden="true">
            🗺️
          </span>
          <p className="text-body font-extrabold text-charcoal">
            Место для ER-диаграммы
          </p>
          <p className="mt-2 max-w-[620px] text-[15px] font-medium text-pencil-gray">
            Экспортируйте PlantUML в PNG и добавьте файл:
          </p>
          <code className="mt-3 rounded-lg bg-[#f1f2f8] px-3 py-2 font-mono text-caption font-bold text-night-ink">
            public{url}
          </code>
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setExpanded(true);
            }}
            className="group relative block w-full overflow-auto rounded-xl border-2 border-[#e5e5e5] bg-white p-3 text-left transition-colors hover:border-spark-blue sm:p-5"
            aria-label={`Увеличить ER-диаграмму базы «${databaseTitle}»`}
          >
            <span className="sticky left-full top-0 z-10 mb-[-44px] ml-auto flex h-11 w-11 items-center justify-center rounded-xl bg-night-ink/85 text-paper-white shadow-lg backdrop-blur-sm transition-transform group-hover:scale-105">
              <MagnifyIcon />
            </span>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={url}
              alt={`ER-диаграмма базы «${databaseTitle}»`}
              onError={() => setFailed(true)}
              className="mx-auto h-auto min-w-[720px] max-w-none cursor-zoom-in lg:min-w-0 lg:max-w-full"
            />
          </button>

          {expanded && (
            <div
              role="dialog"
              aria-modal="true"
              aria-label={`Увеличенная ER-диаграмма базы «${databaseTitle}»`}
              className="fixed inset-0 z-[100] bg-black/90 p-2 sm:p-4"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) setExpanded(false);
              }}
            >
              <div className="mx-auto flex h-full max-w-[1800px] flex-col overflow-hidden rounded-xl border border-white/20 bg-[#111a2a] shadow-2xl">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/15 px-3 py-3 sm:px-5">
                  <div className="min-w-0">
                    <p className="truncate text-nav-label font-extrabold text-paper-white">
                      ER-диаграмма · {databaseTitle}
                    </p>
                    <p className="text-caption font-bold text-[#aeb8c7]">
                      Масштаб {Math.round(zoom * 100)}%
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => changeZoom(-0.5)}
                      disabled={zoom <= 1}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-xl font-black text-paper-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Уменьшить диаграмму"
                      title="Уменьшить"
                    >
                      −
                    </button>
                    <button
                      type="button"
                      onClick={() => setZoom(1)}
                      className="h-10 rounded-lg border border-white/20 px-3 text-caption font-extrabold uppercase text-paper-white hover:bg-white/10"
                    >
                      100%
                    </button>
                    <button
                      type="button"
                      onClick={() => changeZoom(0.5)}
                      disabled={zoom >= 4}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 text-xl font-black text-paper-white hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-35"
                      aria-label="Увеличить диаграмму"
                      title="Увеличить"
                    >
                      +
                    </button>
                    <button
                      type="button"
                      onClick={() => setExpanded(false)}
                      className="ml-1 flex h-10 w-10 items-center justify-center rounded-lg bg-white/10 text-2xl font-bold text-paper-white hover:bg-white/20"
                      aria-label="Закрыть диаграмму"
                      title="Закрыть"
                    >
                      ×
                    </button>
                  </div>
                </div>

                <div
                  ref={viewportRef}
                  onPointerDown={startPan}
                  onPointerMove={movePan}
                  onPointerUp={stopPan}
                  onPointerCancel={stopPan}
                  className={`min-h-0 flex-1 touch-none select-none overflow-auto bg-white p-3 sm:p-6 ${
                    dragging ? "cursor-grabbing" : "cursor-grab"
                  }`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={url}
                    alt={`ER-диаграмма базы «${databaseTitle}»`}
                    draggable={false}
                    className="pointer-events-none block h-auto max-w-none origin-top-left transition-[width] duration-150"
                    style={{ width: `${zoom * 100}%` }}
                  />
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function MagnifyIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-6 w-6"
      aria-hidden="true"
    >
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 5 5M10.5 7.5v6M7.5 10.5h6" />
    </svg>
  );
}

function TaskText({ text }: { text: string }) {
  const parts = text.split(/(`[^`]+`)/g);
  return (
    <p className="text-body font-medium leading-relaxed text-pencil-gray">
      {parts.map((part, index) =>
        part.startsWith("`") && part.endsWith("`") ? (
          <code
            key={`${part}-${index}`}
            className="rounded bg-[#f1f2f8] px-1.5 py-0.5 font-mono text-[14px] font-bold text-night-ink"
          >
            {part.slice(1, -1)}
          </code>
        ) : (
          part
        )
      )}
    </p>
  );
}

function PracticeResult({ result }: { result: ExecuteResponse }) {
  return (
    <div className="border-t-2 border-[#e5e5e5] p-4 sm:p-6">
      {result.error && (
        <div className="rounded-xl border-2 border-[#ffc6c6] bg-[#fff4f4] p-4 text-body font-bold text-[#c92424]">
          {result.error}
        </div>
      )}
      {result.ok && result.correct && (
        <div className="mb-4 rounded-xl border-2 border-[#bde99e] bg-[#f2ffe9] p-4">
          <p className="text-body font-extrabold text-[#3f9900]">
            ✓ Задание решено
          </p>
          <p className="mt-1 text-[15px] font-medium text-[#548238]">
            Результат совпал с эталоном. Можно переходить к следующему.
          </p>
        </div>
      )}
      {result.ok && result.correct === false && (
        <div className="mb-4 rounded-xl border-2 border-[#bfe8fb] bg-[#eef9ff] p-4">
          <p className="text-body font-extrabold text-[#0784bf]">
            Запрос работает, но ответ пока не совпал
          </p>
          <p className="mt-1 text-[15px] font-medium text-[#24647f]">
            {result.checkHint}
          </p>
        </div>
      )}
      {result.ok && result.columns && result.rows && (
        <div>
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-nav-label font-extrabold uppercase text-charcoal">
              Результат
            </h3>
            <span className="text-caption font-bold text-faded-gray">
              {result.rows.length} {plural(result.rows.length, "строка", "строки", "строк")}
            </span>
          </div>
          <div className="overflow-x-auto rounded-xl border-2 border-[#e5e5e5]">
            <table className="w-full min-w-max text-left text-caption">
              <thead className="bg-[#f7f7f7]">
                <tr>
                  {result.columns.map((column) => (
                    <th
                      key={column}
                      className="border-b-2 border-[#e5e5e5] px-4 py-3 font-extrabold uppercase text-pencil-gray"
                    >
                      {column}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {result.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {result.columns!.map((column) => (
                      <td
                        key={column}
                        className="max-w-[480px] border-b border-[#ededed] px-4 py-3 font-medium text-charcoal last:border-r-0"
                      >
                        {row[column] == null ? (
                          <span className="font-mono text-faded-gray">NULL</span>
                        ) : (
                          String(row[column])
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
