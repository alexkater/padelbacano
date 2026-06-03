export type PricingRule = {
  id: string;
  clubId: string;
  name: string;
  dayOfWeek: number | null;
  startHour: number | null;
  endHour: number | null;
  memberPrice: number;
  nonMemberPrice: number;
  isActive: boolean;
  createdAt: Date;
};
