export type QuestDifficulty = "beginner" | "intermediate" | "advanced";

export type QuestStatus = "available" | "coming_soon";

export interface Quest {
  slug: string;
  title: string;
  tagline: string;
  intro: string;
  /** Финальная глава — показывается после последнего шага */
  finale?: string | null;
  /** Обложка квеста для карточек каталога */
  previewUrl?: string | null;
  difficulty: QuestDifficulty;
  stepsCount: number;
  emoji: string;
  status: QuestStatus;
}

export interface QuestStep {
  questSlug: string;
  stepNumber: number;
  title: string;
  /** Глава сюжета, которую игрок читает перед заданием */
  story: string;
  /** Развитие истории после правильного ответа */
  outcome?: string | null;
  /** Обучающий блок: команды шага и как они работают */
  theory?: string | null;
  /** Задание для игрока: что нужно узнать SQL-запросом */
  task: string;
  hint?: string | null;
}

/** Кадр сцены визуальной новеллы между уровнями */
export interface QuestSceneFrame {
  /** 0 — пролог перед первым шагом, N — после решения шага N */
  afterStep: number;
  frameOrder: number;
  imageUrl?: string | null;
  /** Кто говорит; null — текст рассказчика */
  speaker?: string | null;
  text: string;
}

export interface ExecuteRequest {
  questSlug: string;
  /** Номер сюжетного шага. Не передаётся в свободной тренировке. */
  stepNumber?: number;
  /** Задание из банка — проверяется отдельно и не двигает сюжет. */
  practiceTaskId?: string;
  sql: string;
}

export interface ExecuteResponse {
  ok: boolean;
  /** Колонки и строки результата запроса игрока */
  columns?: string[];
  rows?: Record<string, unknown>[];
  /** Правильный ли это ответ для текущего шага */
  correct?: boolean;
  /** Конкретная причина несовпадения с эталоном (колонки/строки) */
  checkHint?: string;
  /** Сюжет, который открывается при правильном ответе */
  storyUnlocked?: string;
  error?: string;
}

export type PracticeDifficulty = "easy" | "medium" | "hard";

export interface PracticeTable {
  name: string;
  description: string;
  columns: string[];
}

export interface PracticeTask {
  id: string;
  number: number;
  title: string;
  difficulty: PracticeDifficulty;
  description: string;
  hint: string;
  starterSql: string;
  /** Эталон можно открыть в интерфейсе после самостоятельной попытки. */
  solution: string;
  /** Если true, проверка учитывает порядок строк в результате. */
  orderMatters?: boolean;
}

export interface PracticeDatabase {
  questSlug: string;
  title: string;
  emoji: string;
  description: string;
  tables: PracticeTable[];
  tasks: PracticeTask[];
}

export interface SessionUser {
  id: string;
  email: string;
  name: string;
  bio: string | null;
}

export interface QuestProgressEntry {
  questSlug: string;
  title: string;
  emoji: string;
  stepsCount: number;
  currentStep: number;
  completedAt: string | null;
}

export const DIFFICULTY_LABELS: Record<QuestDifficulty, string> = {
  beginner: "Новичок",
  intermediate: "Средний",
  advanced: "Продвинутый",
};
