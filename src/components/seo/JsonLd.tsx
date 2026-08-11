import { absoluteUrl } from "@/lib/site";

type JsonLdObject = Record<string, unknown>;

const ORGANIZATION_ID = absoluteUrl("/#organization");
const WEBSITE_ID = absoluteUrl("/#website");

function JsonLd({ data }: { data: JsonLdObject }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
    />
  );
}

export function OrganizationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Organization",
        "@id": ORGANIZATION_ID,
        name: "Скрипткин",
        url: absoluteUrl("/"),
        logo: absoluteUrl("/logo.png"),
        description:
          "Платформа для изучения SQL через интерактивные истории и практические задания.",
      }}
    />
  );
}

export function WebSiteJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "WebSite",
        "@id": WEBSITE_ID,
        name: "Скрипткин",
        url: absoluteUrl("/"),
        description:
          "Интерактивная платформа для обучения SQL на сюжетных историях и связанных учебных базах данных.",
        inLanguage: "ru-RU",
        publisher: { "@id": ORGANIZATION_ID },
      }}
    />
  );
}

export function SoftwareApplicationJsonLd() {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "@id": absoluteUrl("/#application"),
        name: "Скрипткин",
        url: absoluteUrl("/"),
        description:
          "Веб-приложение для изучения SQL через сюжетные истории, выполнение запросов PostgreSQL и автоматическую проверку заданий.",
        applicationCategory: "EducationalApplication",
        inLanguage: "ru-RU",
        featureList: [
          "Интерактивные SQL-истории",
          "Встроенный редактор PostgreSQL",
          "Подсказки и автоматическая проверка",
          "Банк заданий для свободной практики",
          "Сохранение учебного прогресса",
        ],
        provider: { "@id": ORGANIZATION_ID },
      }}
    />
  );
}

export type BreadcrumbItem = {
  name: string;
  path: string;
};

export function BreadcrumbJsonLd({ items }: { items: BreadcrumbItem[] }) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: items.map((item, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: item.name,
          item: absoluteUrl(item.path),
        })),
      }}
    />
  );
}

export function ArticleJsonLd({
  title,
  description,
  path,
  published,
  section,
}: {
  title: string;
  description: string;
  path: string;
  published: string;
  section: string;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: title,
        description,
        url: absoluteUrl(path),
        mainEntityOfPage: absoluteUrl(path),
        datePublished: published,
        articleSection: section,
        inLanguage: "ru-RU",
        publisher: { "@id": ORGANIZATION_ID },
      }}
    />
  );
}

export function ProductJsonLd({
  name,
  description,
  path,
  imagePath,
  priceKopecks,
}: {
  name: string;
  description: string;
  path: string;
  imagePath: string;
  priceKopecks: number;
}) {
  return (
    <JsonLd
      data={{
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": absoluteUrl(path),
        name,
        description,
        image: absoluteUrl(imagePath),
        category: "Интерактивная история для изучения SQL",
        url: absoluteUrl(path),
        offers: {
          "@type": "Offer",
          url: absoluteUrl(path),
          priceCurrency: "RUB",
          price: (priceKopecks / 100).toFixed(2),
          availability: "https://schema.org/InStock",
          seller: { "@id": ORGANIZATION_ID },
        },
      }}
    />
  );
}
