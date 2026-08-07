import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { createStoryPayment } from "@/lib/payments";
import { isYooKassaConfigured, YooKassaError } from "@/lib/yookassa";

export async function POST(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена." },
      { status: 503 }
    );
  }
  if (!isYooKassaConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Оплата временно недоступна: YooKassa ещё не настроена." },
      { status: 503 }
    );
  }

  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Войди в аккаунт перед покупкой." },
      { status: 401 }
    );
  }

  let body: { questSlug?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Некорректный JSON." },
      { status: 400 }
    );
  }
  const questSlug = body.questSlug?.trim();
  if (!questSlug || !/^[a-z0-9-]{1,80}$/.test(questSlug)) {
    return NextResponse.json(
      { ok: false, error: "Некорректная история." },
      { status: 400 }
    );
  }

  try {
    const result = await createStoryPayment({
      userId: user.id,
      userEmail: user.email,
      questSlug,
      returnBaseUrl: resolveSiteUrl(req),
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Failed to create YooKassa payment:", error);
    const message =
      error instanceof YooKassaError || error instanceof Error
        ? error.message
        : "Не удалось создать платёж.";
    return NextResponse.json({ ok: false, error: message }, { status: 502 });
  }
}

function resolveSiteUrl(req: Request): string {
  const configuredUrl = process.env.SITE_URL?.trim();
  if (configuredUrl) return new URL(configuredUrl).origin;
  return new URL(req.url).origin;
}
