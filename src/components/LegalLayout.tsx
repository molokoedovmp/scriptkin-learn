import type { ReactNode } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";

/**
 * Общий макет юридических документов: заголовок, дата редакции,
 * типографика разделов. Секции передаются готовой разметкой.
 */
export function LegalLayout({
  title,
  updated,
  children,
}: {
  title: string;
  updated: string;
  children: ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[800px] px-6 py-14">
        <h1 className="mb-2 font-feather text-heading font-extrabold lowercase text-eager-green">
          {title}
        </h1>
        <p className="mb-10 text-caption font-bold uppercase tracking-wide text-faded-gray">
          Редакция от {updated}
        </p>
        <div className="legal-doc">{children}</div>
      </main>
      <Footer />
    </>
  );
}

/** Раздел документа с нумерованным заголовком */
export function LegalSection({
  number,
  title,
  children,
}: {
  number: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="mb-8">
      <h2 className="mb-3 text-subheading font-bold text-charcoal">
        <span className="text-eager-green">{number}.</span> {title}
      </h2>
      <div className="grid gap-3 text-body font-medium leading-relaxed text-pencil-gray [&_li]:ml-5 [&_li]:list-disc [&_strong]:font-bold [&_strong]:text-charcoal [&_ul]:grid [&_ul]:gap-1.5">
        {children}
      </div>
    </section>
  );
}

/** Плашка с реквизитами, которые нужно заполнить владельцу сервиса */
export function OperatorRequisites() {
  return (
    <div className="rounded-xl border-2 border-[#e5e5e5] p-5">
      <p className="mb-2 text-caption font-bold uppercase tracking-wide text-pencil-gray">
        Оператор / Исполнитель
      </p>
      <ul className="grid gap-1 text-body font-medium text-pencil-gray">
        <li>Наименование: [ИП / ООО — указать полное наименование]</li>
        <li>ИНН: [указать]</li>
        <li>ОГРН/ОГРНИП: [указать]</li>
        <li>Адрес: [указать]</li>
        <li>
          E-mail для обращений: <strong>support@scriptkin.ru</strong> [создать
          ящик на домене]
        </li>
      </ul>
    </div>
  );
}
