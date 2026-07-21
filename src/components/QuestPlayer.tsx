"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import type { Quest, QuestSceneFrame, QuestStep } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/types";
import { Button } from "./Button";
import { RichText } from "./RichText";
import { SceneView } from "./SceneView";
import { SqlRunner } from "./SqlRunner";

const SPLIT_STORAGE_KEY = "skriptkin-split-pct";

/**
 * Горизонтальное смещение узла карты по его номеру — извилистая
 * тропа-змейка вместо прямой линии: то уходит влево, то заворачивает
 * вправо, шаги разной длины, без симметрии и повторов.
 */
function nodeOffset(index: number): number {
  return Math.round(
    62 * Math.sin(index * 2.3) + 34 * Math.sin(index * 0.85 + 1.4)
  );
}

type View = "map" | number;

/**
 * Движок прохождения квеста:
 *  - карта уровней в стиле Duolingo (узлы-шаги, финальный кубок);
 *  - режим шага: сюжет слева, SQL-терминал справа,
 *    разделитель перетаскивается мышью;
 *  - полноэкранный режим (Fullscreen API) кнопкой в верхнем углу.
 */
export function QuestPlayer({
  quest,
  steps,
  scenes,
  initialStep,
  initiallyCompleted,
  isAuthed,
}: {
  quest: Quest;
  steps: QuestStep[];
  scenes: QuestSceneFrame[];
  initialStep: number;
  initiallyCompleted: boolean;
  isAuthed: boolean;
}) {
  const total = steps.length;
  const clamp = (n: number) => Math.min(Math.max(n, 1), total);
  const [current, setCurrent] = useState(clamp(initialStep));
  const [completed, setCompleted] = useState(initiallyCompleted);
  const [view, setView] = useState<View>("map");
  const [solved, setSolved] = useState(false);

  // --- Сцены визуальной новеллы --------------------------------------------
  // Кадры, сгруппированные по позиции: 0 — пролог, N — после шага N
  const scenesBy = useMemo(() => {
    const map = new Map<number, QuestSceneFrame[]>();
    for (const frame of scenes) {
      const list = map.get(frame.afterStep) ?? [];
      list.push(frame);
      map.set(frame.afterStep, list);
    }
    return map;
  }, [scenes]);

  /** Проигрываемая сейчас сцена и куда перейти после неё */
  const [scenePlaying, setScenePlaying] = useState<{
    afterStep: number;
    next: View;
  } | null>(null);
  const [prologueSeen, setPrologueSeen] = useState(
    initiallyCompleted || clamp(initialStep) > 1
  );
  /** Сцены, которые игрок уже открывал, — их можно пересматривать с карты */
  const [watchedScenes, setWatchedScenes] = useState<Set<number>>(new Set());

  function playScene(afterStep: number, next: View) {
    setWatchedScenes((prev) => new Set(prev).add(afterStep));
    setScenePlaying({ afterStep, next });
  }

  // --- Полноэкранный режим -------------------------------------------------
  const rootRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const onChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      rootRef.current?.requestFullscreen().catch(() => {});
    }
  }, []);

  // --- Перетаскиваемый разделитель -----------------------------------------
  const [leftPct, setLeftPct] = useState<number>(() => {
    if (typeof window === "undefined") return 46;
    const saved = Number(window.localStorage.getItem(SPLIT_STORAGE_KEY));
    return saved >= 25 && saved <= 70 ? saved : 46;
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const startDrag = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const onMove = (ev: PointerEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      setLeftPct(Math.min(70, Math.max(25, Math.round(pct))));
    };
    const onUp = (ev: PointerEvent) => {
      const pct = ((ev.clientX - rect.left) / rect.width) * 100;
      window.localStorage.setItem(
        SPLIT_STORAGE_KEY,
        String(Math.min(70, Math.max(25, Math.round(pct))))
      );
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  }, []);

  // --- Прогресс ------------------------------------------------------------
  function saveProgress(step: number, done: boolean) {
    if (!isAuthed) return;
    fetch("/api/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        questSlug: quest.slug,
        currentStep: step,
        completed: done,
      }),
    }).catch(() => {});
  }

  function advance() {
    if (view !== current) return;
    const sceneAfter = scenesBy.has(current) ? current : null;
    if (current === total) {
      setCompleted(true);
      saveProgress(current, true);
      if (sceneAfter !== null) {
        playScene(sceneAfter, "map");
      } else {
        setView("map");
      }
    } else {
      const next = current + 1;
      setCurrent(next);
      setSolved(false);
      saveProgress(next, false);
      if (sceneAfter !== null) {
        playScene(sceneAfter, next);
      } else {
        setView(next);
      }
    }
  }

  /** Открыть шаг с карты; перед первым шагом играется пролог */
  function openStep(n: number) {
    setSolved(false);
    if (n === 1 && !prologueSeen && scenesBy.has(0)) {
      setPrologueSeen(true);
      playScene(0, 1);
    } else {
      setView(n);
    }
  }

  const doneCount = completed ? total : current - 1;
  /** До какого шага можно листать историю */
  const maxUnlocked = completed ? total : current;

  // В полноэкранном режиме во время сцены прогресс-бар и белые поля
  // скрываются — картинка идёт от края до края, кнопка выхода лежит на ней
  const sceneFullscreen = isFullscreen && Boolean(scenePlaying);

  return (
    <div
      ref={rootRef}
      className={
        sceneFullscreen
          ? "bg-night-ink"
          : isFullscreen
            ? "overflow-y-auto bg-paper-white px-4 py-4 md:px-6"
            : ""
      }
    >
      {/* Прогресс + полноэкранный режим */}
      {!sceneFullscreen && (
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-nav-label font-bold uppercase text-pencil-gray">
              {isFullscreen && `${quest.emoji} `}
              {completed ? "Квест пройден" : `Решено ${doneCount} из ${total}`}
            </span>
            <span className="flex items-center gap-3">
              {!isAuthed && (
                <span className="hidden text-caption font-medium text-faded-gray sm:inline">
                  <Link href="/login" className="font-bold text-spark-blue">
                    Войди
                  </Link>
                  , чтобы сохранять прогресс
                </span>
              )}
              <button
                type="button"
                onClick={toggleFullscreen}
                title={
                  isFullscreen
                    ? "Выйти из полноэкранного режима"
                    : "Полноэкранный режим"
                }
                aria-label={
                  isFullscreen
                    ? "Выйти из полноэкранного режима"
                    : "Полноэкранный режим"
                }
                className="flex h-9 w-9 items-center justify-center rounded-xl border-2 border-faded-gray text-[16px] font-bold text-pencil-gray hover:border-spark-blue hover:text-spark-blue"
              >
                {isFullscreen ? "✕" : "⛶"}
              </button>
            </span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-[#e5e5e5]">
            <div
              className="h-full rounded-full bg-eager-green transition-all"
              style={{ width: `${(doneCount / total) * 100}%` }}
            />
          </div>
        </div>
      )}

      {scenePlaying ? (
        <SceneView
          key={scenePlaying.afterStep}
          frames={scenesBy.get(scenePlaying.afterStep) ?? []}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          onFinish={() => {
            const next = scenePlaying.next;
            setScenePlaying(null);
            setView(next);
          }}
        />
      ) : view === "map" ? (
        <MapView
          quest={quest}
          steps={steps}
          current={current}
          completed={completed}
          scenesBy={scenesBy}
          watchedScenes={watchedScenes}
          onOpenStep={openStep}
          onPlayScene={(afterStep) => playScene(afterStep, "map")}
        />
      ) : (
        <StepView
          quest={quest}
          step={steps[view - 1]}
          isCurrent={!completed && view === current}
          solved={solved}
          isLast={view === total}
          maxUnlocked={maxUnlocked}
          leftPct={leftPct}
          isFullscreen={isFullscreen}
          containerRef={containerRef}
          onStartDrag={startDrag}
          onSolved={() => setSolved(true)}
          onAdvance={advance}
          onNavigate={(n) => {
            setSolved(false);
            setView(n);
          }}
          onBackToMap={() => setView("map")}
        />
      )}
    </div>
  );
}

