import { NextResponse } from "next/server";
import { auth } from "./config";
import type { AuthRole } from "./roles";

export async function requireRole(role: AuthRole) {
  const session = await auth();

  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (session.user.role !== role) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return null;
}
