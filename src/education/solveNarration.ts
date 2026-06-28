import { createSolutionSteps, type Move } from "../simulation/moves";
import type { GamePhase } from "../game/gameState";

export interface SolveNarration {
  method: "reverse-scramble";
  phaseTitle: string;
  briefText: string;
  detailText: string;
  setupText: string;
  currentMove: string | null;
  stepIndex: number;
  totalSteps: number;
  remainingSteps: number;
  scrambleNotation: string;
  solutionNotation: string;
}

export function createSolveNarration(
  scrambleMoves: Move[],
  unresolvedMoves: Move[],
  phase: GamePhase,
): SolveNarration {
  const fullSolution = createSolutionSteps(scrambleMoves);
  const remainingSolution = createSolutionSteps(unresolvedMoves);
  const totalSteps = fullSolution.length;
  const remainingSteps = remainingSolution.length;
  const currentMove = remainingSolution[0]?.notation ?? null;
  const stepIndex =
    totalSteps === 0 ? 0 : currentMove === null ? totalSteps : totalSteps - remainingSteps + 1;

  return {
    method: "reverse-scramble",
    phaseTitle: getPhaseTitle(phase, remainingSteps),
    briefText: getBriefText(currentMove, stepIndex, totalSteps),
    detailText: getDetailText(phase, currentMove),
    setupText:
      "Phase 1 - Copy the scramble: apply the scramble notation to your real cube before pressing Step.",
    currentMove,
    stepIndex,
    totalSteps,
    remainingSteps,
    scrambleNotation: movesToNotation(scrambleMoves),
    solutionNotation: movesToNotation(fullSolution),
  };
}

function getPhaseTitle(phase: GamePhase, remainingSteps: number): string {
  if (phase === "complete" || remainingSteps === 0) {
    return "Phase 3 - Verify solved";
  }

  return "Phase 2 - Work backward";
}

function getBriefText(currentMove: string | null, stepIndex: number, totalSteps: number): string {
  if (currentMove === null) {
    return "The cube is solved. Check every face against the center color.";
  }

  return `Step ${stepIndex} of ${totalSteps}: Do ${currentMove}. This undoes the latest unresolved scramble turn.`;
}

function getDetailText(phase: GamePhase, currentMove: string | null): string {
  if (phase === "complete" || currentMove === null) {
    return "Phase 3 - Verify solved: no inverse moves remain. The physical cube should match the solved 3D cube if you copied the scramble exactly.";
  }

  return `Phase 2 - Work backward: this method reads the scramble backward. ${currentMove} is the inverse of the last scramble move still affecting the cube, so applying it removes one layer turn from the path.`;
}

function movesToNotation(moves: Move[]): string {
  return moves.map((move) => move.notation).join(" ");
}
