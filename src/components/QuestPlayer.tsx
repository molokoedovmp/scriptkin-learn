"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Quest, QuestSceneFrame, QuestStep } from "@/lib/types";
import { DIFFICULTY_LABELS } from "@/lib/types";
import { Button } from "./Button";
import { ErrorReportModal } from "./ErrorReportModal";
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
  canAccessAllSteps,
}: {
  quest: Quest;
  steps: QuestStep[];
  scenes: QuestSceneFrame[];
  initialStep: number;
  initiallyCompleted: boolean;
  isAuthed: boolean;
  canAccessAllSteps: boolean;
}) {
  const total = steps.length;
  const isPrometheusQuest = quest.slug.startsWith("prometheus");
  const fullscreenWorkspaceClass = isPrometheusQuest
    ? "quest-game-workspace prometheus-quest-workspace"
    : quest.slug === "midnight-express"
      ? "quest-game-workspace midnight-quest-workspace"
      : "";
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
  const sceneImageCache = useRef<Map<string, HTMLImageElement>>(new Map());

  // Готовим ближайшую сцену заранее: пролог — пока игрок на карте,
  // следующую сцену — пока он читает задание и пишет SQL.
  useEffect(() => {
    const afterStep =
      typeof view === "number"
        ? view
        : current === 1 && !prologueSeen
          ? 0
          : null;

    if (afterStep === null) return;

    for (const frame of scenesBy.get(afterStep) ?? []) {
      if (!frame.imageUrl || sceneImageCache.current.has(frame.imageUrl)) {
        continue;
      }

      const image = new window.Image();
      image.decoding = "async";
      image.src = frame.imageUrl;
      sceneImageCache.current.set(frame.imageUrl, image);
    }
  }, [current, prologueSeen, scenesBy, view]);

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

  /** Открыть урок с карты: сначала показываем связанную с ним сцену. */
  function openStep(n: number) {
    setSolved(false);
    const sceneBeforeStep = Math.max(0, n - 1);
    if (scenesBy.has(sceneBeforeStep)) {
      if (n === 1) setPrologueSeen(true);
      playScene(sceneBeforeStep, n);
    } else {
      setView(n);
    }
  }

  /** До какого шага можно листать историю */
  const maxUnlocked = completed || canAccessAllSteps ? total : current;

  // В полноэкранном режиме во время сцены прогресс-бар и белые поля
  // скрываются — картинка идёт от края до края, кнопка выхода лежит на ней
  const sceneFullscreen = isFullscreen && Boolean(scenePlaying);
  const fullscreenButton = (
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
  );

  return (
    <div
      ref={rootRef}
      className={
        sceneFullscreen
          ? "bg-night-ink"
          : isFullscreen
            ? `overflow-y-auto bg-paper-white px-4 py-4 md:px-6 ${fullscreenWorkspaceClass}`
            : ""
      }
    >
      {/* В игровом режиме оставляем только управление полноэкранным видом. */}
      {!sceneFullscreen && !scenePlaying && view === "map" && (
        <div className="mb-4 flex justify-end">{fullscreenButton}</div>
      )}

      {scenePlaying ? (
        <SceneView
          key={scenePlaying.afterStep}
          frames={scenesBy.get(scenePlaying.afterStep) ?? []}
          isFullscreen={isFullscreen}
          textBackgroundUrl={
            quest.slug === "midnight-express"
              ? "/quests/midnight-express/background.webp"
              : isPrometheusQuest
                ? "/quests/prometheus/background.webp"
              : undefined
          }
          textStyle={
            quest.slug === "midnight-express"
              ? "midnight"
              : isPrometheusQuest
                ? "prometheus"
                : "default"
          }
          hideFrameControls={isPrometheusQuest}
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
          canAccessAllSteps={canAccessAllSteps}
          scenesBy={scenesBy}
          onOpenStep={openStep}
        />
      ) : (
        <StepView
          quest={quest}
          step={steps[view - 1]}
          isCurrent={!completed && view === current}
          isCompletedStep={completed || view < current}
          canRunCheck={canAccessAllSteps || (!completed && view === current)}
          solved={solved}
          isLast={view === total}
          maxUnlocked={maxUnlocked}
          leftPct={leftPct}
          isFullscreen={isFullscreen}
          containerRef={containerRef}
          onStartDrag={startDrag}
          onSolved={() => setSolved(true)}
          onAdvance={advance}
          onNavigate={openStep}
          onBackToMap={() => setView("map")}
          onToggleFullscreen={toggleFullscreen}
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
  canAccessAllSteps,
  scenesBy,
  onOpenStep,
}: {
  quest: Quest;
  steps: QuestStep[];
  current: number;
  completed: boolean;
  canAccessAllSteps: boolean;
  scenesBy: Map<number, QuestSceneFrame[]>;
  onOpenStep: (n: number) => void;
}) {
  return (
    <div className="lesson-map-content mx-auto w-full max-w-[1288px]">
      <div className="mb-5">
        <div>
          <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-fresh-leaf">
            Карта прохождения
          </p>
          <h2 className="mt-1 font-feather text-heading-sm font-black text-charcoal">
            Уроки истории
          </h2>
          <p className="mt-1 text-[14px] font-bold text-pencil-gray">
            Превью откроется после выполнения соответствующего урока.
          </p>
        </div>

      </div>

      <div className="lesson-card-grid flex flex-wrap justify-center gap-4 pb-5">
        {steps.map((step) => {
          const done = completed || step.stepNumber < current;
          const active = !completed && step.stepNumber === current;
          const availableForTest = canAccessAllSteps && !done && !active;
          const locked = !done && !active && !availableForTest;
          const titleHidden = !done && !active;
          const preview = scenesBy
            .get(Math.max(0, step.stepNumber - 1))
            ?.find((frame) => Boolean(frame.imageUrl));

          return (
            <button
              key={step.stepNumber}
              type="button"
              disabled={locked}
              onClick={() => onOpenStep(step.stepNumber)}
              aria-label={
                titleHidden
                  ? `Урок ${step.stepNumber}: название пока скрыто`
                  : `Урок ${step.stepNumber}: ${step.title}`
              }
              className={`lesson-preview-card group w-full overflow-hidden rounded-[18px] border text-left transition ${
                done
                  ? "is-done cursor-pointer"
                  : active || availableForTest
                    ? "is-active cursor-pointer"
                    : "is-locked cursor-not-allowed"
              }`}
            >
              <span className="relative block aspect-[16/10] overflow-hidden bg-[#101927]">
                {done && preview?.imageUrl ? (
                  <Image
                    src={preview.imageUrl}
                    alt=""
                    fill
                    sizes="(min-width: 1280px) 310px, (min-width: 768px) 33vw, 100vw"
                    quality={70}
                    draggable={false}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                ) : (
                  <span className="lesson-preview-placeholder flex h-full flex-col items-center justify-center px-5 text-center">
                    <span className="text-[58px] font-black leading-none">?</span>
                    <span className="mt-3 text-[11px] font-extrabold uppercase tracking-[0.11em]">
                      {active
                        ? "Пройди урок, чтобы открыть кадр"
                        : availableForTest
                          ? "Доступен для тестирования"
                          : "Урок пока закрыт"}
                    </span>
                  </span>
                )}

                <span className="absolute left-3 top-3 rounded-full border border-white/20 bg-black/65 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-white backdrop-blur">
                  Урок {String(step.stepNumber).padStart(2, "0")}
                </span>
                {done && (
                  <span className="absolute right-3 top-3 grid h-8 w-8 place-content-center rounded-full bg-eager-green font-black text-white shadow-lg">
                    ✓
                  </span>
                )}
              </span>

              <span className="block p-4">
                <span className="block min-h-[52px] text-[18px] font-black leading-snug text-charcoal">
                  {titleHidden ? "???" : step.title}
                </span>
                <span
                  className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold uppercase tracking-[0.08em] ${
                    done
                      ? "bg-storybook-green text-[#347b08]"
                      : active || availableForTest
                        ? "bg-[#e8f7ff] text-spark-blue"
                        : "bg-[#eef0f3] text-faded-gray"
                  }`}
                >
                  {done
                    ? "Пройден"
                    : active
                      ? "Доступен сейчас"
                      : availableForTest
                        ? "Тестовый доступ"
                        : "Закрыт"}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {!completed && (
        <div className="mt-2 text-center">
          <Button onClick={() => onOpenStep(current)}>
            {current === 1 ? "Начать первый урок" : `Продолжить: урок ${current}`}
          </Button>
        </div>
      )}

      {completed && (
        <div className="mt-4 rounded-xl border-2 border-eager-green bg-black/30 p-5 backdrop-blur-sm">
          <h2 className="mb-3 font-feather text-heading-sm font-extrabold text-eager-green">
            История пройдена
          </h2>
          {quest.slug.startsWith("prometheus") ? (
            <>
              <p className="max-w-[760px] text-body font-medium leading-relaxed text-charcoal">
                История завершена, но работу с базой корабля можно продолжить
                в свободной практике. Выполняй задания разной сложности или
                экспериментируй с собственными SQL-запросами.
              </p>
              <div className="mt-5">
                <Button href="/account/practice/prometheus">
                  В банк заданий «Прометея»
                </Button>
              </div>
            </>
          ) : (
            <>
              {quest.finale && (
                <RichText
                  text={quest.finale}
                  className="text-body font-medium leading-relaxed text-charcoal"
                />
              )}
              <div className="mt-5 flex flex-wrap gap-4">
                <Button href="/account/quests">К другим историям</Button>
                <Button href="/account" variant="outline">
                  В кабинет
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function LegacyMapView({
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
    (afterStep === 0 ? current >= 1 : current > afterStep);
  const sceneDone = (afterStep: number) =>
    watchedScenes.has(afterStep) ||
    completed ||
    (afterStep === 0 ? current > 1 : current > afterStep);
  const entries = buildSnakeEntries(steps, scenesBy);

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

      {/* Единый маршрут: каждая сцена и каждый урок — отдельный узел. */}
      <div className="mb-8 flex flex-col items-center gap-6 md:hidden">
        {entries.map((entry, i) => {
          if (entry.kind === "trophy") {
            return (
              <div
                key="trophy"
                className="flex flex-col items-center"
                style={{ transform: `translateX(${nodeOffset(i)}px)` }}
              >
                <TrophyNode completed={completed} />
              </div>
            );
          }

          if (entry.kind === "scene") {
            const unlocked = sceneUnlocked(entry.afterStep);
            const done = sceneDone(entry.afterStep);
            return (
              <div
                key={`scene-${entry.afterStep}`}
                className="flex flex-col items-center gap-2"
                style={{ transform: `translateX(${nodeOffset(i)}px)` }}
              >
                <SceneMapNode
                  entry={entry}
                  unlocked={unlocked}
                  done={done}
                  onPlayScene={onPlayScene}
                />
              </div>
            );
          }

          const step = entry.step;
          const isDone = completed || step.stepNumber < current;
          const isActive = !completed && step.stepNumber === current;
          const locked = !isDone && !isActive;
          return (
            <div
              key={`step-${step.stepNumber}`}
              className="flex flex-col items-center gap-2"
              style={{ transform: `translateX(${nodeOffset(i)}px)` }}
            >
              <button
                type="button"
                disabled={locked}
                onClick={() => onOpenStep(step.stepNumber)}
                aria-label={
                  locked
                    ? `Шаг ${step.stepNumber}: название пока скрыто`
                    : `Шаг ${step.stepNumber}: ${step.title}`
                }
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
                className={`max-w-[180px] text-center text-caption font-bold ${
                  locked ? "text-faded-gray" : "text-charcoal"
                }`}
              >
                Урок {step.stepNumber} · {locked ? "???" : step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Широкая змейка на весь экран — от края до края, ряд за рядом */}
      <div className="mb-8 hidden md:block">
        <SnakePath
          entries={entries}
          current={current}
          completed={completed}
          onOpenStep={onOpenStep}
          onPlayScene={onPlayScene}
          sceneUnlocked={sceneUnlocked}
          sceneDone={sceneDone}
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
            <Button href="/account/quests">К другим историям</Button>
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

type SnakeEntry =
  | { kind: "scene"; afterStep: number; sceneNumber: number }
  | { kind: "step"; step: QuestStep }
  | { kind: "trophy" };

function buildSnakeEntries(
  steps: QuestStep[],
  scenesBy: Map<number, QuestSceneFrame[]>
): SnakeEntry[] {
  const entries: SnakeEntry[] = [];

  if (scenesBy.has(0)) {
    entries.push({ kind: "scene", afterStep: 0, sceneNumber: 1 });
  }

  for (const step of steps) {
    entries.push({ kind: "step", step });
    if (scenesBy.has(step.stepNumber)) {
      entries.push({
        kind: "scene",
        afterStep: step.stepNumber,
        sceneNumber: step.stepNumber + 1,
      });
    }
  }

  entries.push({ kind: "trophy" });
  return entries;
}

function SnakePath({
  entries,
  current,
  completed,
  onOpenStep,
  onPlayScene,
  sceneUnlocked,
  sceneDone,
}: {
  entries: SnakeEntry[];
  current: number;
  completed: boolean;
  onOpenStep: (n: number) => void;
  onPlayScene: (afterStep: number) => void;
  sceneUnlocked: (afterStep: number) => boolean;
  sceneDone: (afterStep: number) => boolean;
}) {
  const rows: SnakeEntry[][] = [];
  for (let i = 0; i < entries.length; i += ROW_SIZE) {
    rows.push(entries.slice(i, i + ROW_SIZE));
  }

  const isEntryDone = (entry: SnakeEntry) =>
    entry.kind === "trophy"
      ? completed
      : entry.kind === "scene"
        ? sceneDone(entry.afterStep)
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
                  key={
                    entry.kind === "trophy"
                      ? "trophy"
                      : entry.kind === "scene"
                        ? `scene-${entry.afterStep}`
                        : `step-${entry.step.stepNumber}`
                  }
                  entry={entry}
                  current={current}
                  completed={completed}
                  onOpenStep={onOpenStep}
                  onPlayScene={onPlayScene}
                  sceneUnlocked={sceneUnlocked}
                  sceneDone={sceneDone}
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

function SceneMapNode({
  entry,
  unlocked,
  done,
  onPlayScene,
}: {
  entry: Extract<SnakeEntry, { kind: "scene" }>;
  unlocked: boolean;
  done: boolean;
  onPlayScene: (afterStep: number) => void;
}) {
  return (
    <>
      <button
        type="button"
        disabled={!unlocked}
        onClick={() => onPlayScene(entry.afterStep)}
        aria-label={`Сцена ${entry.sceneNumber}`}
        title={unlocked ? "Посмотреть сцену" : "Сцена откроется позже"}
        className={`relative flex h-[68px] w-[68px] items-center justify-center rounded-full border-b-[6px] text-[25px] font-extrabold transition-transform ${
          done
            ? "cursor-pointer border-[#006da6] bg-spark-blue text-paper-white hover:scale-105"
            : unlocked
              ? "cursor-pointer border-[#006da6] bg-spark-blue text-paper-white ring-4 ring-[#d4effd] hover:scale-105"
              : "cursor-default border-[#cfcfcf] bg-[#e5e5e5] grayscale"
        }`}
      >
        🎬
        {unlocked && !done && (
          <span className="absolute -top-9 whitespace-nowrap rounded-xl border-2 border-[#d4effd] bg-paper-white px-3 py-1 text-caption font-bold uppercase tracking-wide text-spark-blue">
            Сюжет
          </span>
        )}
      </button>
      <span
        className={`max-w-[104px] text-center text-caption font-bold ${
          unlocked ? "text-charcoal" : "text-faded-gray"
        }`}
      >
        Сцена {entry.sceneNumber}
      </span>
    </>
  );
}

function TrophyNode({ completed }: { completed: boolean }) {
  return (
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
  );
}

function SnakeNode({
  entry,
  current,
  completed,
  onOpenStep,
  onPlayScene,
  sceneUnlocked,
  sceneDone,
  connectorAfter,
}: {
  entry: SnakeEntry;
  current: number;
  completed: boolean;
  onOpenStep: (n: number) => void;
  onPlayScene: (afterStep: number) => void;
  sceneUnlocked: (afterStep: number) => boolean;
  sceneDone: (afterStep: number) => boolean;
  /** true/false — рисовать соединитель после узла и его цвет; undefined — не рисовать */
  connectorAfter: boolean | undefined;
}) {
  const cell = (
    <div
      className="flex shrink-0 flex-col items-center gap-2"
      style={{ width: NODE_CELL_PX }}
    >
      {entry.kind === "trophy" ? (
        <TrophyNode completed={completed} />
      ) : entry.kind === "scene" ? (
        <SceneMapNode
          entry={entry}
          unlocked={sceneUnlocked(entry.afterStep)}
          done={sceneDone(entry.afterStep)}
          onPlayScene={onPlayScene}
        />
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
                aria-label={
                  locked
                    ? `Шаг ${step.stepNumber}: название пока скрыто`
                    : `Шаг ${step.stepNumber}: ${step.title}`
                }
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
                Урок {step.stepNumber} · {locked ? "???" : step.title}
              </span>
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
  isCompletedStep,
  canRunCheck,
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
  onToggleFullscreen,
}: {
  quest: Quest;
  step: QuestStep;
  isCurrent: boolean;
  isCompletedStep: boolean;
  canRunCheck: boolean;
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
  onToggleFullscreen: () => void;
}) {
  const [errorReportOpen, setErrorReportOpen] = useState(false);
  const showOutcome = (isCompletedStep || solved) && step.outcome;
  // Панели занимают всё место от строки навигации до нижнего края экрана.
  // Раньше ограничение 76vh оставляло снизу широкую пустую полосу.
  const panelHeight = isFullscreen
    ? "md:h-[calc(100dvh-112px)] md:max-h-none"
    : "md:h-[calc(100dvh-108px)] md:max-h-none";

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

        <div className="flex flex-wrap items-center justify-end gap-2">
          {/* Кнопка перехода дальше — появляется после решения текущего шага */}
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
              {isCompletedStep && " ✓"}
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

          <button
            type="button"
            onClick={onToggleFullscreen}
            title={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            className={`${navBtn} border-faded-gray text-[16px] text-spark-blue hover:border-spark-blue`}
          >
            {isFullscreen ? "✕" : "⛶"}
          </button>
        </div>
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

          {/* Обучение и сразу под ним подсказка — оба блока свёрнуты. */}
          {step.theory && (
            <details className="mb-3 overflow-hidden rounded-xl border-2 border-spark-blue">
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

          {step.hint && (
            <details className="mb-1 overflow-hidden rounded-xl border-2 border-[#e5e5e5]">
              <summary className="cursor-pointer bg-[#f4f4f4] px-4 py-2.5 text-nav-label font-bold uppercase tracking-wide text-spark-blue">
                💡 Подсказка
              </summary>
              <div className="px-4 py-3 font-mono text-caption text-charcoal whitespace-pre-wrap">
                {step.hint}
              </div>
            </details>
          )}

          <button
            type="button"
            onClick={() => setErrorReportOpen(true)}
            className="mt-3 inline-flex items-center gap-2 rounded-xl border-2 border-[#ef9c7d] bg-[#fff7f3] px-4 py-2.5 text-caption font-extrabold uppercase tracking-wide text-[#bd4d2b] transition-colors hover:border-[#d85b36] hover:bg-[#fff0e9]"
          >
            <span aria-hidden>⚑</span>
            Сообщить об ошибке
          </button>
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
            onCorrect={canRunCheck ? onSolved : undefined}
          />
          {isCompletedStep && (
            <p className="mt-2 text-caption font-medium text-faded-gray">
              Этот шаг уже решён — терминал открыт для экспериментов.
            </p>
          )}
          {!isCompletedStep && !isCurrent && canRunCheck && (
            <p className="mt-2 text-caption font-medium text-spark-blue">
              Тестовый доступ: проверка этого урока включена без изменения текущего прогресса.
            </p>
          )}
        </div>
      </div>

      {errorReportOpen && (
        <ErrorReportModal
          questTitle={quest.title}
          questSlug={quest.slug}
          stepNumber={step.stepNumber}
          stepTitle={step.title}
          onClose={() => setErrorReportOpen(false)}
        />
      )}
    </div>
  );
}
