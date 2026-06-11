import type { UserRole } from "@/core/entities/user";

export type AuthRole = "player" | "club_admin";

export function profileRoleToAuthRole(role: UserRole | null | undefined): AuthRole {
  return role === "admin" ? "club_admin" : "player";
}
