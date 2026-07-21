import { NextResponse } from "next/server";
import { sendFeedbackEmail } from "@/lib/email";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const TOPICS = new Set(["Предложение", "Ошибка на сайте", "Вопрос", "Другое"]);
const attempts = new Map<string, { count: number; resetAt: number }>();

export async function POST(req: Request) {
  let body: {
    name?: string;
    email?: string;
    topic?: string;
    message?: string;
    website?: string;
    pdConsent?: boolean;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Некорректный запрос." }, { status: 400 });
  }

  // Скрытое поле заполняют боты. Для них возвращаем нейтральный успех.
  if (body.website) return NextResponse.json({ ok: true });

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim().toLowerCase();
  const topic = (body.topic ?? "").trim();
  const message = (body.message ?? "").trim();

  if (name.length < 2 || name.length > 80) return invalid("Укажи имя от 2 до 80 символов.");
  if (!EMAIL_RE.test(email) || email.length > 254) return invalid("Укажи корректный email.");
  if (!TOPICS.has(topic)) return invalid("Выбери тему обращения.");
  if (message.length < 10 || message.length > 3000) return invalid("Сообщение должно содержать от 10 до 3000 символов.");
  if (body.pdConsent !== true) return invalid("Нужно согласие на обработку данных для ответа.");

  const forwarded = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const key = forwarded || "local";
  const now = Date.now();
  const current = attempts.get(key);
  if (current && current.resetAt > now && current.count >= 5) {
    return NextResponse.json({ ok: false, error: "Слишком много сообщений. Попробуй через час." }, { status: 429 });
  }
  attempts.set(key, {
    count: current && current.resetAt > now ? current.count + 1 : 1,
    resetAt: current && current.resetAt > now ? current.resetAt : now + 60 * 60 * 1000,
  });

  try {
    const sent = await sendFeedbackEmail({ name, email, topic, message });
    if (!sent) {
      return NextResponse.json({ ok: false, error: "Почтовый сервис временно недоступен. Попробуй позже." }, { status: 503 });
    }
    return NextResponse.json({ ok: true, message: "Сообщение отправлено. Спасибо!" });
  } catch (error) {
    console.error("Feedback route failed:", error);
    return NextResponse.json({ ok: false, error: "Не удалось отправить сообщение." }, { status: 500 });
  }
}

function invalid(error: string) {
  return NextResponse.json({ ok: false, error }, { status: 400 });
}
