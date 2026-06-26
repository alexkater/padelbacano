import { NextResponse, type NextRequest } from "next/server";
import { createPendingClub, isUniqueViolation, slugExists } from "./_persistence";
import { rateLimitResponse } from "./_rate-limit";
import { onboardingSubmissionSchema, validationDetails } from "./_validation";

export async function POST(request: NextRequest) {
  const limited = rateLimitResponse(request);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "JSON inválido", details: [{ field: "body", message: "JSON inválido" }] },
        { status: 400 }
      );
    }
    throw error;
  }

  const parsed = onboardingSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Validación fallida", details: validationDetails(parsed.error) }, { status: 400 });
  }

  if (await slugExists(parsed.data.step1.slug)) {
    return NextResponse.json({ error: "El slug ya está en uso" }, { status: 409 });
  }

  try {
    const clubId = await createPendingClub(parsed.data);
    return NextResponse.json(
      { success: true, data: { clubId, slug: parsed.data.step1.slug, status: "pending_approval" } },
      { status: 201 }
    );
  } catch (error) {
    if (isUniqueViolation(error)) {
      return NextResponse.json({ error: "El slug ya está en uso" }, { status: 409 });
    }
    throw error;
  }
}
