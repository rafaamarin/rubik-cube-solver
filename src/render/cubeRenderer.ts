import * as THREE from "three";
import type { CubeState, Cubie, Sticker } from "../simulation/cubeState";
import { FACE_SPECS, getMoveQuarterTurns, type Move, type Vec3 } from "../simulation/moves";

interface CubieEntry {
  group: THREE.Group;
  stickerRoot: THREE.Group;
  baseMaterial: THREE.MeshStandardMaterial;
  edgeMaterial: THREE.LineBasicMaterial;
}

const CUBIE_SIZE = 0.92;
const STICKER_SIZE = 0.68;
const STICKER_OFFSET = CUBIE_SIZE / 2 + 0.012;
const SPACING = 1.04;
const MOVE_DURATION_MS = 340;
const STICKER_EMISSIVE_INTENSITY = 0.12;

const baseGeometry = new THREE.BoxGeometry(CUBIE_SIZE, CUBIE_SIZE, CUBIE_SIZE);
const stickerGeometry = new THREE.PlaneGeometry(STICKER_SIZE, STICKER_SIZE);
const edgeGeometry = new THREE.EdgesGeometry(baseGeometry);
const stickerMaterials = new Map<string, THREE.MeshStandardMaterial>();

export class CubeRenderer {
  private readonly entries = new Map<string, CubieEntry>();
  private highlightedIds = new Set<string>();

  constructor(private readonly root: THREE.Group) {}

  syncFromState(state: CubeState): void {
    for (const cubie of state.cubies) {
      const entry = this.entries.get(cubie.id) ?? this.createCubieEntry(cubie);

      if (entry.group.parent !== this.root) {
        this.root.attach(entry.group);
      }

      entry.group.position.copy(toWorldPosition(cubie.position));
      entry.group.rotation.set(0, 0, 0);
      entry.group.quaternion.identity();
      entry.group.scale.set(1, 1, 1);
      renderStickers(entry.stickerRoot, cubie.stickers);
      this.updateEntryHighlight(cubie.id, entry);
    }
  }

  setHighlight(move: Move | null, state: CubeState): void {
    this.highlightedIds = new Set(move ? state.getAffectedCubies(move).map((cubie) => cubie.id) : []);

    for (const [id, entry] of this.entries) {
      this.updateEntryHighlight(id, entry);
    }
  }

  async animateMove(move: Move, state: CubeState): Promise<void> {
    const affectedEntries = state
      .getAffectedCubies(move)
      .map((cubie) => this.entries.get(cubie.id))
      .filter((entry): entry is CubieEntry => Boolean(entry));

    const pivot = new THREE.Group();
    this.root.add(pivot);

    for (const entry of affectedEntries) {
      pivot.attach(entry.group);
    }

    const spec = FACE_SPECS[move.face];
    const targetAngle = getMoveQuarterTurns(move) * (Math.PI / 2);

    try {
      await tween(MOVE_DURATION_MS, (progress) => {
        setAxisRotation(pivot, spec.axis, targetAngle * easeOutCubic(progress));
      });
    } finally {
      for (const entry of affectedEntries) {
        this.root.attach(entry.group);
      }

      this.root.remove(pivot);
    }
  }

  update(timeMs: number): void {
    this.root.position.y = Math.sin(timeMs * 0.0012) * 0.08;
    this.root.rotation.z = Math.sin(timeMs * 0.0009) * 0.012;

    const pulse = 0.58 + Math.sin(timeMs * 0.008) * 0.18;

    for (const [id, entry] of this.entries) {
      if (this.highlightedIds.has(id)) {
        entry.edgeMaterial.opacity = pulse;
      }
    }
  }

  private createCubieEntry(cubie: Cubie): CubieEntry {
    const group = new THREE.Group();
    group.name = `cubie-${cubie.id}`;

    const baseMaterial = new THREE.MeshStandardMaterial({
      color: "#111820",
      roughness: 0.58,
      metalness: 0.04,
    });
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    group.add(base);

    const edgeMaterial = new THREE.LineBasicMaterial({
      color: "#303944",
      transparent: true,
      opacity: 0.38,
    });
    const edges = new THREE.LineSegments(edgeGeometry, edgeMaterial);
    group.add(edges);

    const stickerRoot = new THREE.Group();
    group.add(stickerRoot);

    this.root.add(group);

    const entry = { group, stickerRoot, baseMaterial, edgeMaterial };
    this.entries.set(cubie.id, entry);
    return entry;
  }

  private updateEntryHighlight(id: string, entry: CubieEntry): void {
    const highlighted = this.highlightedIds.has(id);
    entry.baseMaterial.color.set(highlighted ? "#26313c" : "#111820");
    entry.baseMaterial.emissive.set(highlighted ? "#14253a" : "#000000");
    entry.baseMaterial.emissiveIntensity = highlighted ? 0.75 : 0;
    entry.edgeMaterial.color.set(highlighted ? "#ffd400" : "#303944");
    entry.edgeMaterial.opacity = highlighted ? 0.72 : 0.38;
  }
}

function renderStickers(stickerRoot: THREE.Group, stickers: Sticker[]): void {
  if (stickerRoot.children.length !== stickers.length) {
    while (stickerRoot.children.length > 0) {
      stickerRoot.remove(stickerRoot.children[0]);
    }

    for (const sticker of stickers) {
      stickerRoot.add(new THREE.Mesh(stickerGeometry, getStickerMaterial(sticker.color)));
    }
  }

  stickers.forEach((sticker, index) => {
    const normal = toVector3(sticker.normal);
    const mesh = stickerRoot.children[index] as THREE.Mesh;
    mesh.material = getStickerMaterial(sticker.color);
    mesh.position.copy(normal.clone().multiplyScalar(STICKER_OFFSET));
    mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal);
  });
}

function getStickerMaterial(color: string): THREE.MeshStandardMaterial {
  const existing = stickerMaterials.get(color);

  if (existing) {
    return existing;
  }

  const material = new THREE.MeshStandardMaterial({
    color,
    emissive: color,
    emissiveIntensity: STICKER_EMISSIVE_INTENSITY,
    roughness: 0.46,
    metalness: 0,
  });
  stickerMaterials.set(color, material);
  return material;
}

function setAxisRotation(object: THREE.Object3D, axis: "x" | "y" | "z", radians: number): void {
  object.rotation.set(0, 0, 0);
  object.rotation[axis] = radians;
}

function tween(durationMs: number, onUpdate: (progress: number) => void): Promise<void> {
  return new Promise((resolve) => {
    const start = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - start) / durationMs, 1);
      onUpdate(progress);

      if (progress < 1) {
        requestAnimationFrame(tick);
      } else {
        resolve();
      }
    };

    requestAnimationFrame(tick);
  });
}

function easeOutCubic(value: number): number {
  return 1 - Math.pow(1 - value, 3);
}

function toWorldPosition(position: Vec3): THREE.Vector3 {
  return new THREE.Vector3(position.x * SPACING, position.y * SPACING, position.z * SPACING);
}

function toVector3(vector: Vec3): THREE.Vector3 {
  return new THREE.Vector3(vector.x, vector.y, vector.z).normalize();
}
