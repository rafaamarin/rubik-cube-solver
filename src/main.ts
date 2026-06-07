import "./styles.css";
import { addAppliedMove, createGameState, getNextHintMove, type GameState } from "./game/gameState";
import { OrbitInput } from "./input/orbitControls";
import { createSceneApp } from "./render/createScene";
import { CubeRenderer } from "./render/cubeRenderer";
import { CubeState } from "./simulation/cubeState";
import { createMove, FACES, invertMove, type Face, type Move } from "./simulation/moves";
import { generateScramble } from "./simulation/scramble";
import {
  loadTimerRecords,
  saveTimerRecord,
  type TimerRecord,
} from "./storage/timerStorage";
import { createHud } from "./ui/hud";

const SCRAMBLE_LENGTH = 12;

const sceneRoot = document.getElementById("scene-root");
const renderFallback = document.getElementById("renderFallback");
const renderFallbackTitle = document.getElementById("renderFallbackTitle");
const renderFallbackDetail = document.getElementById("renderFallbackDetail");

if (!sceneRoot) {
  throw new Error("Missing scene root.");
}

const sceneApp = createSafeSceneApp(sceneRoot);

if (sceneApp) {
  startGame(sceneApp);
}

function createSafeSceneApp(container: HTMLElement): ReturnType<typeof createSceneApp> | null {
  try {
    return createSceneApp(container);
  } catch (error) {
    showRenderFallback("3D renderer unavailable", "WebGL did not start in this browser.");
    disableControls();
    console.error(error);
    return null;
  }
}

