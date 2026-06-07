import {
  createSolutionSteps,
  invertMove,
  simplifyMoveHistory,
  type Move,
} from "../simulation/moves";
import type { Scramble } from "../simulation/scramble";

export type GamePhase = "playing" | "complete";

export interface GameState {
  phase: GamePhase;
  scramble: Scramble;
  appliedMoves: Move[];
  currentHint: Move | null;
  moveCount: number;
  startedAt: number | null;
  completedAt: number | null;
  completionMs: number | null;
}

export function createGameState(scramble: Scramble): GameState {
  return {
    phase: "playing",
    scramble,
    appliedMoves: simplifyMoveHistory(scramble.moves),
    currentHint: null,
    moveCount: 0,
    startedAt: null,
    completedAt: null,
    completionMs: null,
  };
}

export function getNextHintMove(state: GameState): Move | null {
  const latestMove = state.appliedMoves[state.appliedMoves.length - 1];
  return latestMove ? invertMove(latestMove) : null;
}

export function getRemainingSolution(state: GameState): Move[] {
  return createSolutionSteps(state.appliedMoves);
}

export function addAppliedMove(state: GameState, move: Move): GameState {
  return {
    ...state,
    appliedMoves: simplifyMoveHistory([...state.appliedMoves, move]),
    currentHint: null,
  };
}
