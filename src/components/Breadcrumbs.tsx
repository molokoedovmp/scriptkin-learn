import Link from "next/link";
import {
  BreadcrumbJsonLd,
  type BreadcrumbItem,
} from "./seo/JsonLd";

export function Breadcrumbs({
  items,
  className = "",
}: {
  items: BreadcrumbItem[];
  className?: string;
}) {
  return (
    <>
      <BreadcrumbJsonLd items={items} />
      <nav
        aria-label="Хлебные крошки"
        className={`overflow-x-auto text-caption font-bold ${className}`}
      >
        <ol className="flex min-w-max items-center gap-2">
          {items.map((item, index) => {
            const isCurrent = index === items.length - 1;
            return (
              <li key={`${item.path}-${item.name}`} className="flex items-center gap-2">
                {index > 0 && (
                  <span className="text-faded-gray" aria-hidden="true">
                    / 
                  </span>
                )}
                {isCurrent ? (
                  <span className="text-charcoal" aria-current="page">
                    {item.name}
                  </span>
                ) : (
                  <Link
                    href={item.path}
                    className="text-pencil-gray transition-colors hover:text-spark-blue"
                  >
                    {item.name}
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </>
  );
}
