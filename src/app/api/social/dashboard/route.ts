import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSocialDashboard } from "@/lib/social";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Нужно войти." }, { status: 401 });
  }

  try {
    const dashboard = await getSocialDashboard(user.id);
    return NextResponse.json({ ok: true, dashboard });
  } catch (error) {
    console.error("Failed to load social dashboard:", error);
    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить данные кабинета." },
      { status: 500 }
    );
  }
}