function startGame(sceneApp: ReturnType<typeof createSceneApp>): void {
  const cubeState = new CubeState();
  const cubeRenderer = new CubeRenderer(sceneApp.cubeRoot);
  const orbitInput = new OrbitInput(sceneApp.camera, sceneApp.renderer.domElement);
  sceneApp.onResize(() => orbitInput.updateCamera());
  sceneApp.resize();

  let gameState: GameState = createGameState(generateScramble(SCRAMBLE_LENGTH));
  let records: TimerRecord[] = loadTimerRecords();
  let busy = false;
  let firstFrameDrawn = false;
  let undoStack: Move[] = [];

  const hud = createHud({
    onNewScramble: () => newScramble(),
    onHint: () => revealHint(),
    onStep: () => stepHint(),
    onUndo: () => undoLatestMove(),
    onResetView: () => orbitInput.reset(),
    onMove: (move) => applyInteractiveMove(move),
  });

  newScramble();
  bindKeyboard();
  bindRenderRecovery();

  sceneApp.renderer.setAnimationLoop((timeMs: number) => {
    cubeRenderer.update(timeMs);
    sceneApp.renderer.render(sceneApp.scene, sceneApp.camera);

    if (!firstFrameDrawn) {
      firstFrameDrawn = true;
      hideRenderFallback();
    }
  });

  window.addEventListener("beforeunload", () => {
    orbitInput.dispose();
    sceneApp.dispose();
  });

  function newScramble(): void {
    const scramble = generateScramble(SCRAMBLE_LENGTH);
    cubeState.reset();

    for (const move of scramble.moves) {
      cubeState.applyMove(move);
    }

    gameState = createGameState(scramble);
    undoStack = [];
    busy = false;
    cubeRenderer.syncFromState(cubeState);
    cubeRenderer.setHighlight(null, cubeState);
    hud.render(snapshot());
  }

  function revealHint(): void {
    if (busy || gameState.phase === "complete") {
      return;
    }

    const hint = getNextHintMove(gameState);
    gameState = { ...gameState, currentHint: hint };
    cubeRenderer.setHighlight(hint, cubeState);
    hud.render(snapshot());
  }

  async function stepHint(): Promise<void> {
    if (busy || gameState.phase === "complete") {
      return;
    }

    const hint = gameState.currentHint ?? getNextHintMove(gameState);

    if (!hint) {
      return;
    }

    gameState = { ...gameState, currentHint: hint };
    cubeRenderer.setHighlight(hint, cubeState);
    hud.render(snapshot());
    await applyMove(hint);
  }

  async function undoLatestMove(): Promise<void> {
    if (busy || gameState.phase === "complete") {
      return;
    }

    const latestMove = undoStack.pop();

    if (!latestMove) {
      return;
    }

    await applyMove(invertMove(latestMove), { countMove: false, recordUndo: false });
  }

  function applyInteractiveMove(move: Move): void {
    void applyMove(move);
  }

  async function applyMove(
    move: Move,
    options: { countMove: boolean; recordUndo: boolean } = { countMove: true, recordUndo: true },
  ): Promise<void> {
    if (busy || gameState.phase === "complete") {
      return;
    }

    busy = true;
    startClock();
    hud.render(snapshot());

    try {
      await cubeRenderer.animateMove(move, cubeState);
      cubeState.applyMove(move);
      gameState = addAppliedMove(gameState, move);
      gameState = {
        ...gameState,
        moveCount: options.countMove ? gameState.moveCount + 1 : gameState.moveCount,
      };

      if (options.recordUndo) {
        undoStack.push(move);
      }

      cubeRenderer.syncFromState(cubeState);
      cubeRenderer.setHighlight(null, cubeState);

      if (cubeState.isSolved() || gameState.appliedMoves.length === 0) {
        completeGame();
      }
    } finally {
      busy = false;
      hud.render(snapshot());
    }
  }

  function startClock(): void {
    if (gameState.startedAt === null) {
      gameState = {
        ...gameState,
        startedAt: performance.now(),
      };
    }
  }

  function completeGame(): void {
    const completedAt = performance.now();
    const startedAt = gameState.startedAt ?? completedAt;
    const completionMs = completedAt - startedAt;

    gameState = {
      ...gameState,
      phase: "complete",
      completedAt,
      completionMs,
      currentHint: null,
    };

    records = saveTimerRecord({
      completionMs,
      scrambleSeed: gameState.scramble.seed,
      moveCount: gameState.moveCount,
      completedAt: new Date().toISOString(),
    });
  }

  function bindKeyboard(): void {
    window.addEventListener("keydown", (event) => {
      if (event.metaKey || event.ctrlKey || event.altKey || busy || gameState.phase === "complete") {
        return;
      }

      const face = event.key.toUpperCase() as Face;

      if (!FACES.includes(face)) {
        return;
      }

      event.preventDefault();
      void applyMove(createMove(face, event.shiftKey ? -1 : 1, 1));
    });
  }

  function snapshot() {
    const bestMs = records.length > 0 ? records[0].completionMs : null;

    return {
      phase: gameState.phase,
      busy,
      moveCount: gameState.moveCount,
      remainingSteps: gameState.appliedMoves.length,
      currentHint: gameState.currentHint,
      completionMs: gameState.completionMs,
      bestMs,
      undoAvailable: undoStack.length > 0,
    };
  }

  function bindRenderRecovery(): void {
    sceneApp.renderer.domElement.addEventListener("webglcontextlost", () => {
      showRenderFallback("3D renderer paused", "Restoring the black board.");
    });

    sceneApp.renderer.domElement.addEventListener("webglcontextrestored", () => {
      sceneApp.resize();
      cubeRenderer.syncFromState(cubeState);
      cubeRenderer.setHighlight(gameState.currentHint, cubeState);
      hideRenderFallback();
    });
  }
}

function showRenderFallback(title: string, detail: string): void {
  if (!renderFallback) {
    return;
  }

  renderFallback.hidden = false;

  if (renderFallbackTitle) {
    renderFallbackTitle.textContent = title;
  }

  if (renderFallbackDetail) {
    renderFallbackDetail.textContent = detail;
  }
}

function hideRenderFallback(): void {
  if (renderFallback) {
    renderFallback.hidden = true;
  }
}

function disableControls(): void {
  document.querySelectorAll<HTMLButtonElement>("button").forEach((button) => {
    button.disabled = true;
  });
}
