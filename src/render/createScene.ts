import * as THREE from "three";

export interface SceneApp {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  cubeRoot: THREE.Group;
  resize: () => void;
  onResize: (callback: () => void) => () => void;
  dispose: () => void;
}

export function createSceneApp(container: HTMLElement): SceneApp {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#05070a");

  const camera = new THREE.PerspectiveCamera(
    46,
    1,
    0.1,
    100,
  );
  camera.position.set(4.8, 4.1, 6.2);

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: false,
    powerPreference: "high-performance",
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(1, 1);
  renderer.setClearColor("#05070a", 1);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.style.background = "#05070a";
  renderer.domElement.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
  });
  container.appendChild(renderer.domElement);

  const cubeRoot = new THREE.Group();
  scene.add(cubeRoot);

  const hemisphere = new THREE.HemisphereLight("#f8fbff", "#101820", 1.7);
  scene.add(hemisphere);

  const key = new THREE.DirectionalLight("#ffffff", 2.2);
  key.position.set(5, 7, 4);
  scene.add(key);

  const rim = new THREE.DirectionalLight("#9ec5ff", 1.1);
  rim.position.set(-4, 2, -5);
  scene.add(rim);

  const underside = new THREE.DirectionalLight("#fff0c2", 1.55);
  underside.position.set(-2.5, -5, 2.5);
  scene.add(underside);

  const floor = new THREE.Mesh(
    new THREE.CircleGeometry(4.2, 64),
    new THREE.MeshBasicMaterial({
      color: "#0f141b",
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -2.85;
  scene.add(floor);

  const resizeCallbacks = new Set<() => void>();
  const getSize = () => {
    const rect = container.getBoundingClientRect();
    return {
      width: Math.max(1, Math.round(rect.width || window.innerWidth)),
      height: Math.max(1, Math.round(rect.height || window.innerHeight)),
    };
  };
  const handleResize = () => {
    const { width, height } = getSize();
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);

    for (const callback of resizeCallbacks) {
      callback();
    }
  };
  const resizeObserver =
    typeof ResizeObserver === "undefined" ? null : new ResizeObserver(handleResize);

  resizeObserver?.observe(container);
  window.addEventListener("resize", handleResize);
  handleResize();

  return {
    scene,
    camera,
    renderer,
    cubeRoot,
    resize: handleResize,
    onResize: (callback) => {
      resizeCallbacks.add(callback);
      return () => resizeCallbacks.delete(callback);
    },
    dispose: () => {
      resizeObserver?.disconnect();
      window.removeEventListener("resize", handleResize);
      renderer.domElement.remove();
      renderer.dispose();
    },
  };
}
