import "server-only";

const YOOKASSA_API = "https://api.yookassa.ru/v3";
const REQUEST_TIMEOUT_MS = 10_000;

export type YooKassaPaymentStatus =
  | "pending"
  | "waiting_for_capture"
  | "succeeded"
  | "canceled";

export interface YooKassaPayment {
  id: string;
  status: YooKassaPaymentStatus;
  paid: boolean;
  amount: {
    value: string;
    currency: string;
  };
  confirmation?: {
    type: string;
    confirmation_url?: string;
  };
  metadata?: Record<string, string>;
}

interface CreatePaymentInput {
  amountKopecks: number;
  description: string;
  customerEmail: string;
  returnUrl: string;
  idempotenceKey: string;
  metadata: Record<string, string>;
}

export class YooKassaError extends Error {
  constructor(
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "YooKassaError";
  }
}

export function isYooKassaConfigured(): boolean {
  return Boolean(
    process.env.YOOKASSA_SHOP_ID?.trim() &&
      process.env.YOOKASSA_SECRET_KEY?.trim()
  );
}

export async function createYooKassaPayment(
  input: CreatePaymentInput
): Promise<YooKassaPayment> {
  const amount = {
    value: formatAmount(input.amountKopecks),
    currency: "RUB",
  };
  const receiptDescription = input.description.slice(0, 128);
  return requestYooKassa<YooKassaPayment>("/payments", {
    method: "POST",
    idempotenceKey: input.idempotenceKey,
    body: {
      amount,
      capture: true,
      confirmation: {
        type: "redirect",
        return_url: input.returnUrl,
      },
      description: receiptDescription,
      receipt: {
        customer: {
          email: input.customerEmail,
        },
        items: [
          {
            description: receiptDescription,
            quantity: "1.00",
            amount,
            vat_code: getReceiptVatCode(),
            payment_mode: "full_payment",
            payment_subject: "service",
          },
        ],
        internet: true,
      },
      metadata: input.metadata,
    },
  });
}

export async function getYooKassaPayment(
  paymentId: string
): Promise<YooKassaPayment> {
  if (!/^[a-zA-Z0-9-]{8,64}$/.test(paymentId)) {
    throw new YooKassaError("Некорректный идентификатор платежа.");
  }
  return requestYooKassa<YooKassaPayment>(`/payments/${paymentId}`, {
    method: "GET",
  });
}

async function requestYooKassa<T>(
  path: string,
  options: {
    method: "GET" | "POST";
    idempotenceKey?: string;
    body?: unknown;
  }
): Promise<T> {
  const shopId = process.env.YOOKASSA_SHOP_ID?.trim();
  const secretKey = process.env.YOOKASSA_SECRET_KEY?.trim();
  if (!shopId || !secretKey) {
    throw new YooKassaError(
      "Оплата временно недоступна: YooKassa ещё не настроена."
    );
  }

  const headers: Record<string, string> = {
    Authorization: `Basic ${Buffer.from(`${shopId}:${secretKey}`).toString("base64")}`,
    Accept: "application/json",
  };
  if (options.body !== undefined) headers["Content-Type"] = "application/json";
  if (options.idempotenceKey) {
    headers["Idempotence-Key"] = options.idempotenceKey;
  }

  let response: Response;
  try {
    response = await fetch(`${YOOKASSA_API}${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      cache: "no-store",
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new YooKassaError("Не удалось связаться с YooKassa. Попробуй позже.");
  }

  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const description =
      typeof payload === "object" &&
      payload !== null &&
      "description" in payload &&
      typeof payload.description === "string"
        ? payload.description
        : undefined;
    throw new YooKassaError(
      description || "YooKassa отклонила запрос на оплату.",
      response.status
    );
  }
  if (!payload) throw new YooKassaError("YooKassa вернула пустой ответ.");
  return payload as T;
}

export function formatAmount(amountKopecks: number): string {
  return (amountKopecks / 100).toFixed(2);
}

function getReceiptVatCode(): number {
  const configured = process.env.YOOKASSA_VAT_CODE?.trim() || "1";
  const vatCode = Number(configured);
  if (!Number.isInteger(vatCode) || vatCode < 1 || vatCode > 12) {
    throw new YooKassaError("Некорректный YOOKASSA_VAT_CODE.");
  }
  return vatCode;
}
