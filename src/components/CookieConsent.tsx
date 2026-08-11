"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";

const CONSENT_KEY = "sk-cookie-consent";
const CONSENT_EVENT = "sk-cookie-consent-changed";

/**
 * Уведомление об использовании cookie. Необходимые cookie работают всегда,
 * а аналитика включается только после отдельного согласия пользователя.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function saveChoice(choice: "accepted" | "declined") {
    window.localStorage.setItem(CONSENT_KEY, choice);
    window.dispatchEvent(
      new CustomEvent(CONSENT_EVENT, { detail: { choice } })
    );
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[60] px-4 pb-4 md:bottom-0">
      <div className="mx-auto flex max-w-[800px] flex-col items-start gap-3 rounded-xl border-2 border-charcoal bg-paper-white p-4 sm:flex-row sm:items-center">
        <p className="grow text-caption font-medium leading-relaxed text-pencil-gray">
          🍪 Необходимые cookie используются для входа и работы сервиса.
          С вашего согласия мы также включим обезличенную аналитику, чтобы
          улучшать Скрипткин. Подробнее: {" "}
          <Link
            href="/legal/cookies"
            className="font-bold text-spark-blue underline underline-offset-2"
          >
            политика использования cookie
          </Link>{" "}
          и{" "}
          <Link
            href="/legal/privacy"
            className="font-bold text-spark-blue underline underline-offset-2"
          >
            политика обработки персональных данных
          </Link>
          .
        </p>
        <div className="flex w-full shrink-0 gap-2 sm:w-auto">
          <button
            type="button"
            onClick={() => saveChoice("declined")}
            className="min-h-10 flex-1 rounded-xl border-2 border-[#d7dbe2] bg-paper-white px-4 py-2 text-caption font-extrabold uppercase text-pencil-gray transition-colors hover:border-charcoal hover:text-charcoal sm:flex-none"
          >
            Отказаться
          </button>
          <Button
            onClick={() => saveChoice("accepted")}
            className="min-h-10 flex-1 shrink-0 sm:flex-none"
          >
            Разрешить
          </Button>
        </div>
      </div>
    </div>
  );
}
