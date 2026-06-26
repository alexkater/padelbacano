"use client";

import { useId, useMemo, type JSX } from "react";
import type { Match, Bracket } from "@/core/ports/tournament-port";
import { cn } from "@/lib/utils";

// ─── Layout constants ──────────────────────────────────────────────────────

const CARD_W = 180;
const CARD_H = 64;
const CARD_GAP = 20;
const COL_GAP = 80;
const PAD = 24;

// ─── Round labels ─────────────────────────────────────────────────────────

function roundLabel(round: number, total: number): string {
  if (total === 1) return "Final";
  const fromEnd = total - round; // 0 = last, 1 = penultimate…
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinales";
  if (fromEnd === 2) return "Cuartos";
  if (fromEnd === 3) return "Octavos";
  return `Ronda ${round}`;
}

// ─── Layout engine ─────────────────────────────────────────────────────────

type CardPos = {
  match: Match;
  roundIx: number; // 0‑based
  x: number;
  cy: number; // centre Y
  isThirdPlace: boolean;
};

type Layout = {
  cards: CardPos[];
  w: number;
  h: number;
  hasThird: boolean;
};

function computeLayout(bracket: Bracket): Layout {
  const rounds = bracket.rounds;
  const n = rounds.length;
  if (n === 0) return { cards: [], w: 0, h: 0, hasThird: false };

  const lastIx = n - 1;
  const lastRounds = rounds[lastIx].matches;
  const hasThird = lastRounds.length > 1;
  const thirdMatch = hasThird ? lastRounds[lastRounds.length - 1] : null;

  // Main rounds — exclude the third‑place match from the last round
  const mainRounds = rounds.map((r, i) => {
    if (i === lastIx && thirdMatch) {
      return { matches: r.matches.filter((m) => m !== thirdMatch) };
    }
    return { matches: [...r.matches] };
  });

  const perRound = mainRounds.map((r) => r.matches.length);
  const r1Count = perRound[0];

  // Body height from first round
  const bodyH = r1Count * CARD_H + (r1Count - 1) * CARD_GAP;

  // Y centres — binary‑tree centering
  const ycs: number[][] = [];
  ycs[0] = Array.from({ length: r1Count }, (_, i) => i * (CARD_H + CARD_GAP) + CARD_H / 2);

  for (let r = 1; r < mainRounds.length; r++) {
    const prev = ycs[r - 1];
    ycs[r] = [];
    for (let i = 0; i < perRound[r]; i++) {
      const a = prev[i * 2];
      const b = prev[i * 2 + 1];
      ycs[r].push(b !== undefined ? ((a ?? 0) + b) / 2 : (a ?? 0));
    }
  }

  // Main cards
  const cards: CardPos[] = [];
  for (let r = 0; r < mainRounds.length; r++) {
    const x = PAD + r * (CARD_W + COL_GAP);
    for (let i = 0; i < mainRounds[r].matches.length; i++) {
      cards.push({
        match: mainRounds[r].matches[i],
        roundIx: r,
        x,
        cy: ycs[r][i],
        isThirdPlace: false,
      });
    }
  }

  let svgH = PAD * 2 + bodyH;
  const svgW = PAD * 2 + n * CARD_W + (n - 1) * COL_GAP;

  // Third‑place card below the main bracket
  if (thirdMatch) {
    const tx = PAD + lastIx * (CARD_W + COL_GAP); // same column as final
    const ty = bodyH + CARD_H + CARD_GAP * 2;
    cards.push({
      match: thirdMatch,
      roundIx: lastIx,
      x: tx,
      cy: ty,
      isThirdPlace: true,
    });
    svgH = ty + CARD_H / 2 + PAD;
  }

  return { cards, w: svgW, h: svgH, hasThird };
}

// ─── SVG sub‑components ────────────────────────────────────────────────────

