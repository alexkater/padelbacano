// ─── NextAuth v5 configuration ─────────────────────────────────────────────

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { userRepo } from "@/infra/db/repositories/user-repo";
import { env } from "@/infra/env";
import { profileRoleToAuthRole, type AuthRole } from "./roles";

type SessionTenantAccess = {
  readonly role: AuthRole;
  readonly clubId?: string;
  readonly profileId?: string;
};

async function getUserAccess(userId: string): Promise<SessionTenantAccess> {
  const profiles = await userRepo.listProfiles(userId);
  const adminProfile = profiles.find((profile) => profile.role === "admin");
  const profile = adminProfile ?? profiles[0];

  if (!profile) {
    return { role: "player" };
  }

  return {
    role: profileRoleToAuthRole(profile.role),
    clubId: profile.clubId,
    profileId: profile.id,
  };
}

function tokenRole(value: unknown): AuthRole {
  if (value === "club_admin" || value === "platform_admin" || value === "player") {
    return value;
  }

  return "player";
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

const googleProviders =
  env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET
    ? [
        Google({
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
        }),
      ]
    : [];

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: env.AUTH_SECRET,
  trustHost: true,
  providers: [
    ...googleProviders,
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await userRepo.findByEmail(
          credentials.email as string
        );

        if (!user?.passwordHash) return null;

        const isValid = await compare(credentials.password as string, user.passwordHash);

        if (!isValid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
      }
      const userId = typeof token.id === "string" ? token.id : undefined;
      if (userId && (user || !token.role || !token.clubId || !token.profileId)) {
        const access = await getUserAccess(userId);
        token.role = access.role;
        token.clubId = access.clubId;
        token.profileId = access.profileId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = tokenRole(token.role);
        session.user.clubId = optionalString(token.clubId);
        session.user.profileId = optionalString(token.profileId);
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
