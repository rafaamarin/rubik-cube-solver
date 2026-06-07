import {
  type Axis,
  type Face,
  FACE_SPECS,
  FACES,
  getAxisValue,
  getMoveQuarterTurns,
  type Move,
  type Vec3,
} from "./moves";

export interface Sticker {
  face: Face;
  color: string;
  homeNormal: Vec3;
  normal: Vec3;
}

export interface Cubie {
  id: string;
  home: Vec3;
  position: Vec3;
  stickers: Sticker[];
}

export const FACE_COLORS: Record<Face, string> = {
  R: "#ef3340",
  L: "#ff8a00",
  U: "#f8fbff",
  D: "#ffd400",
  F: "#00a35a",
  B: "#2166f3",
};

export class CubeState {
  cubies: Cubie[];

  constructor() {
    this.cubies = createSolvedCubies();
  }

  reset(): void {
    this.cubies = createSolvedCubies();
  }

  applyMove(move: Move): void {
    const spec = FACE_SPECS[move.face];
    const turns = getMoveQuarterTurns(move);

    for (const cubie of this.getAffectedCubies(move)) {
      cubie.position = rotateVec(cubie.position, spec.axis, turns);

      for (const sticker of cubie.stickers) {
        sticker.normal = rotateVec(sticker.normal, spec.axis, turns);
      }
    }
  }

  getAffectedCubies(move: Move): Cubie[] {
    const spec = FACE_SPECS[move.face];
    return this.cubies.filter((cubie) => getAxisValue(cubie.position, spec.axis) === spec.layer);
  }

  isSolved(): boolean {
    return this.cubies.every((cubie) => {
      if (!sameVec(cubie.position, cubie.home)) {
        return false;
      }

      return cubie.stickers.every((sticker) => sameVec(sticker.normal, sticker.homeNormal));
    });
  }
}

export function createSolvedCubies(): Cubie[] {
  const cubies: Cubie[] = [];

  for (let x = -1; x <= 1; x += 1) {
    for (let y = -1; y <= 1; y += 1) {
      for (let z = -1; z <= 1; z += 1) {
        const home = { x, y, z };
        cubies.push({
          id: `${x},${y},${z}`,
          home,
          position: { ...home },
          stickers: createStickers(home),
        });
      }
    }
  }

  return cubies;
}

export function rotateVec(vector: Vec3, axis: Axis, quarterTurns: number): Vec3 {
  const normalized = ((quarterTurns % 4) + 4) % 4;
  let next = { ...vector };

  for (let index = 0; index < normalized; index += 1) {
    if (axis === "x") {
      next = { x: next.x, y: -next.z, z: next.y };
    } else if (axis === "y") {
      next = { x: next.z, y: next.y, z: -next.x };
    } else {
      next = { x: -next.y, y: next.x, z: next.z };
    }
  }

  return {
    x: snapCoord(next.x),
    y: snapCoord(next.y),
    z: snapCoord(next.z),
  };
}

function createStickers(position: Vec3): Sticker[] {
  const stickers: Sticker[] = [];

  for (const face of FACES) {
    const spec = FACE_SPECS[face];

    if (getAxisValue(position, spec.axis) !== spec.layer) {
      continue;
    }

    stickers.push({
      face,
      color: FACE_COLORS[face],
      homeNormal: { ...spec.normal },
      normal: { ...spec.normal },
    });
  }

  return stickers;
}

function sameVec(a: Vec3, b: Vec3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

function snapCoord(value: number): number {
  if (Math.abs(value) < 0.001) {
    return 0;
  }

  return Math.round(value);
}
