import { describe, expect, it } from "vitest";
import { CubeState } from "./cubeState";
import { createSolutionSteps, invertMove, parseMove } from "./moves";
import { generateScramble } from "./scramble";

describe("cube state", () => {
  it("starts solved", () => {
    expect(new CubeState().isSolved()).toBe(true);
  });

  it("returns to solved after a move and its inverse", () => {
    const cube = new CubeState();
    const move = parseMove("R");

    cube.applyMove(move);
    expect(cube.isSolved()).toBe(false);
    cube.applyMove(invertMove(move));
    expect(cube.isSolved()).toBe(true);
  });

  it("solves generated scrambles by applying reverse-history steps", () => {
    const cube = new CubeState();
    const scramble = generateScramble(12, "test-seed");

    for (const move of scramble.moves) {
      cube.applyMove(move);
    }

    expect(cube.isSolved()).toBe(false);

    for (const move of createSolutionSteps(scramble.moves)) {
      cube.applyMove(move);
    }

    expect(cube.isSolved()).toBe(true);
  });

  it("generates deterministic scramble notation from a seed", () => {
    const first = generateScramble(12, "fixed-seed").moves.map((move) => move.notation);
    const second = generateScramble(12, "fixed-seed").moves.map((move) => move.notation);
    expect(first).toEqual(second);
  });
});
