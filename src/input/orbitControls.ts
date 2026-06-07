import * as THREE from "three";

const MIN_PHI = 0.34;
const MAX_PHI = Math.PI - 0.2;
const MIN_RADIUS = 5.2;
const MAX_RADIUS = 9.6;

export class OrbitInput {
  private theta = 0.72;
  private phi = 1.16;
  private radius = 7.35;
  private dragging = false;
  private lastX = 0;
  private lastY = 0;

  constructor(
    private readonly camera: THREE.PerspectiveCamera,
    private readonly domElement: HTMLElement,
  ) {
    this.bind();
    this.updateCamera();
  }

  reset(): void {
    this.theta = 0.72;
    this.phi = 1.16;
    this.radius = 7.35;
    this.updateCamera();
  }

  updateCamera(): void {
    const aspectScale = Math.max(1, 0.95 / Math.max(this.camera.aspect, 0.1));
    const effectiveRadius = this.radius * aspectScale;
    const sinPhi = Math.sin(this.phi);
    this.camera.position.set(
      effectiveRadius * sinPhi * Math.sin(this.theta),
      effectiveRadius * Math.cos(this.phi),
      effectiveRadius * sinPhi * Math.cos(this.theta),
    );
    this.camera.lookAt(0, 0, 0);
  }

  private bind(): void {
    this.domElement.addEventListener("pointerdown", this.handlePointerDown);
    this.domElement.addEventListener("pointermove", this.handlePointerMove);
    this.domElement.addEventListener("pointerup", this.handlePointerUp);
    this.domElement.addEventListener("pointercancel", this.handlePointerCancel);
    this.domElement.addEventListener("wheel", this.handleWheel, { passive: false });
  }

  dispose(): void {
    this.domElement.removeEventListener("pointerdown", this.handlePointerDown);
    this.domElement.removeEventListener("pointermove", this.handlePointerMove);
    this.domElement.removeEventListener("pointerup", this.handlePointerUp);
    this.domElement.removeEventListener("pointercancel", this.handlePointerCancel);
    this.domElement.removeEventListener("wheel", this.handleWheel);
  }

  private readonly handlePointerDown = (event: PointerEvent): void => {
    this.dragging = true;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.domElement.setPointerCapture(event.pointerId);
  };

  private readonly handlePointerMove = (event: PointerEvent): void => {
    if (!this.dragging) {
      return;
    }

    const deltaX = event.clientX - this.lastX;
    const deltaY = event.clientY - this.lastY;
    this.lastX = event.clientX;
    this.lastY = event.clientY;
    this.theta -= deltaX * 0.0065;
    this.phi = clamp(this.phi + deltaY * 0.0055, MIN_PHI, MAX_PHI);
    this.updateCamera();
  };

  private readonly handlePointerUp = (event: PointerEvent): void => {
    this.dragging = false;

    if (this.domElement.hasPointerCapture(event.pointerId)) {
      this.domElement.releasePointerCapture(event.pointerId);
    }
  };

  private readonly handlePointerCancel = (): void => {
    this.dragging = false;
  };

  private readonly handleWheel = (event: WheelEvent): void => {
    event.preventDefault();
    this.radius = clamp(this.radius + event.deltaY * 0.004, MIN_RADIUS, MAX_RADIUS);
    this.updateCamera();
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}