function MatchCard({
  card,
  playerNames,
}: {
  card: CardPos;
  playerNames: Record<string, string>;
}): JSX.Element {
  const m = card.match;
  const p1 = m.player1Id ? playerNames[m.player1Id] ?? "—" : "—";
  const p2 = m.player2Id ? playerNames[m.player2Id] ?? "—" : "—";
  const done = m.status === "completed";
  const playing = m.status === "in_progress";
  const cx = card.x;
  const cy = card.cy - CARD_H / 2;

  return (
    <g>
      {/* Card background */}
      <rect
        x={cx}
        y={cy}
        width={CARD_W}
        height={CARD_H}
        rx={10}
        fill="var(--pb-surface-primary)"
        stroke={
          done
            ? "var(--pb-brand-primary)"
            : playing
              ? "var(--pb-energy-yellow)"
              : "var(--pb-border-subtle)"
        }
        strokeWidth={done ? 1.5 : 1}
      />

      {/* Divider */}
      <line
        x1={cx + 10}
        y1={cy + CARD_H / 2}
        x2={cx + CARD_W - 10}
        y2={cy + CARD_H / 2}
        stroke="var(--pb-border-subtle)"
        strokeWidth={1}
      />

      {/* Winner accent bar — P1 */}
      {done && m.winnerId === m.player1Id && (
        <rect
          x={cx + 2}
          y={cy + 2}
          width={3}
          height={CARD_H / 2 - 4}
          rx={1.5}
          fill="var(--pb-brand-primary)"
        />
      )}

      {/* P1 name */}
      <text
        x={cx + 14}
        y={cy + CARD_H / 4 + 1}
        fontSize={13}
        fill={
          done && m.winnerId === m.player1Id
            ? "var(--pb-text-primary)"
            : "var(--pb-text-secondary)"
        }
        fontWeight={done && m.winnerId === m.player1Id ? 700 : 450}
      >
        {p1}
      </text>

      {/* P1 score */}
      {done && m.score1 != null && (
        <text
          x={cx + CARD_W - 12}
          y={cy + CARD_H / 4 + 1}
          textAnchor="end"
          fontSize={14}
          fontWeight={700}
          fill={
            m.winnerId === m.player1Id
              ? "var(--pb-brand-primary)"
              : "var(--pb-text-tertiary)"
          }
        >
          {m.score1}
        </text>
      )}

      {/* Winner accent bar — P2 */}
      {done && m.winnerId === m.player2Id && (
        <rect
          x={cx + 2}
          y={cy + CARD_H / 2 + 2}
          width={3}
          height={CARD_H / 2 - 4}
          rx={1.5}
          fill="var(--pb-brand-primary)"
        />
      )}

      {/* P2 name */}
      <text
        x={cx + 14}
        y={cy + (CARD_H * 3) / 4 + 1}
        fontSize={13}
        fill={
          done && m.winnerId === m.player2Id
            ? "var(--pb-text-primary)"
            : "var(--pb-text-secondary)"
        }
        fontWeight={done && m.winnerId === m.player2Id ? 700 : 450}
      >
        {p2}
      </text>

      {/* P2 score */}
      {done && m.score2 != null && (
        <text
          x={cx + CARD_W - 12}
          y={cy + (CARD_H * 3) / 4 + 1}
          textAnchor="end"
          fontSize={14}
          fontWeight={700}
          fill={
            m.winnerId === m.player2Id
              ? "var(--pb-brand-primary)"
              : "var(--pb-text-tertiary)"
          }
        >
          {m.score2}
        </text>
      )}

      {/* In‑progress badge */}
      {playing && (
        <text
          x={cx + CARD_W / 2}
          y={cy + CARD_H / 2 + 4}
          textAnchor="middle"
          fontSize={10}
          fill="var(--pb-energy-yellow)"
          fontWeight={600}
        >
          En juego
        </text>
      )}
    </g>
  );
}

