import { createMove, type Face, FACES, type Move } from "../simulation/moves";
import { formatTime } from "../storage/timerStorage";

export interface HudSnapshot {
  phase: "playing" | "complete";
  busy: boolean;
  moveCount: number;
  remainingSteps: number;
  currentHint: Move | null;
  completionMs: number | null;
  bestMs: number | null;
  undoAvailable: boolean;
}

export interface HudCallbacks {
  onNewScramble: () => void;
  onHint: () => void;
  onStep: () => void;
  onUndo: () => void;
  onResetView: () => void;
  onMove: (move: Move) => void;
}

export function createHud(callbacks: HudCallbacks) {
  const objectiveText = getElement("objectiveText");
  const statusText = getElement("statusText");
  const assistText = getElement("assistText");
  const guidePanel = getElement("guidePanel");
  const guideKicker = getElement("guideKicker");
  const guideMove = getElement("guideMove");
  const guideText = getElement("guideText");
  const completionPanel = getElement("completionPanel");
  const completionTime = getElement("completionTime");
  const bestTime = getElement("bestTime");
  const hintButton = getButton("hintButton");
  const stepButton = getButton("stepButton");
  const undoButton = getButton("undoButton");
  const inverseToggle = getButton("inverseToggle");
  const doubleToggle = getButton("doubleToggle");
  const moveButtons = [...document.querySelectorAll<HTMLButtonElement>("[data-face]")];

  getButton("newScrambleButton").addEventListener("click", callbacks.onNewScramble);
  hintButton.addEventListener("click", callbacks.onHint);
  stepButton.addEventListener("click", callbacks.onStep);
  undoButton.addEventListener("click", callbacks.onUndo);
  getButton("resetViewButton").addEventListener("click", callbacks.onResetView);

  inverseToggle.addEventListener("click", () => {
    inverseToggle.ariaPressed = inverseToggle.ariaPressed === "true" ? "false" : "true";
  });

  doubleToggle.addEventListener("click", () => {
    doubleToggle.ariaPressed = doubleToggle.ariaPressed === "true" ? "false" : "true";
  });

  for (const button of moveButtons) {
    button.addEventListener("click", () => {
      const face = button.dataset.face as Face;

      if (!FACES.includes(face)) {
        return;
      }

      const amount = doubleToggle.ariaPressed === "true" ? 2 : 1;
      const direction = inverseToggle.ariaPressed === "true" ? -1 : 1;
      callbacks.onMove(createMove(face, direction, amount));
    });
  }

  return {
    render(snapshot: HudSnapshot): void {
      const complete = snapshot.phase === "complete";
      const disabled = snapshot.busy || complete;

      objectiveText.textContent = complete ? "Cube solved" : "Reverse the scramble";
      statusText.textContent = `${snapshot.remainingSteps} moves left`;
      assistText.textContent = complete
        ? "Clock saved locally."
        : snapshot.currentHint
          ? "The highlighted slice is your next turn."
          : "Hint reveals the next turn.";
      hintButton.disabled = snapshot.busy || snapshot.remainingSteps === 0 || complete;
      stepButton.disabled = snapshot.busy || snapshot.remainingSteps === 0 || complete;
      undoButton.disabled = snapshot.busy || !snapshot.undoAvailable || complete;

      for (const button of moveButtons) {
        button.disabled = disabled;
      }

      inverseToggle.disabled = disabled;
      doubleToggle.disabled = disabled;

      guidePanel.hidden = !snapshot.currentHint || complete;

      if (snapshot.currentHint) {
        guidePanel.dataset.mode = snapshot.busy ? "step" : "hint";
        guideKicker.textContent = snapshot.busy ? "Step" : "Hint";
        guideMove.textContent = snapshot.currentHint.notation;
        guideText.textContent = snapshot.busy
          ? "Watch the highlighted slice rotate into place."
          : "Turn the highlighted slice to reduce the solve path.";
      }

      completionPanel.hidden = !complete || snapshot.completionMs === null;

      if (snapshot.completionMs !== null) {
        completionTime.textContent = formatTime(snapshot.completionMs);
      }

      bestTime.textContent =
        snapshot.bestMs === null ? `${snapshot.moveCount} moves` : `Best ${formatTime(snapshot.bestMs)}`;
    },
  };
}

function getElement(id: string): HTMLElement {
  const element = document.getElementById(id);

  if (!element) {
    throw new Error(`Missing HUD element: ${id}`);
  }

  return element;
}

function getButton(id: string): HTMLButtonElement {
  const element = getElement(id);

  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Expected button element: ${id}`);
  }

  return element;
}
