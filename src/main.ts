import * as THREE from "three";
import { TidewakeAudio } from "./audio";
import {
  getCameraVolume,
  getSceneProgress,
  moveToward,
  resolveWalkablePosition,
  type Vec2
} from "./tidewakeScene";
import "./styles.css";

const app = document.querySelector<HTMLDivElement>("#app");

if (!app) {
  throw new Error("Missing #app root");
}

app.innerHTML = `
  <main class="game-shell" aria-label="Tidewake walking slice">
    <canvas class="scene-canvas" data-testid="scene-canvas"></canvas>
    <section class="hud" aria-label="Scene interface">
      <div class="top-bar">
        <div class="title-block">
          <h1>Tidewake</h1>
          <p>Kael begins the pilgrimage from village square to shellfiend overlook.</p>
        </div>
        <p class="status-pill" data-testid="camera-volume">Camera: Village Square</p>
      </div>
      <div class="bottom-bar">
        <div class="controls-strip" aria-label="Controls">
          <span class="control-chip">Mouse: set destination</span>
          <span class="control-chip">WASD: move</span>
          <span class="control-chip">E: interact</span>
          <span class="control-chip">M: menu</span>
        </div>
        <button class="audio-button" type="button" data-testid="audio-toggle">Audio Off</button>
      </div>
    </section>
  </main>
`;

const canvas = app.querySelector<HTMLCanvasElement>("[data-testid='scene-canvas']");
const cameraVolumeLabel = app.querySelector<HTMLElement>("[data-testid='camera-volume']");
const audioToggle = app.querySelector<HTMLButtonElement>("[data-testid='audio-toggle']");

if (!canvas || !cameraVolumeLabel || !audioToggle) {
  throw new Error("Missing Tidewake UI element");
}

const sceneCanvas = canvas;
const cameraVolumeStatus = cameraVolumeLabel;
const audioButton = audioToggle;

const renderer = new THREE.WebGLRenderer({
  canvas: sceneCanvas,
  antialias: true,
  preserveDrawingBuffer: true
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x86c9d8);
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x86c9d8, 18, 42);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();
const groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const pointerHit = new THREE.Vector3();
const audio = new TidewakeAudio();

const kael = createKael();
scene.add(kael);

const destinationMarker = createDestinationMarker();
scene.add(destinationMarker);

let kaelPosition: Vec2 = { x: -14, z: 0 };
let destination: Vec2 = { ...kaelPosition };
const pressedKeys = new Set<string>();
let previousTime = performance.now();

buildScene();
updateKaelMesh();
updateCamera(true);
resize();
requestAnimationFrame(tick);

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  pressedKeys.add(event.code);

  if (event.code === "KeyM") {
    void toggleAudio();
  }
});
window.addEventListener("keyup", (event) => pressedKeys.delete(event.code));

sceneCanvas.addEventListener("pointerdown", (event) => {
  const rect = sceneCanvas.getBoundingClientRect();
  pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
  pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  raycaster.setFromCamera(pointer, camera);

  if (raycaster.ray.intersectPlane(groundPlane, pointerHit)) {
    destination = resolveWalkablePosition({ x: pointerHit.x, z: pointerHit.z });
    destinationMarker.visible = true;
    destinationMarker.position.set(destination.x, 0.04, destination.z);
    void audio.playConfirm();
  }
});

audioButton.addEventListener("click", () => {
  void toggleAudio();
});

function tick(now: number): void {
  const dt = Math.min((now - previousTime) / 1000, 0.08);
  previousTime = now;
  const keyboardVector = getKeyboardVector();

  if (keyboardVector.x !== 0 || keyboardVector.z !== 0) {
    destination = { ...kaelPosition };
    const next = {
      x: kaelPosition.x + keyboardVector.x * 6 * dt,
      z: kaelPosition.z + keyboardVector.z * 6 * dt
    };
    kaelPosition = resolveWalkablePosition(next);
    destinationMarker.visible = false;
  } else {
    kaelPosition = resolveWalkablePosition(moveToward(kaelPosition, destination, 4.2 * dt));
  }

  updateKaelMesh();
  updateCamera(false);
  renderer.render(scene, camera);
  requestAnimationFrame(tick);
}

function getKeyboardVector(): Vec2 {
  const vector = { x: 0, z: 0 };

  if (pressedKeys.has("KeyW") || pressedKeys.has("ArrowUp")) vector.z -= 1;
  if (pressedKeys.has("KeyS") || pressedKeys.has("ArrowDown")) vector.z += 1;
  if (pressedKeys.has("KeyA") || pressedKeys.has("ArrowLeft")) vector.x -= 1;
  if (pressedKeys.has("KeyD") || pressedKeys.has("ArrowRight")) vector.x += 1;

  const length = Math.hypot(vector.x, vector.z);
  return length === 0 ? vector : { x: vector.x / length, z: vector.z / length };
}

function updateKaelMesh(): void {
  kael.position.set(kaelPosition.x, 0, kaelPosition.z);
}

