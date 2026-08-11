"use client";

import Script from "next/script";
import { useEffect, useState } from "react";

const COUNTER_ID = 111507261;
const CONSENT_KEY = "sk-cookie-consent";
const CONSENT_EVENT = "sk-cookie-consent-changed";

const metrikaScript = `
(function(m,e,t,r,i,k,a){
    m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
    m[i].l=1*new Date();
    for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
    k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)
})(window, document,'script','https://mc.yandex.ru/metrika/tag.js?id=${COUNTER_ID}', 'ym');

ym(${COUNTER_ID}, 'init', {ssr:true, webvisor:true, clickmap:true, ecommerce:"dataLayer", referrer: document.referrer, url: location.href, accurateTrackBounce:true, trackLinks:true});
`;

export function YandexMetrika() {
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    const savedChoice = window.localStorage.getItem(CONSENT_KEY);
    // Старое значение было ISO-датой и означало принятие cookie.
    setAllowed(Boolean(savedChoice && savedChoice !== "declined"));

    function handleConsent(event: Event) {
      const choice = (event as CustomEvent<{ choice?: string }>).detail?.choice;
      setAllowed(choice === "accepted");
    }

    window.addEventListener(CONSENT_EVENT, handleConsent);
    return () => window.removeEventListener(CONSENT_EVENT, handleConsent);
  }, []);

  if (!allowed) return null;

  return (
    <Script id="yandex-metrika" strategy="afterInteractive">
      {metrikaScript}
    </Script>
  );
}
