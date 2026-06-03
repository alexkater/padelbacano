export type OpenMatch = {
  id: string;
  clubId: string;
  courtId: string;
  creatorId: string;
  title: string | null;
  startTime: Date;
  endTime: Date;
  duration: number;
  minLevel: number | null;
  maxLevel: number | null;
  maxPlayers: number;
  status: "open" | "full" | "cancelled" | "completed";
  notes: string | null;
  playerCount?: number;
  createdAt: Date;
};

export type OpenMatchPlayer = {
  id: string;
  matchId: string;
  userId: string;
  joinedAt: Date;
};