function AdvancementLines({
  cards,
  nRounds,
  hasThird,
}: {
  cards: CardPos[];
  nRounds: number;
  hasThird: boolean;
}): JSX.Element {
  const lines: { id: string; points: string; dashed?: boolean }[] = [];
  const mainCards = cards.filter((c) => !c.isThirdPlace);
  const lastIx = nRounds - 1;

  // Main advancement connectors
  for (const card of mainCards) {
    if (card.roundIx >= lastIx) continue; // no advancement from final round

    const nextCol = card.roundIx + 1;
    const sameCol = mainCards
      .filter((c) => c.roundIx === card.roundIx)
      .sort((a, b) => a.cy - b.cy);
    const nextColCards = mainCards
      .filter((c) => c.roundIx === nextCol)
      .sort((a, b) => a.cy - b.cy);

    const idx = sameCol.indexOf(card);
    if (idx === -1) continue;
    const parentIdx = Math.floor(idx / 2);
    const parent = nextColCards[parentIdx];
    if (!parent) continue;

    const x1 = card.x + CARD_W;
    const midX = x1 + COL_GAP / 2;

    lines.push({
      id: `adv-${card.match.id}`,
      points: `${x1},${card.cy} ${midX},${card.cy} ${midX},${parent.cy} ${parent.x},${parent.cy}`,
    });
  }

  // Third‑place connectors from semifinals (dashed)
  if (hasThird) {
    const semiRound = nRounds - 2;
    if (semiRound >= 0) {
      const semis = mainCards.filter((c) => c.roundIx === semiRound);
      const thirdCard = cards.find((c) => c.isThirdPlace);
      if (thirdCard && semis.length > 0) {
        for (const semi of semis) {
          const x1 = semi.x + CARD_W;
          const midX = x1 + COL_GAP / 2;
          lines.push({
            id: `3rd-${semi.match.id}`,
            points: `${x1},${semi.cy} ${midX},${semi.cy} ${midX},${thirdCard.cy} ${thirdCard.x},${thirdCard.cy}`,
            dashed: true,
          });
        }
      }
    }
  }

  return (
    <>
      {lines.map((l) => (
        <polyline
          key={l.id}
          points={l.points}
          fill="none"
          stroke="var(--pb-border-strong)"
          strokeWidth={l.dashed ? 1 : 1.5}
          strokeDasharray={l.dashed ? "4 3" : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </>
  );
}

function RoundLabels({
  cards,
  nRounds,
}: {
  cards: CardPos[];
  nRounds: number;
}): JSX.Element {
  const seen = new Set<number>();
  return (
    <>
      {cards
        .filter((c) => !c.isThirdPlace)
        .filter((c) => {
          if (seen.has(c.roundIx)) return false;
          seen.add(c.roundIx);
          return true;
        })
        .map((c) => (
          <text
            key={`rl-${c.roundIx}`}
            x={c.x + CARD_W / 2}
            y={PAD - 4}
            textAnchor="middle"
            fill="var(--pb-text-secondary)"
            fontSize={13}
            fontWeight={700}
          >
            {roundLabel(c.roundIx + 1, nRounds)}
          </text>
        ))}
    </>
  );
}

function SrTable({
  bracket,
  playerNames,
  nRounds,
}: {
  bracket: Bracket;
  playerNames: Record<string, string>;
  nRounds: number;
}): JSX.Element {
  return (
    <table className="sr-only" aria-label="Cuadro del torneo">
      <thead>
        <tr>
          <th scope="col">Ronda</th>
          <th scope="col">#</th>
          <th scope="col">Jugador 1</th>
          <th scope="col">Jugador 2</th>
          <th scope="col">Resultado</th>
          <th scope="col">Ganador</th>
        </tr>
      </thead>
      <tbody>
        {bracket.rounds.map((r, ri) =>
          r.matches.map((m, mi) => (
            <tr key={m.id}>
              <td>{roundLabel(ri + 1, nRounds)}</td>
              <td>{mi + 1}</td>
              <td>{m.player1Id ? playerNames[m.player1Id] ?? "—" : "—"}</td>
              <td>{m.player2Id ? playerNames[m.player2Id] ?? "—" : "—"}</td>
              <td>
                {m.status === "completed" && m.score1 != null
                  ? `${m.score1} – ${m.score2}`
                  : m.status === "in_progress"
                    ? "En juego"
                    : "Pendiente"}
              </td>
              <td>{m.winnerId ? playerNames[m.winnerId] ?? "—" : "—"}</td>
            </tr>
          )),
        )}
      </tbody>
    </table>
  );
}

// ─── Public component ──────────────────────────────────────────────────────

export type BracketViewProps = {
  /** Bracket data from the tournament engine */
  bracket: Bracket;
  /** Map of playerId → display name */
  playerNames: Record<string, string>;
  className?: string;
  /** Whether to render round header labels (default: true) */
  showRoundLabels?: boolean;
};

export function BracketView({
  bracket,
  playerNames,
  className,
  showRoundLabels = true,
}: BracketViewProps) {
  const titleId = useId();
  const lay = useMemo(() => computeLayout(bracket), [bracket]);
  const nRounds = bracket.rounds.length;

  if (nRounds === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8 text-sm",
          "text-[var(--pb-text-secondary)]",
          className,
        )}
      >
        No hay llaves para mostrar
      </div>
    );
  }

  const totalMatches = bracket.rounds.reduce(
    (s, r) => s + r.matches.length,
    0,
  );

  return (
    <div className={cn("relative overflow-auto", className)}>
      {/* ── Screen‑reader accessible table ── */}
      <SrTable bracket={bracket} playerNames={playerNames} nRounds={nRounds} />

      {/* ── SVG bracket ── */}
      <svg
        viewBox={`0 0 ${lay.w} ${lay.h}`}
        width="100%"
        height="auto"
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-labelledby={titleId}
        style={{
          maxWidth: lay.w,
          fontFamily:
            "var(--font-pb-sans, ui-sans-serif, system-ui, sans-serif)",
        }}
      >
        <title id={titleId}>Cuadro del torneo — vista de llaves</title>
        <desc>
          Diagrama de eliminación directa con {nRounds} rondas, {totalMatches}{" "}
          partidos y resultados
        </desc>

        {/* Round labels */}
        {showRoundLabels && (
          <RoundLabels cards={lay.cards} nRounds={nRounds} />
        )}

        {/* Third‑place label */}
        {lay.hasThird &&
          (() => {
            const tc = lay.cards.find((c) => c.isThirdPlace);
            if (!tc) return null;
            return (
              <text
                key="label-3rd"
                x={tc.x + CARD_W / 2}
                y={tc.cy - CARD_H / 2 - 6}
                textAnchor="middle"
                fill="var(--pb-text-tertiary)"
                fontSize={11}
                fontWeight={600}
              >
                3.er Puesto
              </text>
            );
          })()}

        {/* Connecting lines */}
        <AdvancementLines
          cards={lay.cards}
          nRounds={nRounds}
          hasThird={lay.hasThird}
        />

        {/* Match cards */}
        {lay.cards.map((c) => (
          <MatchCard key={c.match.id} card={c} playerNames={playerNames} />
        ))}
      </svg>
    </div>
  );
}
