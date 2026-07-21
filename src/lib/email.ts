import { Resend } from "resend";

/**
 * Отправка писем через Resend (https://resend.com).
 *
 * Ключ берётся из переменной окружения RESEND_API_KEY (см. .env.example).
 * Если ключ не задан, отправка тихо пропускается — регистрация и прочие
 * сценарии не должны ломаться из-за почты.
 *
 * Адрес отправителя onboarding@resend.dev — тестовый домен Resend:
 * с него письма доходят только на email владельца аккаунта Resend.
 * Для продакшена подтверди свой домен в Resend и задай EMAIL_FROM.
 */
let resend: Resend | undefined;

function getResend(): Resend | null {
  if (!process.env.RESEND_API_KEY) return null;
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM = process.env.EMAIL_FROM ?? "Скрипткин <onboarding@resend.dev>";
const SITE_URL = process.env.SITE_URL ?? "http://localhost:3000";

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY не задан — письмо не отправлено:", subject);
    return;
  }
  const { error } = await client.emails.send({ from: FROM, to, subject, html });
  if (error) {
    console.error("Не удалось отправить письмо:", error);
  }
}

/** Приветственное письмо после регистрации */
export function sendWelcomeEmail(to: string, name: string): Promise<void> {
  return sendEmail({
    to,
    subject: "Добро пожаловать в Скрипткин 🚂",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #4b4b4b;">
        <h1 style="color: #58cc02; font-size: 28px;">Привет, ${escapeHtml(name)}!</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #777777;">
          Аккаунт создан — теперь прогресс по квестам сохраняется автоматически.
        </p>
        <p style="font-size: 16px; line-height: 1.5; color: #777777;">
          Ночной экспресс №13 уже отправляется, а купе №7 вот-вот опустеет.
          Каждый правильный SQL-запрос открывает следующую главу.
        </p>
        <p style="margin: 24px 0;">
          <a href="${SITE_URL}/quests/midnight-express"
             style="background: #58cc02; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 12px; display: inline-block;">
            НАЧАТЬ РАССЛЕДОВАНИЕ
          </a>
        </p>
        <p style="font-size: 13px; color: #afafaf;">
          Скрипткин — учи SQL, раскрывая дела. SELECT — оружие детектива.
        </p>
      </div>
    `,
  });
}

/** Одноразовая ссылка восстановления пароля, действует один час. */
export function sendPasswordResetEmail(
  to: string,
  name: string,
  token: string
): Promise<void> {
  const resetUrl = `${SITE_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Восстановление пароля — Скрипткин",
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; color: #4b4b4b;">
        <h1 style="color: #58cc02; font-size: 28px;">Новый пароль</h1>
        <p style="font-size: 16px; line-height: 1.5; color: #777777;">
          ${escapeHtml(name)}, мы получили запрос на восстановление пароля.
          Ссылка действует один час и может быть использована только один раз.
        </p>
        <p style="margin: 24px 0;">
          <a href="${resetUrl}"
             style="background: #58cc02; color: #ffffff; text-decoration: none; font-weight: bold; padding: 12px 24px; border-radius: 12px; display: inline-block;">
            СОЗДАТЬ НОВЫЙ ПАРОЛЬ
          </a>
        </p>
        <p style="font-size: 13px; color: #afafaf;">
          Если ты не запрашивал восстановление, просто проигнорируй письмо.
        </p>
      </div>
    `,
  });
}

const FEEDBACK_RECIPIENT = "molokoedovmp@gmail.com";

/** Сообщение из формы обратной связи. Возвращает false, если почта недоступна. */
export async function sendFeedbackEmail({
  name,
  email,
  topic,
  message,
}: {
  name: string;
  email: string;
  topic: string;
  message: string;
}): Promise<boolean> {
  const client = getResend();
  if (!client) {
    console.warn("RESEND_API_KEY не задан — обратная связь не отправлена.");
    return false;
  }

  const { error } = await client.emails.send({
    from: FROM,
    to: FEEDBACK_RECIPIENT,
    replyTo: email,
    subject: `Скрипткин: ${topic}`,
    html: `
      <div style="font-family: -apple-system, 'Segoe UI', Roboto, sans-serif; max-width: 620px; margin: 0 auto; color: #4b4b4b;">
        <div style="background:#000437; color:#ffffff; padding:24px; border-radius:16px 16px 0 0;">
          <div style="color:#a5ed6e; font-size:12px; font-weight:800; text-transform:uppercase; letter-spacing:.08em;">Обратная связь</div>
          <h1 style="margin:8px 0 0; font-size:24px;">${escapeHtml(topic)}</h1>
        </div>
        <div style="border:2px solid #e5e5e5; border-top:0; padding:24px; border-radius:0 0 16px 16px;">
          <p style="margin:0 0 8px;"><strong>От:</strong> ${escapeHtml(name)}</p>
          <p style="margin:0 0 20px;"><strong>Email:</strong> ${escapeHtml(email)}</p>
          <div style="white-space:pre-wrap; line-height:1.6; background:#f7f8fa; padding:18px; border-radius:12px;">${escapeHtml(message)}</div>
          <p style="margin:20px 0 0; color:#777777; font-size:13px;">На это письмо можно ответить напрямую — Reply-To установлен на адрес пользователя.</p>
        </div>
      </div>
    `,
  });
  if (error) {
    console.error("Не удалось отправить обратную связь:", error);
    return false;
  }
  return true;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
