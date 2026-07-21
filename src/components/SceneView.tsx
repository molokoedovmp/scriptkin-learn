"use client";

import { useState } from "react";
import type { QuestSceneFrame } from "@/lib/types";
import { Button } from "./Button";
import { RichText } from "./RichText";

/**
 * Плеер сцены визуальной новеллы: крупный блок с иллюстрацией внутри
 * страницы, окно реплики — внизу блока. Растягивается на весь экран
 * только тогда, когда пользователь сам включил полноэкранный режим
 * кнопкой ⛶ — сцена не переключает его самостоятельно. В этом режиме
 * картинка идёт от края до края (без рамки и скруглений), а кнопка
 * выхода из полноэкранного режима лежит прямо на изображении.
 * Кадры листаются в обе стороны, выход — только кнопкой «Продолжить».
 */
export function SceneView({
  frames,
  isFullscreen,
  onToggleFullscreen,
  onFinish,
}: {
  frames: QuestSceneFrame[];
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const frame = frames[index];
  const isLast = index === frames.length - 1;

  return (
    <div
      className={`relative w-full bg-night-ink ${
        isFullscreen
          ? "h-screen"
          : "aspect-video max-h-[70vh] overflow-hidden rounded-xl border-2 border-night-ink"
      }`}
    >
      {/* Иллюстрация; клик по ней листает вперёд */}
      <div
        className={`absolute inset-0 ${isLast ? "" : "cursor-pointer"}`}
        onClick={() => !isLast && setIndex(index + 1)}
      >
        {frame.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frame.imageUrl}
            alt=""
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className="flex h-full w-full items-center justify-center text-8xl"
            aria-hidden
          >
            🎬
          </div>
        )}
      </div>

      {/* Кнопка выхода из полноэкранного режима — прямо на картинке */}
      {isFullscreen && (
        <button
          type="button"
          onClick={onToggleFullscreen}
          title="Выйти из полноэкранного режима"
          aria-label="Выйти из полноэкранного режима"
          className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-paper-white/60 bg-night-ink/60 text-[18px] font-bold text-paper-white hover:bg-night-ink/80"
        >
          ✕
        </button>
      )}

      {/* Окно реплики внизу блока */}
      <div className="absolute inset-x-0 bottom-0 flex justify-center p-3 md:p-6">
        <div className="w-full max-w-[900px] rounded-xl border-2 border-charcoal bg-paper-white p-4 md:p-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            {frame.speaker ? (
              <span className="inline-block rounded-full bg-spark-blue px-3 py-1 text-caption font-bold uppercase tracking-wide text-paper-white">
                {frame.speaker}
              </span>
            ) : (
              <span className="inline-block rounded-full bg-[#e5e5e5] px-3 py-1 text-caption font-bold uppercase tracking-wide text-pencil-gray">
                Рассказчик
              </span>
            )}
            <span className="whitespace-nowrap text-caption font-bold text-faded-gray">
              {index + 1} / {frames.length}
            </span>
          </div>

          <div className="max-h-[32vh] overflow-y-auto">
            <RichText
              text={frame.text}
              className="text-body font-medium leading-relaxed text-charcoal"
            />
          </div>

          <div className="mt-3 flex items-center justify-between gap-4">
            {/* Навигация по кадрам: назад + кликабельные точки */}
            <span className="flex items-center gap-2">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => setIndex(index - 1)}
                aria-label="Предыдущий кадр"
                className={`flex h-9 w-9 items-center justify-center rounded-xl border-2 text-[18px] font-bold ${
                  index === 0
                    ? "cursor-default border-[#e5e5e5] text-faded-gray"
                    : "border-faded-gray text-spark-blue hover:border-spark-blue"
                }`}
              >
                ‹
              </button>
              <span className="flex items-center gap-1.5">
                {frames.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Кадр ${i + 1}`}
                    className={`h-3 w-3 rounded-full transition-colors ${
                      i === index
                        ? "bg-eager-green"
                        : i < index
                          ? "bg-fresh-leaf hover:bg-eager-green"
                          : "bg-[#e5e5e5] hover:bg-faded-gray"
                    }`}
                  />
                ))}
              </span>
            </span>

            {isLast ? (
              <Button onClick={onFinish}>Продолжить</Button>
            ) : (
              <Button onClick={() => setIndex(index + 1)}>Далее ▸</Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