// ===========================================================================
// Карта уровней
// ===========================================================================

function MapView({
  quest,
  steps,
  current,
  completed,
  scenesBy,
  watchedScenes,
  onOpenStep,
  onPlayScene,
}: {
  quest: Quest;
  steps: QuestStep[];
  current: number;
  completed: boolean;
  scenesBy: Map<number, QuestSceneFrame[]>;
  watchedScenes: Set<number>;
  onOpenStep: (n: number) => void;
  onPlayScene: (afterStep: number) => void;
}) {
  const sceneUnlocked = (afterStep: number) =>
    watchedScenes.has(afterStep) ||
    completed ||
    (afterStep === 0 ? current > 1 : current > afterStep);

  const sceneChip = (afterStep: number) => {
    if (!scenesBy.has(afterStep)) return null;
    const unlocked = sceneUnlocked(afterStep);
    return (
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => onPlayScene(afterStep)}
        title={unlocked ? "Посмотреть сцену" : "Сцена откроется позже"}
        className={`rounded-full border-2 px-4 py-1.5 text-caption font-bold uppercase tracking-wide ${
          unlocked
            ? "cursor-pointer border-spark-blue bg-[#e7f6fe] text-spark-blue hover:bg-[#d4effd]"
            : "cursor-default border-[#e5e5e5] bg-[#f4f4f4] text-faded-gray"
        }`}
      >
        🎬 Сцена
      </button>
    );
  };

  return (
    <div>
      {/* Завязка — «материалы дела» */}
      <div className="mb-8 overflow-hidden rounded-xl border-2 border-[#e5e5e5]">
        <div className="flex flex-wrap items-center gap-3 border-b-2 border-[#e5e5e5] bg-storybook-green px-5 py-3">
          <span className="text-nav-label font-bold uppercase tracking-wide text-charcoal">
            📁 Материалы дела
          </span>
          <span className="ml-auto flex flex-wrap gap-2">
            <span className="rounded-full border-2 border-eager-green bg-paper-white px-3 py-1 text-caption font-bold uppercase text-eager-green">
              {DIFFICULTY_LABELS[quest.difficulty]}
            </span>
            <span className="rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1 text-caption font-bold uppercase text-pencil-gray">
              {quest.stepsCount} шагов
            </span>
            <span className="rounded-full border-2 border-faded-gray bg-paper-white px-3 py-1 text-caption font-bold uppercase text-pencil-gray">
              ≈ 40 минут
            </span>
          </span>
        </div>
        <div className="border-l-4 border-fresh-leaf px-5 py-4">
          <RichText
            text={quest.intro}
            className="text-body font-medium leading-relaxed text-pencil-gray"
          />
        </div>
      </div>

      {/* Дорожка уровней: узкая змейка на мобильных, широкая — на десктопе */}
      <div className="mb-8 flex justify-center">{sceneChip(0)}</div>

      <div className="mb-8 flex flex-col items-center gap-6 md:hidden">
        {steps.map((step, i) => {
          const isDone = completed || step.stepNumber < current;
          const isActive = !completed && step.stepNumber === current;
          const locked = !isDone && !isActive;
          return (
            <div
              key={step.stepNumber}
              className="flex flex-col items-center gap-6"
              style={{ transform: `translateX(${nodeOffset(i)}px)` }}
            >
              <button
                type="button"
                disabled={locked}
                onClick={() => onOpenStep(step.stepNumber)}
                aria-label={`Шаг ${step.stepNumber}: ${step.title}`}
                className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] text-[26px] font-extrabold transition-transform ${
                  isDone
                    ? "cursor-pointer border-[#43a300] bg-eager-green text-paper-white hover:scale-105"
                    : isActive
                      ? "cursor-pointer border-[#43a300] bg-eager-green text-paper-white ring-4 ring-storybook-green hover:scale-105"
                      : "cursor-default border-[#cfcfcf] bg-[#e5e5e5] text-faded-gray"
                }`}
              >
                {isDone ? "✓" : isActive ? "★" : step.stepNumber}
                {isActive && (
                  <span className="absolute -top-9 whitespace-nowrap rounded-xl border-2 border-[#e5e5e5] bg-paper-white px-3 py-1 text-caption font-bold uppercase tracking-wide text-eager-green">
                    {current === 1 ? "Старт" : "Ты здесь"}
                  </span>
                )}
              </button>
              <span
                className={`-mt-4 max-w-[180px] text-center text-caption font-bold ${
                  locked ? "text-faded-gray" : "text-charcoal"
                }`}
              >
                {step.title}
              </span>
              {sceneChip(step.stepNumber)}
            </div>
          );
        })}

        {/* Финальный узел */}
        <div
          className="flex flex-col items-center"
          style={{ transform: `translateX(${nodeOffset(steps.length)}px)` }}
        >
          <div
            className={`flex h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] text-[30px] ${
              completed
                ? "border-[#d4a000] bg-[#ffc800] text-paper-white"
                : "border-[#cfcfcf] bg-[#e5e5e5] grayscale"
            }`}
            aria-hidden
          >
            🏆
          </div>
          <span
            className={`mt-2 text-caption font-bold ${
              completed ? "text-charcoal" : "text-faded-gray"
            }`}
          >
            Развязка
          </span>
        </div>
      </div>

      {/* Широкая змейка на весь экран — от края до края, ряд за рядом */}
      <div className="mb-8 hidden md:block">
        <SnakePath
          steps={steps}
          current={current}
          completed={completed}
          onOpenStep={onOpenStep}
          sceneChip={sceneChip}
        />
      </div>

      {!completed && (
        <div className="mb-8 text-center">
          <Button onClick={() => onOpenStep(current)}>
            {current === 1
              ? "Начать расследование"
              : `Продолжить: шаг ${current}`}
          </Button>
        </div>
      )}

      {/* Финал */}
      {completed && (
        <div className="mb-6 rounded-xl border-2 border-eager-green p-5">
          <h2 className="mb-3 font-feather text-heading-sm font-extrabold text-eager-green">
            дело раскрыто
          </h2>
          {quest.finale && (
            <RichText
              text={quest.finale}
              className="text-body font-medium leading-relaxed text-charcoal"
            />
          )}
          <div className="mt-5 flex flex-wrap gap-4">
            <Button href="/quests">К другим квестам</Button>
            <Button href="/account" variant="outline">
              В кабинет
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ===========================================================================
// Широкая змейка карты (десктоп): ряды по 4 узла, направление в ряду
// чередуется — от края до края экрана, как в игровых картах уровней
// ===========================================================================

const ROW_SIZE = 4;
/** Ширина ячейки узла и половина ширины — для точного примыкания
 *  вертикального соединителя между рядами к центру крайнего кружка */
const NODE_CELL_PX = 112;

type SnakeEntry = { kind: "step"; step: QuestStep } | { kind: "trophy" };

function SnakePath({
  steps,
  current,
  completed,
  onOpenStep,
  sceneChip,
}: {
  steps: QuestStep[];
  current: number;
  completed: boolean;
  onOpenStep: (n: number) => void;
  sceneChip: (afterStep: number) => React.ReactNode;
}) {
  const entries: SnakeEntry[] = [
    ...steps.map((step): SnakeEntry => ({ kind: "step", step })),
    { kind: "trophy" },
  ];
  const rows: SnakeEntry[][] = [];
  for (let i = 0; i < entries.length; i += ROW_SIZE) {
    rows.push(entries.slice(i, i + ROW_SIZE));
  }

  const isEntryDone = (entry: SnakeEntry) =>
    entry.kind === "trophy"
      ? completed
      : completed || entry.step.stepNumber < current;

  return (
    <div>
      {rows.map((row, rowIndex) => {
        const reversed = rowIndex % 2 === 1;
        const hasNextRow = rowIndex < rows.length - 1;
        const turnDone = isEntryDone(row[row.length - 1]);
        return (
          <div key={rowIndex}>
            <div
              className={`flex items-start ${reversed ? "flex-row-reverse" : ""}`}
            >
              {row.map((entry, i) => (
                <SnakeNode
                  key={entry.kind === "trophy" ? "trophy" : entry.step.stepNumber}
                  entry={entry}
                  current={current}
                  completed={completed}
                  onOpenStep={onOpenStep}
                  sceneChip={sceneChip}
                  connectorAfter={
                    i < row.length - 1 ? isEntryDone(entry) : undefined
                  }
                />
              ))}
            </div>
            {hasNextRow && (
              <div
                className={`flex ${reversed ? "justify-start pl-14" : "justify-end pr-14"}`}
              >
                <div
                  className={`h-8 w-2 rounded-full ${
                    turnDone ? "bg-eager-green" : "bg-[#e5e5e5]"
                  }`}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SnakeNode({
  entry,
  current,
  completed,
  onOpenStep,
  sceneChip,
  connectorAfter,
}: {
  entry: SnakeEntry;
  current: number;
  completed: boolean;
  onOpenStep: (n: number) => void;
  sceneChip: (afterStep: number) => React.ReactNode;
  /** true/false — рисовать соединитель после узла и его цвет; undefined — не рисовать */
  connectorAfter: boolean | undefined;
}) {
  const cell = (
    <div
      className="flex shrink-0 flex-col items-center gap-2"
      style={{ width: NODE_CELL_PX }}
    >
      {entry.kind === "trophy" ? (
        <>
          <div
            className={`flex h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] text-[30px] ${
              completed
                ? "border-[#d4a000] bg-[#ffc800] text-paper-white"
                : "border-[#cfcfcf] bg-[#e5e5e5] grayscale"
            }`}
            aria-hidden
          >
            🏆
          </div>
          <span
            className={`text-center text-caption font-bold ${
              completed ? "text-charcoal" : "text-faded-gray"
            }`}
          >
            Развязка
          </span>
        </>
      ) : (
        (() => {
          const step = entry.step;
          const isDone = completed || step.stepNumber < current;
          const isActive = !completed && step.stepNumber === current;
          const locked = !isDone && !isActive;
          return (
            <>
              <button
                type="button"
                disabled={locked}
                onClick={() => onOpenStep(step.stepNumber)}
                aria-label={`Шаг ${step.stepNumber}: ${step.title}`}
                className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] text-[26px] font-extrabold transition-transform ${
                  isDone
                    ? "cursor-pointer border-[#43a300] bg-eager-green text-paper-white hover:scale-105"
                    : isActive
                      ? "cursor-pointer border-[#43a300] bg-eager-green text-paper-white ring-4 ring-storybook-green hover:scale-105"
                      : "cursor-default border-[#cfcfcf] bg-[#e5e5e5] text-faded-gray"
                }`}
              >
                {isDone ? "✓" : isActive ? "★" : step.stepNumber}
                {isActive && (
                  <span className="absolute -top-9 whitespace-nowrap rounded-xl border-2 border-[#e5e5e5] bg-paper-white px-3 py-1 text-caption font-bold uppercase tracking-wide text-eager-green">
                    {current === 1 ? "Старт" : "Ты здесь"}
                  </span>
                )}
              </button>
              <span
                className={`max-w-[104px] text-center text-caption font-bold ${
                  locked ? "text-faded-gray" : "text-charcoal"
                }`}
              >
                {step.title}
              </span>
              {sceneChip(step.stepNumber)}
            </>
          );
        })()
      )}
    </div>
  );

  if (connectorAfter === undefined) return cell;

  return (
    <>
      {cell}
      <div
        className={`mt-[34px] h-2 flex-1 rounded-full ${
          connectorAfter ? "bg-eager-green" : "bg-[#e5e5e5]"
        }`}
      />
    </>
  );
}

