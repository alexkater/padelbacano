import type { ChatMessage } from "../entities/chat";

export interface IChatRepository {
  getMessages(clubId: string, matchId?: string, userId?: string): Promise<ChatMessage[]>;
  send(input: Omit<ChatMessage, "id" | "createdAt">): Promise<ChatMessage>;
}
