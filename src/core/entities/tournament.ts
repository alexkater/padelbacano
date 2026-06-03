export const TOURNAMENT_FORMATS = ["single_elimination", "round_robin", "americano", "mexicano"] as const;
export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

export const TOURNAMENT_STATUSES = ["draft", "registration", "in_progress", "completed", "cancelled"] as const;
export type TournamentStatus = (typeof TOURNAMENT_STATUSES)[number];

export type Tournament = {
  id: string;
  clubId: string;
  name: string;
  description: string | null;
  format: TournamentFormat;
  startDate: Date;
  endDate: Date | null;
  registrationDeadline: Date | null;
  minLevel: number | null;
  maxLevel: number | null;
  maxParticipants: number | null;
  entryFee: number | null;
  prize: string | null;
  status: TournamentStatus;
  rules: string | null;
  registrationCount?: number;
  createdAt: Date;
  updatedAt: Date;
};

export type TournamentRegistration = {
  id: string;
  tournamentId: string;
  userId: string;
  status: "pending" | "confirmed" | "cancelled";
  paymentStatus: "unpaid" | "paid";
  registeredAt: Date;
};

export type TournamentMatch = {
  id: string;
  tournamentId: string;
  courtId: string | null;
  round: number;
  player1Id: string | null;
  player2Id: string | null;
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  startTime: Date | null;
  status: "scheduled" | "in_progress" | "completed" | "cancelled";
  createdAt: Date;
};
