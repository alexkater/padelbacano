export type Coach = {
  id: string;
  clubId: string;
  userId: string | null;
  name: string;
  bio: string | null;
  photoUrl: string | null;
  specialties: string[];
  isActive: boolean;
  createdAt: Date;
};

export type Class = {
  id: string;
  clubId: string;
  coachId: string;
  courtId: string | null;
  name: string;
  description: string | null;
  type: "group" | "private" | "clinic" | "kids";
  level: number | null;
  maxStudents: number;
  price: number;
  schedule: { daysOfWeek: number[]; startHour: number; endHour: number };
  startDate: Date;
  endDate: Date | null;
  isActive: boolean;
  createdAt: Date;
};

export type ClassEnrollment = {
  id: string;
  classId: string;
  userId: string;
  status: "active" | "cancelled" | "completed";
  enrolledAt: Date;
};
