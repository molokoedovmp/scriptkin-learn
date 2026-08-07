import { NextResponse } from "next/server";
import { syncYooKassaPayment } from "@/lib/payments";

interface YooKassaNotification {
  type?: string;
  event?: string;
  object?: {
    id?: string;
  };
}

/**
 * URL нужно указать в кабинете YooKassa для событий payment.succeeded и
 * payment.canceled. Подлинность подтверждается повторным GET платежа из API.
 */
export async function POST(req: Request) {
  let notification: YooKassaNotification;
  try {
    notification = (await req.json()) as YooKassaNotification;
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  const paymentId = notification.object?.id;
  const supportedEvent =
    notification.event === "payment.succeeded" ||
    notification.event === "payment.canceled";
  if (
    notification.type !== "notification" ||
    !supportedEvent ||
    !paymentId
  ) {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await syncYooKassaPayment(paymentId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Failed to process YooKassa webhook:", error);
    // Не подтверждаем уведомление: YooKassa повторит доставку.
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}
