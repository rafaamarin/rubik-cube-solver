export const FACES = ["R", "L", "U", "D", "F", "B"] as const;

export type Face = (typeof FACES)[number];
export type Axis = "x" | "y" | "z";
export type Direction = 1 | -1;
export type Amount = 1 | 2;

export interface Vec3 {
  x: number;
  y: number;
  z: number;
}

export interface Move {
  face: Face;
  direction: Direction;
  amount: Amount;
  notation: string;
}

export interface FaceSpec {
  axis: Axis;
  layer: 1 | -1;
  clockwiseSign: 1 | -1;
  normal: Vec3;
}

export const FACE_SPECS: Record<Face, FaceSpec> = {
  R: { axis: "x", layer: 1, clockwiseSign: -1, normal: { x: 1, y: 0, z: 0 } },
  L: { axis: "x", layer: -1, clockwiseSign: 1, normal: { x: -1, y: 0, z: 0 } },
  U: { axis: "y", layer: 1, clockwiseSign: -1, normal: { x: 0, y: 1, z: 0 } },
  D: { axis: "y", layer: -1, clockwiseSign: 1, normal: { x: 0, y: -1, z: 0 } },
  F: { axis: "z", layer: 1, clockwiseSign: -1, normal: { x: 0, y: 0, z: 1 } },
  B: { axis: "z", layer: -1, clockwiseSign: 1, normal: { x: 0, y: 0, z: -1 } },
};

export function createMove(face: Face, direction: Direction = 1, amount: Amount = 1): Move {
  return {
    face,
    direction: amount === 2 ? 1 : direction,
    amount,
    notation: moveToNotation(face, direction, amount),
  };
}

export function moveToNotation(face: Face, direction: Direction, amount: Amount): string {
  if (amount === 2) {
    return `${face}2`;
  }

  return direction === -1 ? `${face}'` : face;
}

export function parseMove(notation: string): Move {
  const face = notation.charAt(0) as Face;

  if (!FACES.includes(face)) {
    throw new Error(`Unknown move face: ${notation}`);
  }

  if (notation.endsWith("2")) {
    return createMove(face, 1, 2);
  }

  return createMove(face, notation.endsWith("'") ? -1 : 1, 1);
}

export function invertMove(move: Move): Move {
  if (move.amount === 2) {
    return createMove(move.face, 1, 2);
  }

  return createMove(move.face, move.direction === 1 ? -1 : 1, 1);
}

export function getMoveQuarterTurns(move: Move): number {
  const spec = FACE_SPECS[move.face];
  return spec.clockwiseSign * move.direction * move.amount;
}

export function getAxisValue(vector: Vec3, axis: Axis): number {
  return vector[axis];
}

export function movesShareAxis(a: Face, b: Face): boolean {
  return FACE_SPECS[a].axis === FACE_SPECS[b].axis;
}

export function createSolutionSteps(appliedMoves: Move[]): Move[] {
  return [...appliedMoves].reverse().map(invertMove);
}

export function simplifyMoveHistory(moves: Move[]): Move[] {
  const stack: Move[] = [];

  for (const move of moves) {
    const previous = stack[stack.length - 1];

    if (!previous || previous.face !== move.face) {
      stack.push(move);
      continue;
    }

    const combined = (moveQuarterValue(previous) + moveQuarterValue(move)) % 4;
    stack.pop();

    if (combined !== 0) {
      stack.push(moveFromQuarterValue(move.face, combined));
    }
  }

  return stack;
}

export function moveQuarterValue(move: Move): number {
  const signed = move.direction * move.amount;
  return ((signed % 4) + 4) % 4;
}

function moveFromQuarterValue(face: Face, quarters: number): Move {
  const normalized = ((quarters % 4) + 4) % 4;

  if (normalized === 1) {
    return createMove(face, 1, 1);
  }

  if (normalized === 2) {
    return createMove(face, 1, 2);
  }

  if (normalized === 3) {
    return createMove(face, -1, 1);
  }

  throw new Error("Cannot create a move from zero quarter turns.");
}
