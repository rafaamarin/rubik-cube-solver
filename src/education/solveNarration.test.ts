import { describe, expect, it } from "vitest";
import { createMove, parseMove } from "../simulation/moves";
import { createSolveNarration } from "./solveNarration";

describe("solve narration", () => {
  it("explains a reverse-scramble solution from the first unresolved move", () => {
    const scramble = [createMove("R"), createMove("U", -1), createMove("F", 1, 2)];
    const narration = createSolveNarration(scramble, scramble, "playing");

    expect(narration.method).toBe("reverse-scramble");
    expect(narration.scrambleNotation).toBe("R U' F2");
    expect(narration.solutionNotation).toBe("F2 U R'");
    expect(narration.currentMove).toBe("F2");
    expect(narration.stepIndex).toBe(1);
    expect(narration.totalSteps).toBe(3);
    expect(narration.remainingSteps).toBe(3);
    expect(narration.phaseTitle).toBe("Phase 2 - Work backward");
    expect(narration.briefText).toContain("Do F2");
    expect(narration.detailText).toContain("inverse of the last scramble move");
  });

  it("updates progress when part of the reverse path has already been solved", () => {
    const scramble = [parseMove("R"), parseMove("U"), parseMove("F")];
    const unresolvedMoves = [parseMove("R")];
    const narration = createSolveNarration(scramble, unresolvedMoves, "playing");

    expect(narration.currentMove).toBe("R'");
    expect(narration.stepIndex).toBe(3);
    expect(narration.totalSteps).toBe(3);
    expect(narration.remainingSteps).toBe(1);
    expect(narration.briefText).toContain("Step 3 of 3");
  });

  it("shows a completion explanation when no inverse moves remain", () => {
    const scramble = [parseMove("R"), parseMove("U")];
    const narration = createSolveNarration(scramble, [], "complete");

    expect(narration.currentMove).toBeNull();
    expect(narration.stepIndex).toBe(2);
    expect(narration.totalSteps).toBe(2);
    expect(narration.remainingSteps).toBe(0);
    expect(narration.phaseTitle).toBe("Phase 3 - Verify solved");
    expect(narration.briefText).toContain("The cube is solved");
  });
});
