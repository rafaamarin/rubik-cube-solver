import { describe, expect, it } from "vitest";
import {
  createMove,
  createSolutionSteps,
  invertMove,
  parseMove,
  simplifyMoveHistory,
} from "./moves";

describe("moves", () => {
  it("inverts quarter moves and preserves double moves", () => {
    expect(invertMove(parseMove("R")).notation).toBe("R'");
    expect(invertMove(parseMove("R'")).notation).toBe("R");
    expect(invertMove(parseMove("R2")).notation).toBe("R2");
  });

  it("simplifies adjacent moves on the same face", () => {
    expect(simplifyMoveHistory([parseMove("R"), parseMove("R'")])).toEqual([]);
    expect(simplifyMoveHistory([parseMove("R"), parseMove("R")]).map((move) => move.notation)).toEqual([
      "R2",
    ]);
    expect(
      simplifyMoveHistory([parseMove("R"), parseMove("R"), parseMove("R")]).map(
        (move) => move.notation,
      ),
    ).toEqual(["R'"]);
    expect(simplifyMoveHistory([parseMove("R2"), parseMove("R2")])).toEqual([]);
  });

  it("creates reverse-history solution steps", () => {
    const moves = [createMove("R"), createMove("U", -1), createMove("F", 1, 2)];
    expect(createSolutionSteps(moves).map((move) => move.notation)).toEqual(["F2", "U", "R'"]);
  });
});
