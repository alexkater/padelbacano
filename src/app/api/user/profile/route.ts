import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { userRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET() {
  const session = await auth();

  if (!session?.user?.id) {
    // Return guest profile if not authenticated
    return NextResponse.json({
      profile: {
        displayName: "Jugador",
        level: null,
        memberType: "non_member",
        role: "guest",
        phone: null,
        joinedAt: new Date().toISOString(),
      },
    });
  }

  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) {
    return NextResponse.json({ error: "Club not found" }, { status: 404 });
  }

  const profile = await userRepo.getProfile(session.user.id, club.id);

  if (!profile) {
    // User exists but has no profile in this club
    const user = await userRepo.findById(session.user.id);
    return NextResponse.json({
      profile: {
        displayName: user?.name || "Jugador",
        level: null,
        memberType: "non_member",
        role: "guest",
        phone: null,
        joinedAt: new Date().toISOString(),
      },
    });
  }

  return NextResponse.json({
    profile: {
      displayName: profile.displayName,
      level: profile.level,
      memberType: profile.memberType,
      role: profile.role,
      phone: profile.phone,
      joinedAt: profile.joinedAt.toISOString(),
    },
  });
}
