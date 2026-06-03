import type { PricingRule } from "../entities/pricing";

export interface IPricingRepository {
  listRules(clubId: string): Promise<PricingRule[]>;
  getActiveRule(clubId: string, dayOfWeek: number, hour: number): Promise<PricingRule | null>;
  create(input: Omit<PricingRule, "id" | "createdAt">): Promise<PricingRule>;
  update(id: string, input: Partial<PricingRule>): Promise<PricingRule>;
  delete(id: string): Promise<void>;
}
