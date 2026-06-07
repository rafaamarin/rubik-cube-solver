import { createMove, type Face, FACES, movesShareAxis, type Move } from "./moves";

export interface Scramble {
  seed: string;
  moves: Move[];
}

export function generateScramble(length = 12, seed = createSeed()): Scramble {
  const random = createRandom(seed);
  const moves: Move[] = [];

  while (moves.length < length) {
    const face = FACES[Math.floor(random() * FACES.length)] as Face;
    const previous = moves[moves.length - 1];

    if (previous && movesShareAxis(previous.face, face)) {
      continue;
    }

    const amount = random() < 0.18 ? 2 : 1;
    const direction = amount === 2 || random() > 0.5 ? 1 : -1;
    moves.push(createMove(face, direction, amount));
  }

  return { seed, moves };
}

function createSeed(): string {
  const bytes = new Uint32Array(2);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    bytes[0] = Date.now();
    bytes[1] = Math.floor(Math.random() * 0xffffffff);
  }

  return [...bytes].map((value) => value.toString(16).padStart(8, "0")).join("");
}

function createRandom(seed: string): () => number {
  let state = 2166136261;

  for (let index = 0; index < seed.length; index += 1) {
    state ^= seed.charCodeAt(index);
    state = Math.imul(state, 16777619);
  }

  return () => {
    state += 0x6d2b79f5;
    let next = state;
    next = Math.imul(next ^ (next >>> 15), next | 1);
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61);
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296;
  };
}
