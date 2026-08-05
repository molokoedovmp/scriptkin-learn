"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
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
  textBackgroundUrl,
  textStyle = "default",
  hideFrameControls = false,
  onToggleFullscreen,
  onFinish,
}: {
  frames: QuestSceneFrame[];
  isFullscreen: boolean;
  textBackgroundUrl?: string;
  textStyle?: "default" | "midnight" | "prometheus";
  hideFrameControls?: boolean;
  onToggleFullscreen: () => void;
  onFinish: () => void;
}) {
  const [index, setIndex] = useState(0);
  const imageUrls = useMemo(
    () =>
      Array.from(
        new Set(
          frames
            .map((sceneFrame) => sceneFrame.imageUrl)
            .filter((url): url is string => Boolean(url))
        )
      ),
    [frames]
  );
  const preloadedImages = useRef<HTMLImageElement[]>([]);
  const imageDimensions = useRef(
    new Map<string, { width: number; height: number }>()
  );
  const [loadedImages, setLoadedImages] = useState(0);
  const [imagesReady, setImagesReady] = useState(imageUrls.length === 0);
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;
    preloadedImages.current = [];
    imageDimensions.current.clear();
    setLoadedImages(0);
    setFailedImages(new Set());

    if (imageUrls.length === 0) {
      setImagesReady(true);
      return;
    }

    setImagesReady(false);

    const loadImage = (url: string) =>
      new Promise<void>((resolve) => {
        const image = new window.Image();
        preloadedImages.current.push(image);
        let finished = false;
        const timeout = window.setTimeout(() => finish("timeout"), 12000);

        function finish(result: "loaded" | "failed" | "timeout") {
          if (finished) return;
          finished = true;
          window.clearTimeout(timeout);
          if (!cancelled) {
            if (result === "failed") {
              setFailedImages((current) => new Set(current).add(url));
            }
            setLoadedImages((current) => current + 1);
          }
          resolve();
        }

        image.onload = () => {
          // decode() дожидается не только сети, но и готовности картинки
          // к отрисовке — при смене реплики старый кадр не задерживается.
          const markLoaded = () => {
            if (!cancelled && image.naturalWidth > 0 && image.naturalHeight > 0) {
              imageDimensions.current.set(url, {
                width: image.naturalWidth,
                height: image.naturalHeight,
              });
            }
            finish("loaded");
          };

          image
            .decode()
            .then(markLoaded)
            .catch(markLoaded);
        };
        image.onerror = () => finish("failed");
        image.src = url;
      });

    Promise.all(imageUrls.map(loadImage)).then(() => {
      if (!cancelled) setImagesReady(true);
    });

    return () => {
      cancelled = true;
      preloadedImages.current = [];
    };
  }, [imageUrls]);

  if (!imagesReady) {
    const progress = Math.round((loadedImages / imageUrls.length) * 100);

    return (
      <div
        className={`relative flex w-full items-center justify-center bg-night-ink text-paper-white ${
          isFullscreen
            ? "h-[100dvh]"
            : "min-h-[360px] overflow-hidden rounded-xl border-2 border-night-ink sm:aspect-video sm:min-h-0 sm:max-h-[70vh]"
        }`}
        role="status"
        aria-live="polite"
      >
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

        <div className="w-full max-w-sm px-8 text-center">
          <div className="mx-auto mb-5 h-12 w-12 animate-spin rounded-full border-4 border-paper-white/25 border-t-eager-green" />
          <p className="text-heading-sm font-bold">Загружаем сцену…</p>
          <p className="mt-2 text-caption font-medium text-paper-white/70">
            Иллюстрации: {loadedImages} из {imageUrls.length}
          </p>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-paper-white/20">
            <div
              className="h-full rounded-full bg-eager-green transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

  const frame = frames[index];
  const isLast = index === frames.length - 1;
  const frameDimensions = frame.imageUrl
    ? imageDimensions.current.get(frame.imageUrl)
    : undefined;
  const desktopAspectRatio = frameDimensions
    ? `${frameDimensions.width * 2} / ${frameDimensions.height}`
    : "16 / 9";
  const imageAspectRatio = frameDimensions
    ? `${frameDimensions.width} / ${frameDimensions.height}`
    : "4 / 3";
  const sceneCopyClassName =
    textStyle === "midnight"
      ? "midnight-scene-copy"
      : textStyle === "prometheus"
        ? "prometheus-scene-copy"
        : "";

  return (
    <div
      className={`relative flex w-full flex-col overflow-hidden bg-night-ink sm:block lg:grid lg:grid-cols-2 ${
        textBackgroundUrl ? "midnight-scene" : ""
      } ${
        isFullscreen
          ? "h-[100dvh]"
          : "rounded-xl border-2 border-night-ink sm:aspect-video sm:max-h-[70vh] lg:aspect-[var(--scene-desktop-ratio)] lg:max-h-none"
      }`}
      style={
        !isFullscreen
          ? ({
              "--scene-desktop-ratio": desktopAspectRatio,
              "--scene-image-ratio": imageAspectRatio,
            } as CSSProperties)
          : undefined
      }
    >
      {/* Иллюстрация; клик по ней листает вперёд */}
      <div
        className={`${
          isFullscreen
            ? "relative min-h-0 flex-1"
            : "relative aspect-[var(--scene-image-ratio)] shrink-0"
        } sm:absolute sm:inset-0 sm:aspect-auto lg:relative lg:inset-auto ${
          isLast ? "" : "cursor-pointer"
        }`}
        onClick={() => !isLast && setIndex(index + 1)}
      >
        {frame.imageUrl && !failedImages.has(frame.imageUrl) ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={frame.imageUrl}
            src={frame.imageUrl}
            alt=""
            className={`h-full w-full object-contain sm:object-cover ${
              isFullscreen ? "lg:object-cover" : "lg:object-contain"
            }`}
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

      {/* На ПК текст занимает правую половину, background.png лежит под ним. */}
      <div className="relative isolate z-0 flex min-h-0 shrink-0 justify-center overflow-hidden sm:absolute sm:inset-x-0 sm:bottom-0 lg:relative lg:inset-auto lg:h-full lg:self-stretch lg:items-stretch">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={
            textBackgroundUrl
              ? {
                  backgroundColor: "#17130f",
                  backgroundImage: `linear-gradient(rgb(0 0 0 / 12%), rgb(0 0 0 / 32%)), url("${textBackgroundUrl}")`,
                }
              : undefined
          }
          aria-hidden
        />
        <div
          className={`relative z-10 flex min-h-0 w-full max-w-[900px] flex-col bg-transparent p-4 sm:p-5 md:p-6 lg:h-full lg:max-w-none lg:p-7 ${
            textStyle === "prometheus" ? "prometheus-scene-panel" : ""
          }`}
        >
          {!hideFrameControls && (
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
          )}

          <div
            className={`min-h-0 max-h-[32dvh] overflow-y-auto overscroll-contain pr-1 sm:max-h-[34vh] lg:max-h-none lg:flex-1 lg:pr-3 ${
              sceneCopyClassName
            }`}
          >
            <RichText
              text={frame.text}
              className="text-[15px] font-medium leading-relaxed text-paper-white sm:text-body"
            />
          </div>

          <div
            className={`mt-3 flex items-center gap-2 sm:gap-4 ${
              hideFrameControls ? "justify-end" : "justify-between"
            }`}
          >
            {/* Навигация по кадрам: назад + кликабельные точки */}
            {!hideFrameControls && (
              <span className="flex min-w-0 items-center gap-2">
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
                <span className="flex min-w-0 items-center gap-1.5 overflow-x-auto py-1">
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
            )}

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
