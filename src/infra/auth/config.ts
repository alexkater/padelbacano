// ─── NextAuth v5 configuration ─────────────────────────────────────────────

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { compare } from "bcryptjs";
import { clubRepo, userRepo } from "@/infra/db/repositories";
import { env } from "@/infra/env";
import { CLUB_CONFIG } from "@/padelbacano.config";
import { profileRoleToAuthRole, type AuthRole } from "./roles";

async function getUserRole(userId: string): Promise<AuthRole> {
  const club = await clubRepo.findBySlug(CLUB_CONFIG.slug);
  if (!club) return "player";

  const profile = await userRepo.getProfile(userId, club.id);
  return profileRoleToAuthRole(profile?.role);
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
      if (userId) {
        token.role = await getUserRole(userId);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role === "club_admin" ? "club_admin" : "player";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
