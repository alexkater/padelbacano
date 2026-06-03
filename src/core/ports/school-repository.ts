import type { Coach, Class, ClassEnrollment } from "../entities/school";

export interface ISchoolRepository {
  listCoaches(clubId: string): Promise<Coach[]>;
  createCoach(input: Omit<Coach, "id" | "createdAt">): Promise<Coach>;
  listClasses(clubId: string): Promise<Class[]>;
  findClassById(id: string): Promise<Class | null>;
  createClass(input: Omit<Class, "id" | "createdAt">): Promise<Class>;
  enrollStudent(classId: string, userId: string): Promise<ClassEnrollment>;
  unenrollStudent(enrollmentId: string): Promise<void>;
  getEnrollments(classId: string): Promise<ClassEnrollment[]>;
}
