import { eq, and, or, desc, sql } from "drizzle-orm";
import { v4 as uuid } from "../uuid";
import { db, schema } from "../index";
import type { IChatRepository } from "@/core/ports/chat-repository";
import type { ChatMessage } from "@/core/entities/chat";

function row(r: typeof schema.chatMessages.$inferSelect): ChatMessage {
  return { ...r, createdAt: r.createdAt };
}

export const chatRepo: IChatRepository = {
  async getMessages(clubId, matchId, userId) {
    const allConditions: ReturnType<typeof eq>[] = [
      eq(schema.chatMessages.clubId, clubId),
    ];
    if (matchId) {
      allConditions.push(eq(schema.chatMessages.matchId, matchId));
    }
    if (userId) {
      allConditions.push(
        sql`(${schema.chatMessages.senderId} = ${userId} OR ${schema.chatMessages.receiverId} = ${userId})`
      );
    }
    return db
      .select()
      .from(schema.chatMessages)
      .where(and(...allConditions))
      .orderBy(desc(schema.chatMessages.createdAt))
      .limit(50)
      .all()
      .map(row)
      .reverse();
  },

  async send(input) {
    const id = uuid();
    const now = new Date();
    db.insert(schema.chatMessages)
      .values({
        id,
        clubId: input.clubId,
        senderId: input.senderId,
        receiverId: input.receiverId ?? null,
        matchId: input.matchId ?? null,
        content: input.content,
        createdAt: now,
      })
      .run();
    return row(
      db.select().from(schema.chatMessages).where(eq(schema.chatMessages.id, id)).get()!
    );
  },
};
