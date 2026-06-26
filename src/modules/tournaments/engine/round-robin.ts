// ─── Round-robin tournament engine ───────────────────────────────────────────
// Pure functions, no DB. All-play-all schedule generation + standings.
// Supports 3–16 players. Tiebreaker: head-to-head → points difference.

export type Player = { id: string; name: string };

export type RoundRobinMatch = {
  id: string;
  round: number;
  player1Id: string;
  player2Id: string | null; // null = bye (only when odd number of players)
  score1: number | null;
  score2: number | null;
  winnerId: string | null;
  status: "scheduled" | "completed";
};

export type RoundRobinStanding = {
  userId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  losses: number;
  points: number; // total points scored
  pointsConceded: number;
  pointsDiff: number;
};

export type RoundRobinSchedule = {
  type: "round_robin";
  players: Player[];
  matches: RoundRobinMatch[];
  totalRounds: number;
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BYE: unique symbol = Symbol("BYE");
type Participant = Player | typeof BYE;

function isBye(p: Participant): p is typeof BYE {
  return p === BYE;
}

// ─── generateSchedule ────────────────────────────────────────────────────────
// Uses circle method (Berger tables). Fixes first player, rotates rest.

export function generateSchedule(players: Player[]): RoundRobinSchedule {
  const n = players.length;

  if (n < 3 || n > 16) {
    throw new Error(`Round robin requires 3–16 players, got ${n}`);
  }

  const participants: Participant[] = [...players];
  const isOdd = n % 2 !== 0;

  // Add a BYE placeholder for odd counts
  if (isOdd) {
    participants.push(BYE);
  }

  const total = participants.length; // now even (n or n+1)
  const totalRounds = total - 1;
  const matchesPerRound = total / 2;
  const matches: RoundRobinMatch[] = [];
  let matchId = 1;

  // Circle method: fix first element, rotate the rest clockwise each round
  const fixed = participants[0];
  const rotating = participants.slice(1);

  for (let round = 0; round < totalRounds; round++) {
    // Build pairings for this round:
    // fixed vs last, rotating[1] vs rotating[last-1], rotating[2] vs rotating[last-2], ...
    const roundParticipants: Participant[] = [fixed, ...rotating];

    for (let m = 0; m < matchesPerRound; m++) {
      const a: Participant = roundParticipants[m];
      const b: Participant = roundParticipants[total - 1 - m];

      // Skip BYE pairings — no actual match
      if (isBye(a) || isBye(b)) continue;

      // Both are players — schedule the match
      matches.push({
        id: `rr-${matchId++}`,
        round: round + 1,
        player1Id: a.id,
        player2Id: b.id,
        score1: null,
        score2: null,
        winnerId: null,
        status: "scheduled",
      });
    }

    // Rotate: keep first element fixed, rotate the rest clockwise
    // Take last element and move it to front of rotating array
    const last = rotating.pop()!;
    rotating.unshift(last);
  }

  return {
    type: "round_robin",
    players: [...players],
    matches,
    totalRounds,
  };
}

// ─── recordScore ─────────────────────────────────────────────────────────────
// Updates a match with scores and calculates winner.

export function recordScore(
  match: RoundRobinMatch,
  score1: number,
  score2: number
): RoundRobinMatch {
  if (score1 < 0 || score2 < 0) {
    throw new Error("Scores cannot be negative");
  }

  if (match.status === "completed") {
    throw new Error("Match is already completed");
  }

  if (!match.player2Id) {
    throw new Error("Cannot score a bye match");
  }

  let winnerId: string | null;
  if (score1 > score2) {
    winnerId = match.player1Id;
  } else if (score2 > score1) {
    winnerId = match.player2Id;
  } else {
    winnerId = null; // draw — no winner
  }

  return {
    ...match,
    score1,
    score2,
    winnerId,
    status: "completed",
  };
}

// ─── getStandings ────────────────────────────────────────────────────────────
// Calculates standings from a list of matches and players.
// Sort order: wins desc → head-to-head record → points difference desc.

export function getStandings(
  matches: RoundRobinMatch[],
  players: Player[]
): RoundRobinStanding[] {
  // Only consider completed matches with scores
  const completed = matches.filter(
    (m) => m.status === "completed" && m.score1 !== null && m.score2 !== null
  );

  // Initialize stats for all players
  const stats = new Map<string, {
    playerName: string;
    matchesPlayed: number;
    wins: number;
    losses: number;
    points: number;
    pointsConceded: number;
    // Track head-to-head results: map of opponentId -> { won: boolean }
    headToHead: Map<string, { won: boolean }>;
  }>();

  for (const p of players) {
    stats.set(p.id, {
      playerName: p.name,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      points: 0,
      pointsConceded: 0,
      headToHead: new Map(),
    });
  }

  // Process completed matches
  for (const m of completed) {
    const s1 = stats.get(m.player1Id);
    const s2 = stats.get(m.player2Id!);

    if (!s1 || !s2) continue; // skip if player not in list (shouldn't happen)

    s1.matchesPlayed++;
    s2.matchesPlayed++;

    s1.points += m.score1!;
    s1.pointsConceded += m.score2!;
    s2.points += m.score2!;
    s2.pointsConceded += m.score1!;

    if (m.winnerId === m.player1Id) {
      s1.wins++;
      s2.losses++;
      s1.headToHead.set(m.player2Id!, { won: true });
      s2.headToHead.set(m.player1Id, { won: false });
    } else if (m.winnerId === m.player2Id) {
      s2.wins++;
      s1.losses++;
      s2.headToHead.set(m.player1Id, { won: true });
      s1.headToHead.set(m.player2Id!, { won: false });

    }
    // Draw — no win/loss recorded, points already counted
  }

  // Build standings array
  const standings: RoundRobinStanding[] = Array.from(stats.entries()).map(
    ([userId, s]) => ({
      userId,
      playerName: s.playerName,
      matchesPlayed: s.matchesPlayed,
      wins: s.wins,
      losses: s.losses,
      points: s.points,
      pointsConceded: s.pointsConceded,
      pointsDiff: s.points - s.pointsConceded,
    })
  );

  // Sort: wins desc → head-to-head → pointsDiff desc
  standings.sort((a, b) => {
    // Primary: wins descending
    if (a.wins !== b.wins) return b.wins - a.wins;

    // Secondary: head-to-head record
    const aStats = stats.get(a.userId);
    const bStats = stats.get(b.userId);
    if (aStats && bStats) {
      const h2h = aStats.headToHead.get(b.userId);
      if (h2h !== undefined) {
        // If A beat B, A ranks higher (unless B also beat A in another match, then it's tied)
        if (h2h.won) return -1;
        // Check if B beat A
        const bH2h = bStats.headToHead.get(a.userId);
        if (bH2h && bH2h.won) return 1;
        // If they split (each won one), fall through to pointsDiff
      }
    }

    // Tertiary: points difference descending
    return b.pointsDiff - a.pointsDiff;
  });

  return standings;
}
