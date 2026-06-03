import { eq, and } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { ISchoolRepository } from "@/core/ports/school-repository";
import type { Coach, Class, ClassEnrollment } from "@/core/entities/school";

function coachRow(r: typeof schema.coaches.$inferSelect): Coach { return { ...r, createdAt: r.createdAt }; }
function classRow(r: typeof schema.classes.$inferSelect): Class { return { ...r, createdAt: r.createdAt }; }
function enrollRow(r: typeof schema.classEnrollments.$inferSelect): ClassEnrollment { return { ...r, enrolledAt: r.enrolledAt }; }

export const schoolRepo: ISchoolRepository = {
  async listCoaches(clubId) {
    return db.select().from(schema.coaches).where(and(eq(schema.coaches.clubId, clubId), eq(schema.coaches.isActive, true))).all().map(coachRow);
  },
  async createCoach(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.coaches).values({ id, clubId: input.clubId, userId: input.userId, name: input.name, bio: input.bio, photoUrl: input.photoUrl, specialties: input.specialties, isActive: true, createdAt: now }).run();
    return coachRow(db.select().from(schema.coaches).where(eq(schema.coaches.id, id)).get()!);
  },
  async listClasses(clubId) {
    return db.select().from(schema.classes).where(and(eq(schema.classes.clubId, clubId), eq(schema.classes.isActive, true))).all().map(classRow);
  },
  async findClassById(id) {
    const r = db.select().from(schema.classes).where(eq(schema.classes.id, id)).get();
    return r ? classRow(r) : null;
  },
  async createClass(input) {
    const id = uuid(); const now = new Date();
    db.insert(schema.classes).values({ id, clubId: input.clubId, coachId: input.coachId, courtId: input.courtId, name: input.name, description: input.description, type: input.type, level: input.level, maxStudents: input.maxStudents, price: input.price, schedule: input.schedule, startDate: input.startDate, endDate: input.endDate, isActive: true, createdAt: now }).run();
    return classRow(db.select().from(schema.classes).where(eq(schema.classes.id, id)).get()!);
  },
  async enrollStudent(classId, userId) {
    const id = uuid(); const now = new Date();
    db.insert(schema.classEnrollments).values({ id, classId, userId, status: "active", enrolledAt: now }).run();
    return enrollRow(db.select().from(schema.classEnrollments).where(eq(schema.classEnrollments.id, id)).get()!);
  },
  async unenrollStudent(enrollmentId) {
    db.update(schema.classEnrollments).set({ status: "cancelled" }).where(eq(schema.classEnrollments.id, enrollmentId)).run();
  },
  async getEnrollments(classId) {
    return db.select().from(schema.classEnrollments).where(and(eq(schema.classEnrollments.classId, classId), eq(schema.classEnrollments.status, "active"))).all().map(enrollRow);
  },
};
