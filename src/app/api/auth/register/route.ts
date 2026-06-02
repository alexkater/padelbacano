import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { userRepo } from "@/infra/db/repositories";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { email, password, name } = body;

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Email, password, and name are required" }, { status: 400 });
  }

  const existing = await userRepo.findByEmail(email);
  if (existing) {
    return NextResponse.json({ error: "Email already registered" }, { status: 409 });
  }

  const passwordHash = await hash(password, 10);

  const user = await userRepo.create({
    email,
    name,
    passwordHash,
    image: null,
  });

  return NextResponse.json({ user: { id: user.id, email: user.email, name: user.name } }, { status: 201 });
}
