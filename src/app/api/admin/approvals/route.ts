import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { db, schema } from "@/infra/db/index";
import { eq } from "drizzle-orm";

/**
 * GET /api/admin/approvals
 * List all onboarding applications. Platform admin only.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "platform_admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const applications = await db
    .select()
    .from(schema.onboardingApplications)
    .orderBy(schema.onboardingApplications.createdAt);

  return NextResponse.json({ applications });
}
