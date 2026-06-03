import type { MembershipPlan, UserMembership } from "../entities/membership";

export interface IMembershipRepository {
  listPlans(clubId: string): Promise<MembershipPlan[]>;
  findPlanById(id: string): Promise<MembershipPlan | null>;
  createPlan(input: Omit<MembershipPlan, "id" | "createdAt">): Promise<MembershipPlan>;
  updatePlan(id: string, input: Partial<MembershipPlan>): Promise<MembershipPlan>;
  getUserMembership(userId: string, clubId: string): Promise<UserMembership | null>;
  createUserMembership(input: Omit<UserMembership, "id" | "createdAt">): Promise<UserMembership>;
  cancelUserMembership(id: string): Promise<UserMembership>;
}
