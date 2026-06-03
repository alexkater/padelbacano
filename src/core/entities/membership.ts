export type MembershipPlan = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  price: number;
  currency: string;
  interval: "monthly" | "quarterly" | "yearly";
  benefits: {
    discountPercent: number;
    priorityBookingHours: number;
    maxBookingsPerDay: number;
    maxActiveBookings: number;
    guestPasses: number;
  };
  isActive: boolean;
  createdAt: Date;
};

export type UserMembership = {
  id: string;
  userId: string;
  planId: string;
  clubId: string;
  status: "active" | "cancelled" | "expired";
  startDate: Date;
  endDate: Date;
  createdAt: Date;
};
