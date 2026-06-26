import { NextResponse } from "next/server";
import { auth } from "@/infra/auth/config";
import { userRepo, clubRepo } from "@/infra/db/repositories";
import { CLUB_CONFIG } from "@/padelbacano.config";

export async function GET() {
  const session = await auth();
  const sessionData = {
    role: session?.user?.role ?? "guest",
  };

  if (!session?.user?.id) {
    return NextResponse.json({
      session: sessionData,
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
    const user = await userRepo.findById(session.user.id);
    return NextResponse.json({
      session: sessionData,
      profile: {
        displayName: user?.name || "Jugador",
        level: null,
        memberType: "non_member",
        role: session.user.role === "club_admin" ? "admin" : "guest",
        phone: null,
        joinedAt: new Date().toISOString(),
      },
    });
  }

  const profile = await userRepo.getProfile(session.user.id, club.id);

  if (!profile) {
    const user = await userRepo.findById(session.user.id);
    return NextResponse.json({
      session: sessionData,
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
    session: sessionData,
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
