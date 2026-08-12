import type { SessionUser } from "@/lib/types";

export function UserAvatar({
  user,
  className = "h-10 w-10",
}: {
  user: Pick<SessionUser, "name" | "avatarUrl">;
  className?: string;
}) {
  if (user.avatarUrl) {
    return (
      // URL формируется сервером только для официального хоста аватаров Яндекса.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={user.avatarUrl}
        alt={`Аватар пользователя ${user.name}`}
        referrerPolicy="no-referrer"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }

  return (
    <span className={`${className} grid shrink-0 place-content-center rounded-full bg-eager-green font-black uppercase text-white`}>
      {initials(user.name)}
    </span>
  );
}

function initials(name: string) {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || "?";
}