function updateCamera(snap: boolean): void {
  const volume = getCameraVolume(kaelPosition);

  if (!volume) {
    return;
  }

  cameraVolumeStatus.textContent = `Camera: ${volume.name} - ${getSceneProgress(kaelPosition)}%`;
  const nextPosition = new THREE.Vector3(...volume.cameraPosition);
  const lookAt = new THREE.Vector3(...volume.lookAt);

  if (snap) {
    camera.position.copy(nextPosition);
  } else {
    camera.position.lerp(nextPosition, 0.08);
  }

  camera.lookAt(lookAt);
}

function resize(): void {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

async function toggleAudio(): Promise<void> {
  const muted = await audio.toggle();
  audioButton.textContent = muted ? "Audio Off" : "Audio On";
}

function buildScene(): void {
  scene.add(new THREE.HemisphereLight(0xdff8ff, 0x4e6b56, 2.4));

  const sun = new THREE.DirectionalLight(0xffffff, 2.8);
  sun.position.set(-8, 14, 8);
  sun.castShadow = true;
  scene.add(sun);

  const sand = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.2, 14),
    new THREE.MeshStandardMaterial({ color: 0xe8d39a, roughness: 0.9 })
  );
  sand.position.set(0, -0.12, 0);
  sand.receiveShadow = true;
  scene.add(sand);

  const water = new THREE.Mesh(
    new THREE.BoxGeometry(38, 0.08, 8),
    new THREE.MeshStandardMaterial({ color: 0x3aa7b5, roughness: 0.55, metalness: 0.05 })
  );
  water.position.set(0, -0.04, -8.3);
  scene.add(water);

  addVillageHuts();
  addPalms();
  addBlockers();
  addOverlook();
}

function addVillageHuts(): void {
  for (const [x, z] of [
    [-15, 4],
    [-10, 4.7],
    [-12, -4.4]
  ]) {
    const hut = new THREE.Group();
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(1.4, 1.6, 1.4, 8),
      new THREE.MeshStandardMaterial({ color: 0xc78358, roughness: 0.8 })
    );
    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(1.8, 1.1, 8),
      new THREE.MeshStandardMaterial({ color: 0x6d4b34, roughness: 0.95 })
    );
    base.position.y = 0.7;
    roof.position.y = 1.95;
    base.castShadow = true;
    roof.castShadow = true;
    hut.add(base, roof);
    hut.position.set(x, 0, z);
    scene.add(hut);
  }
}

function addPalms(): void {
  for (const [x, z] of [
    [-5, -5],
    [1, 5],
    [6, -5],
    [13, 4.2]
  ]) {
    const palm = new THREE.Group();
    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.22, 2.4, 7),
      new THREE.MeshStandardMaterial({ color: 0x8c6040, roughness: 0.9 })
    );
    const leaves = new THREE.Mesh(
      new THREE.ConeGeometry(1.2, 0.65, 6),
      new THREE.MeshStandardMaterial({ color: 0x2f9b6b, roughness: 0.75 })
    );
    trunk.position.y = 1.2;
    leaves.position.y = 2.65;
    trunk.castShadow = true;
    leaves.castShadow = true;
    palm.add(trunk, leaves);
    palm.position.set(x, 0, z);
    scene.add(palm);
  }
}

function addBlockers(): void {
  for (const [x, z, scale] of [
    [-6, -1.2, 1.4],
    [2.5, 2.4, 1.15],
    [11.2, -0.6, 1.35]
  ]) {
    const shell = new THREE.Mesh(
      new THREE.DodecahedronGeometry(scale, 0),
      new THREE.MeshStandardMaterial({ color: 0xe7eef0, roughness: 0.72 })
    );
    shell.position.set(x, scale * 0.42, z);
    shell.scale.set(1.3, 0.65, 1);
    shell.castShadow = true;
    scene.add(shell);
  }
}

function addOverlook(): void {
  const gate = new THREE.Mesh(
    new THREE.TorusGeometry(1.6, 0.14, 8, 18),
    new THREE.MeshStandardMaterial({ color: 0x9ee8ff, emissive: 0x1c5460, roughness: 0.4 })
  );
  gate.position.set(15.4, 1.8, -3.9);
  gate.rotation.x = Math.PI / 2;
  scene.add(gate);
}

function createKael(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.CapsuleGeometry(0.35, 0.9, 5, 8),
    new THREE.MeshStandardMaterial({ color: 0x2f6fd0, roughness: 0.7 })
  );
  const scarf = new THREE.Mesh(
    new THREE.BoxGeometry(0.8, 0.18, 0.18),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.65 })
  );
  body.position.y = 0.85;
  scarf.position.set(0.18, 1.25, 0.18);
  body.castShadow = true;
  scarf.castShadow = true;
  group.add(body, scarf);
  return group;
}

function createDestinationMarker(): THREE.Mesh {
  const marker = new THREE.Mesh(
    new THREE.RingGeometry(0.35, 0.48, 24),
    new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
  );
  marker.rotation.x = -Math.PI / 2;
  marker.visible = false;
  return marker;
}
