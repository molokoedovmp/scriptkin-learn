import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/db";
import { continueUserPayment } from "@/lib/payments";
import { isYooKassaConfigured, YooKassaError } from "@/lib/yookassa";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { ok: false, error: "База данных не настроена." },
      { status: 503 }
    );
  }
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { ok: false, error: "Нужно войти в аккаунт." },
      { status: 401 }
    );
  }
  if (!isYooKassaConfigured()) {
    return NextResponse.json(
      { ok: false, error: "Оплата временно недоступна: YooKassa ещё не настроена." },
      { status: 503 }
    );
  }

  const { paymentId } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(paymentId)) {
    return NextResponse.json(
      { ok: false, error: "Некорректный номер платежа." },
      { status: 400 }
    );
  }

  try {
    const result = await continueUserPayment(paymentId, user.id);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Failed to continue YooKassa payment:", error);
    const message =
      error instanceof YooKassaError || error instanceof Error
        ? error.message
        : "Не удалось продолжить оплату.";
    return NextResponse.json({ ok: false, error: message }, { status: 409 });
  }
}
