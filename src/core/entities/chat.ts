export type ChatMessage = {
  id: string;
  clubId: string;
  senderId: string;
  receiverId: string | null;
  matchId: string | null;
  content: string;
  createdAt: Date;
};
