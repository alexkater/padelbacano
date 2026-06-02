// ─── User entity ───────────────────────────────────────────────────────────

export const USER_ROLES = ["admin", "member", "guest"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export const MEMBER_TYPES = ["member", "non_member"] as const;
export type MemberType = (typeof MEMBER_TYPES)[number];

export type UserProfile = {
  id: string;
  userId: string;
  clubId: string;
  role: UserRole;
  memberType: MemberType;
  displayName: string;
  phone: string | null;
  level: number | null; // 1-7, club's internal ranking
  joinedAt: Date;
};

export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string | null; // null for OAuth-only users
  image: string | null;
  createdAt: Date;
};