// ===========================================================================
// Режим шага: сюжет слева, терминал справа, разделитель перетаскивается
// ===========================================================================

function StepView({
  quest,
  step,
  isCurrent,
  solved,
  isLast,
  maxUnlocked,
  leftPct,
  isFullscreen,
  containerRef,
  onStartDrag,
  onSolved,
  onAdvance,
  onNavigate,
  onBackToMap,
}: {
  quest: Quest;
  step: QuestStep;
  isCurrent: boolean;
  solved: boolean;
  isLast: boolean;
  maxUnlocked: number;
  leftPct: number;
  isFullscreen: boolean;
  containerRef: React.RefObject<HTMLDivElement | null>;
  onStartDrag: (e: React.PointerEvent) => void;
  onSolved: () => void;
  onAdvance: () => void;
  onNavigate: (n: number) => void;
  onBackToMap: () => void;
}) {
  const showOutcome = (!isCurrent || solved) && step.outcome;
  const panelHeight = isFullscreen
    ? "md:max-h-[calc(100vh-150px)]"
    : "md:max-h-[76vh]";

  const navBtn =
    "flex h-9 w-9 items-center justify-center rounded-xl border-2 text-[18px] font-bold transition-colors";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={onBackToMap}
          className="rounded-xl border-2 border-faded-gray px-3 py-1.5 text-nav-label font-bold uppercase text-spark-blue hover:bg-[#f7f7f7]"
        >
          ← Карта
        </button>

        {/* Кнопка перехода дальше — появляется после решения шага */}
        {isCurrent && solved && (
          <Button onClick={onAdvance}>
            {isLast ? "Завершить дело 🏆" : "Следующий шаг →"}
          </Button>
        )}

        {/* Листалка по открытым шагам истории */}
        <span className="flex items-center gap-2">
          <button
            type="button"
            disabled={step.stepNumber <= 1}
            onClick={() => onNavigate(step.stepNumber - 1)}
            aria-label="Предыдущий шаг"
            className={`${navBtn} ${
              step.stepNumber <= 1
                ? "cursor-default border-[#e5e5e5] text-faded-gray"
                : "border-faded-gray text-spark-blue hover:border-spark-blue"
            }`}
          >
            ‹
          </button>
          <span className="min-w-[110px] text-center text-nav-label font-bold uppercase text-pencil-gray">
            Шаг {step.stepNumber}
            {!isCurrent && " ✓"}
          </span>
          <button
            type="button"
            disabled={step.stepNumber >= maxUnlocked}
            onClick={() => onNavigate(step.stepNumber + 1)}
            aria-label="Следующий шаг"
            className={`${navBtn} ${
              step.stepNumber >= maxUnlocked
                ? "cursor-default border-[#e5e5e5] text-faded-gray"
                : "border-faded-gray text-spark-blue hover:border-spark-blue"
            }`}
          >
            ›
          </button>
        </span>
      </div>

      <div
        ref={containerRef}
        className="flex flex-col gap-5 md:flex-row md:items-stretch md:gap-0"
        style={{ "--leftw": `${leftPct}%` } as React.CSSProperties}
      >
        {/* Левая панель: сюжет */}
        <div
          className={`min-w-0 md:w-[var(--leftw)] md:shrink-0 md:overflow-y-auto md:pr-4 ${panelHeight}`}
        >
          <h2 className="mb-3 text-heading-sm font-extrabold text-charcoal">
            <span className="text-fresh-leaf">
              {String(step.stepNumber).padStart(2, "0")}
            </span>{" "}
            {step.title}
          </h2>
          <div className="mb-3">
            <RichText
              text={step.story}
              className="text-body font-medium leading-relaxed text-pencil-gray"
            />
          </div>

          <div className="mb-3 rounded-xl bg-storybook-green p-4">
            <p className="mb-1 text-caption font-bold uppercase tracking-wide text-charcoal">
              Задание
            </p>
            <p className="text-body font-bold text-charcoal">{step.task}</p>
          </div>

          {step.hint && (
            <details className="mb-3">
              <summary className="cursor-pointer text-nav-label font-bold uppercase text-spark-blue">
                Подсказка
              </summary>
              <p className="mt-2 rounded-xl border-2 border-[#e5e5e5] p-3 font-mono text-caption text-charcoal">
                {step.hint}
              </p>
            </details>
          )}

          {showOutcome && (
            <div className="mb-3 rounded-xl border-2 border-eager-green p-4">
              <p className="mb-1 text-caption font-bold uppercase tracking-wide text-eager-green">
                Что это дало
              </p>
              <RichText
                text={step.outcome!}
                className="text-body font-medium leading-relaxed text-charcoal"
              />
            </div>
          )}

          {/* Обучение — в самом низу, свёрнуто */}
          {step.theory && (
            <details className="mb-1 overflow-hidden rounded-xl border-2 border-spark-blue">
              <summary className="cursor-pointer bg-[#e7f6fe] px-4 py-2.5 text-nav-label font-bold uppercase tracking-wide text-spark-blue">
                📘 Обучение: команды шага
              </summary>
              <div className="px-4 py-3">
                <RichText
                  text={step.theory}
                  className="text-body font-medium leading-relaxed text-pencil-gray"
                />
              </div>
            </details>
          )}
        </div>

        {/* Разделитель */}
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Изменить ширину панелей"
          onPointerDown={onStartDrag}
          className="group hidden w-4 shrink-0 cursor-col-resize items-center justify-center md:flex"
        >
          <div className="h-24 w-1.5 rounded-full bg-[#e5e5e5] transition-colors group-hover:bg-spark-blue group-active:bg-spark-blue" />
        </div>

        {/* Правая панель: терминал */}
        <div
          className={`min-w-0 flex-1 md:overflow-y-auto md:pl-1 ${panelHeight}`}
        >
          <SqlRunner
            key={`${quest.slug}-${step.stepNumber}`}
            questSlug={quest.slug}
            stepNumber={step.stepNumber}
            onCorrect={isCurrent ? onSolved : undefined}
          />
          {!isCurrent && (
            <p className="mt-2 text-caption font-medium text-faded-gray">
              Этот шаг уже решён — терминал открыт для экспериментов.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
