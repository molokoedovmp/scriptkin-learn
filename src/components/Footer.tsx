import Link from "next/link";

const columns: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Платформа",
    links: [
      { label: "Истории", href: "/quests" },
      { label: "Банк заданий", href: "/practice" },
      { label: "Сообщество", href: "/community" },
      { label: "Как это работает", href: "/how-it-works" },
      { label: "О проекте", href: "/about" },
      { label: "FAQ", href: "/faq" },
      { label: "Обратная связь", href: "/feedback" },
    ],
  },
  {
    title: "Истории",
    links: [
      { label: "Полночный экспресс", href: "/quests/midnight-express" },
      { label: "Крушение подлодки", href: "/quests/submarine-crash" },
      { label: "Ограбление галереи", href: "/quests/midnight-heist" },
      { label: "Станция «Арес-9»", href: "/quests/mars-station" },
    ],
  },
  {
    title: "Аккаунт",
    links: [
      { label: "Личный кабинет", href: "/account" },
      { label: "Войти", href: "/login" },
      { label: "Регистрация", href: "/register" },
    ],
  },
  {
    title: "Документы",
    links: [
      { label: "Пользовательское соглашение", href: "/legal/terms" },
      { label: "Политика персональных данных", href: "/legal/privacy" },
      { label: "Публичная оферта", href: "/legal/offer" },
      { label: "Политика cookie", href: "/legal/cookies" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer border-t-2 border-[#dfe1e6]">
      <div className="mx-auto grid max-w-[1200px] gap-10 px-6 py-12 sm:grid-cols-2 lg:grid-cols-4">
        {columns.map((col) => (
          <div key={col.title}>
            <h3 className="site-footer-title mb-3 text-nav-label font-extrabold uppercase tracking-wide">
              {col.title}
            </h3>
            <ul>
              {col.links.map((link) => (
                <li key={link.label} className="mb-2">
                  <Link
                    href={link.href}
                    className="site-footer-link text-body font-medium"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="site-footer-bottom mx-auto max-w-[1200px] border-t px-6 py-6">
        <p className="site-footer-copy text-caption font-medium">
          © {new Date().getFullYear()} Скрипткин. Учи SQL, раскрывая дела.
        </p>
      </div>
    </footer>
  );
}
