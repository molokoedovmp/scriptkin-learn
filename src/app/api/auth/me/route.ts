import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";

/**
 * GET /api/auth/me — текущий пользователь по cookie сессии
 * (или null, если не залогинен).
 */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}
