// ─── User repository port ──────────────────────────────────────────────────

import type { User, UserProfile, UserRole } from "../entities/user";

export interface IUserRepository {
  /** Find user by ID */
  findById(id: string): Promise<User | null>;

  /** Find user by email */
  findByEmail(email: string): Promise<User | null>;

  /** Create a new user */
  create(user: Omit<User, "id" | "createdAt">): Promise<User>;

  /** Get user's profile within a specific club */
  getProfile(userId: string, clubId: string): Promise<UserProfile | null>;

  /** Create or update a user's profile within a club */
  upsertProfile(profile: Omit<UserProfile, "id" | "joinedAt">): Promise<UserProfile>;

  /** List all members of a club */
  listClubMembers(clubId: string): Promise<UserProfile[]>;

  /** Update user role within a club */
  updateRole(profileId: string, role: UserRole): Promise<UserProfile>;
}
