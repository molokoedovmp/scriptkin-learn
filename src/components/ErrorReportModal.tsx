"use client";

import { useEffect, useId } from "react";
import { FeedbackForm } from "./FeedbackForm";

export function ErrorReportModal({
  questTitle,
  questSlug,
  stepNumber,
  stepTitle,
  onClose,
}: {
  questTitle: string;
  questSlug: string;
  stepNumber: number;
  stepTitle: string;
  onClose: () => void;
}) {
  const titleId = useId();
  const context = [
    "Источник: редактор истории",
    `История: ${questTitle} (${questSlug})`,
    `Урок ${stepNumber}: ${stepTitle}`,
    `Страница: /account/quests/${questSlug}`,
  ].join("\n");

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-night-ink/75 p-3 backdrop-blur-sm sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="mx-auto flex min-h-full max-w-[720px] items-center justify-center">
        <section className="relative w-full rounded-[24px] bg-[#f7f8fa] p-4 shadow-2xl sm:p-6">
          <button
            type="button"
            onClick={onClose}
            autoFocus
            aria-label="Закрыть окно"
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-[#dedede] bg-paper-white text-xl font-black text-pencil-gray hover:border-spark-blue hover:text-spark-blue"
          >
            ×
          </button>

          <div className="mb-4 pr-12">
            <p className="text-caption font-extrabold uppercase tracking-[0.12em] text-[#d85b36]">
              Сообщение об ошибке
            </p>
            <h2 id={titleId} className="mt-1 text-subheading font-black text-charcoal sm:text-heading-sm">
              Что работает неправильно?
            </h2>
            <p className="mt-2 text-[15px] font-medium text-pencil-gray">
              Контекст урока добавится к сообщению автоматически.
            </p>
          </div>

          <div className="mb-4 rounded-xl border-2 border-[#e5e5e5] bg-paper-white px-4 py-3 text-caption font-bold text-pencil-gray">
            {questTitle} · Урок {stepNumber} · {stepTitle}
          </div>

          <FeedbackForm
            defaultTopic="Ошибка на сайте"
            context={context}
            compact
            onDone={onClose}
          />
        </section>
      </div>
    </div>
  );
}
