"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "./Button";

const CONSENT_KEY = "sk-cookie-consent";

/**
 * Уведомление об использовании cookie. Показывается до принятия;
 * факт и время принятия сохраняются в localStorage.
 */
export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(CONSENT_KEY)) {
      setVisible(true);
    }
  }, []);

  if (!visible) return null;

  function accept() {
    window.localStorage.setItem(CONSENT_KEY, new Date().toISOString());
    setVisible(false);
  }

  return (
    <div className="fixed inset-x-0 bottom-[calc(68px+env(safe-area-inset-bottom))] z-[60] px-4 pb-4 md:bottom-0">
      <div className="mx-auto flex max-w-[800px] flex-col items-start gap-3 rounded-xl border-2 border-charcoal bg-paper-white p-4 sm:flex-row sm:items-center">
        <p className="grow text-caption font-medium leading-relaxed text-pencil-gray">
          🍪 Мы используем cookie, необходимые для входа в аккаунт и работы
          сервиса. Продолжая пользоваться Скрипткином, вы соглашаетесь с{" "}
          <Link
            href="/legal/cookies"
            className="font-bold text-spark-blue underline underline-offset-2"
          >
            политикой использования cookie
          </Link>{" "}
          и{" "}
          <Link
            href="/legal/privacy"
            className="font-bold text-spark-blue underline underline-offset-2"
          >
            политикой обработки персональных данных
          </Link>
          .
        </p>
        <Button onClick={accept} className="shrink-0">
          Хорошо
        </Button>
      </div>
    </div>
  );
}
