import Link from "next/link";
import { ContinuePaymentButton } from "./ContinuePaymentButton";
import type { StoryPaymentEntry, StoryPaymentStatus } from "@/lib/types";

const STATUS_LABELS: Record<StoryPaymentStatus, string> = {
  pending: "Ожидает оплаты",
  paid: "Оплачено",
  failed: "Ошибка оплаты",
  canceled: "Отменено",
  refunded: "Возврат",
};

const STATUS_STYLES: Record<StoryPaymentStatus, string> = {
  pending: "bg-[#fff4cf] text-[#8a6400]",
  paid: "bg-storybook-green text-[#3d7f12]",
  failed: "bg-[#fff0f0] text-[#bd3030]",
  canceled: "bg-[#eeeeef] text-pencil-gray",
  refunded: "bg-[#e9f7ff] text-[#17678f]",
};

export function AccountPaymentsView({
  payments,
}: {
  payments: StoryPaymentEntry[];
}) {
  const paidPayments = payments.filter((payment) => payment.status === "paid");
  const purchasedStories = new Set(
    paidPayments.map((payment) => payment.questSlug ?? payment.questTitle)
  ).size;
  const paidTotal = paidPayments.reduce(
    (total, payment) => total + payment.amountKopecks,
    0
  );
  const refunds = payments.filter((payment) => payment.status === "refunded").length;

  return (
    <div className="space-y-5">
      <section className="grid gap-4 sm:grid-cols-3" aria-label="Сводка покупок">
        <SummaryCard label="Куплено историй" value={String(purchasedStories)} icon="▤" />
        <SummaryCard label="Оплачено" value={formatMoney(paidTotal, "RUB")} icon="₽" />
        <SummaryCard label="Возвраты" value={String(refunds)} icon="↩" />
      </section>

      <section className="overflow-hidden rounded-[20px] border-2 border-[#e6e7eb] bg-paper-white">
        <header className="border-b-2 border-[#ececef] px-5 py-5 sm:px-6">
          <p className="text-caption font-extrabold uppercase tracking-wide text-spark-blue">
            Платежи
          </p>
          <h2 className="mt-1 font-feather text-heading-sm font-black text-charcoal">
            История операций
          </h2>
          <p className="mt-2 text-[15px] font-medium text-pencil-gray">
            Здесь хранятся покупки историй, статусы платежей, суммы и доступные ссылки на чеки.
          </p>
        </header>

        {payments.length === 0 ? (
          <div className="px-5 py-12 text-center sm:px-6 sm:py-16">
            <span
              aria-hidden="true"
              className="mx-auto flex h-16 w-16 items-center justify-center rounded-[18px] bg-[#e9f7ff] text-3xl font-black text-spark-blue"
            >
              ₽
            </span>
            <h3 className="mt-5 text-subheading font-black text-charcoal">
              Покупок пока нет
            </h3>
            <p className="mx-auto mt-2 max-w-[520px] text-body font-medium text-pencil-gray">
              Когда ты купишь историю, здесь появятся её название, дата оплаты,
              сумма, статус операции и ссылка на чек, когда она будет добавлена.
            </p>
            <Link
              href="/quests"
              className="mt-6 inline-flex min-h-11 items-center justify-center rounded-xl bg-eager-green px-6 py-3 text-caption font-extrabold uppercase text-paper-white hover:bg-[#4cb002]"
            >
              Посмотреть истории
            </Link>
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto md:block">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="bg-[#f7f8fa] text-[11px] font-extrabold uppercase tracking-[0.08em] text-faded-gray">
                    <th className="px-6 py-3">История</th>
                    <th className="px-4 py-3">Дата</th>
                    <th className="px-4 py-3">Сумма</th>
                    <th className="px-4 py-3">Статус</th>
                    <th className="px-6 py-3 text-right">Действие</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ececef]">
                  {payments.map((payment) => (
                    <PaymentRow key={payment.id} payment={payment} />
                  ))}
                </tbody>
              </table>
            </div>
            <div className="divide-y divide-[#ececef] md:hidden">
              {payments.map((payment) => (
                <PaymentCard key={payment.id} payment={payment} />
              ))}
            </div>
          </>
        )}
      </section>

      <p className="px-1 text-[13px] font-medium leading-relaxed text-faded-gray">
        Нужна помощь с оплатой или возвратом? Укажи название истории и дату
        операции в сообщении через страницу обратной связи.
      </p>
    </div>
  );
}

function SummaryCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <article className="flex items-center gap-4 rounded-[18px] border-2 border-[#e6e7eb] bg-paper-white p-5">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#f1f3f6] text-xl font-black text-spark-blue">
        {icon}
      </span>
      <div>
        <p className="text-[11px] font-extrabold uppercase tracking-wide text-faded-gray">{label}</p>
        <p className="mt-1 text-subheading font-black text-charcoal">{value}</p>
      </div>
    </article>
  );
}

function PaymentRow({ payment }: { payment: StoryPaymentEntry }) {
  return (
    <tr className="text-[14px] font-bold text-charcoal">
      <td className="px-6 py-4">
        <PaymentTitle payment={payment} />
      </td>
      <td className="whitespace-nowrap px-4 py-4 text-pencil-gray">{formatDate(payment.paidAt ?? payment.createdAt)}</td>
      <td className="whitespace-nowrap px-4 py-4">{formatMoney(payment.amountKopecks, payment.currency)}</td>
      <td className="px-4 py-4"><StatusBadge status={payment.status} /></td>
      <td className="px-6 py-4 text-right"><PaymentAction payment={payment} /></td>
    </tr>
  );
}

function PaymentCard({ payment }: { payment: StoryPaymentEntry }) {
  return (
    <article className="p-5">
      <div className="flex items-start justify-between gap-3">
        <PaymentTitle payment={payment} />
        <StatusBadge status={payment.status} />
      </div>
      <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-[#f7f8fa] p-4">
        <div><dt className="text-[10px] font-extrabold uppercase text-faded-gray">Дата</dt><dd className="mt-1 text-[14px] font-bold text-charcoal">{formatDate(payment.paidAt ?? payment.createdAt)}</dd></div>
        <div><dt className="text-[10px] font-extrabold uppercase text-faded-gray">Сумма</dt><dd className="mt-1 text-[14px] font-bold text-charcoal">{formatMoney(payment.amountKopecks, payment.currency)}</dd></div>
      </dl>
      <div className="mt-4"><PaymentAction payment={payment} /></div>
    </article>
  );
}

function PaymentTitle({ payment }: { payment: StoryPaymentEntry }) {
  if (!payment.questSlug) return <span className="font-extrabold">{payment.questTitle}</span>;
  return <Link href={`/quests/${payment.questSlug}`} className="font-extrabold hover:text-spark-blue">{payment.questTitle}</Link>;
}

function StatusBadge({ status }: { status: StoryPaymentStatus }) {
  return <span className={`inline-flex whitespace-nowrap rounded-full px-3 py-1.5 text-[11px] font-extrabold uppercase ${STATUS_STYLES[status]}`}>{STATUS_LABELS[status]}</span>;
}

function ReceiptLink({ payment }: { payment: StoryPaymentEntry }) {
  if (!payment.receiptUrl || payment.status !== "paid") {
    return <span className="text-[13px] font-bold text-faded-gray">—</span>;
  }
  return <a href={payment.receiptUrl} target="_blank" rel="noreferrer" className="text-[13px] font-extrabold text-spark-blue hover:underline">Открыть чек ↗</a>;
}

function PaymentAction({ payment }: { payment: StoryPaymentEntry }) {
  if (payment.status === "pending" && payment.provider === "yookassa") {
    return <ContinuePaymentButton paymentId={payment.id} />;
  }
  return <ReceiptLink payment={payment} />;
}

function formatMoney(amountKopecks: number, currency: string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: amountKopecks % 100 === 0 ? 0 : 2,
  }).format(amountKopecks / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("ru-RU", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
