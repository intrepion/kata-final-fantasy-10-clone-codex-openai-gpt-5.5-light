import * as THREE from "three";
import { TidewakeAudio } from "./audio";
import {
  attack,
  createTeachingBattle,
  getCurrentActor,
  getTurnTimeline,
  inspect,
  partySwap,
  type BattleState,
  type CombatantId
} from "./combat";
import {
  FIRST_BOARD_NODES,
  awardEchoShard,
  createProgressionState,
  unlockBoardNode,
  type BoardNodeId,
  type ProgressionState
} from "./progression";
import {
  createSaveSnapshot,
  parseSaveSnapshot,
  serializeSaveSnapshot,
  type SaveSnapshot
} from "./saveSnapshot";
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
        <p class="status-pill" data-testid="echo-shards">Echo Shards: 0</p>
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
    <section class="battle-panel" data-testid="battle-panel" hidden>
      <div class="battle-header">
        <h2>Beach Path Encounter</h2>
        <p data-testid="battle-current">Kael is ready.</p>
      </div>
      <div class="timeline" data-testid="turn-timeline"></div>
      <div class="combatants" data-testid="combatants"></div>
      <div class="command-menu" aria-label="Command menu">
        <button type="button" data-command="attack">Attack</button>
        <button type="button" data-command="inspect">Inspect</button>
        <button type="button" data-command="swap-orun">Swap Orun</button>
        <button type="button" data-command="swap-maera">Swap Maera</button>
      </div>
      <ol class="battle-log" data-testid="battle-log"></ol>
    </section>
    <section class="board-panel" data-testid="board-panel" hidden>
      <div class="battle-header">
        <h2>Progression Board</h2>
        <p data-testid="board-status">Choose a first node.</p>
      </div>
      <div class="board-nodes" data-testid="board-nodes"></div>
    </section>
  </main>
`;

const canvas = app.querySelector<HTMLCanvasElement>("[data-testid='scene-canvas']");
const cameraVolumeLabel = app.querySelector<HTMLElement>("[data-testid='camera-volume']");
const audioToggle = app.querySelector<HTMLButtonElement>("[data-testid='audio-toggle']");
const battlePanel = app.querySelector<HTMLElement>("[data-testid='battle-panel']");
const battleCurrent = app.querySelector<HTMLElement>("[data-testid='battle-current']");
const turnTimeline = app.querySelector<HTMLElement>("[data-testid='turn-timeline']");
const combatantsPanel = app.querySelector<HTMLElement>("[data-testid='combatants']");
const battleLog = app.querySelector<HTMLElement>("[data-testid='battle-log']");
const echoShardLabel = app.querySelector<HTMLElement>("[data-testid='echo-shards']");
const boardPanel = app.querySelector<HTMLElement>("[data-testid='board-panel']");
const boardStatus = app.querySelector<HTMLElement>("[data-testid='board-status']");
const boardNodes = app.querySelector<HTMLElement>("[data-testid='board-nodes']");

if (
  !canvas ||
  !cameraVolumeLabel ||
  !audioToggle ||
  !battlePanel ||
  !battleCurrent ||
  !turnTimeline ||
  !combatantsPanel ||
  !battleLog ||
  !echoShardLabel ||
  !boardPanel ||
  !boardStatus ||
  !boardNodes
) {
  throw new Error("Missing Tidewake UI element");
}

const sceneCanvas = canvas;
const cameraVolumeStatus = cameraVolumeLabel;
const audioButton = audioToggle;
const battlePanelElement = battlePanel;
const battleCurrentElement = battleCurrent;
const turnTimelineElement = turnTimeline;
const combatantsElement = combatantsPanel;
const battleLogElement = battleLog;
const echoShardElement = echoShardLabel;
const boardPanelElement = boardPanel;
const boardStatusElement = boardStatus;
const boardNodesElement = boardNodes;

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

const pathEncounter = createPathEncounter();
scene.add(pathEncounter);

const destinationMarker = createDestinationMarker();
scene.add(destinationMarker);

let kaelPosition: Vec2 = { x: -14, z: 0 };
let destination: Vec2 = { ...kaelPosition };
const pressedKeys = new Set<string>();
let previousTime = performance.now();
let battleState: BattleState | undefined;
let progression: ProgressionState = createProgressionState();
let defeatedEncounters: string[] = [];
let partyHp: Record<string, number> = { kael: 40, maera: 32, orun: 48 };
let battleRewardGranted = false;

restoreSnapshot();

buildScene();
updateKaelMesh();
updateCamera(true);
resize();
requestAnimationFrame(tick);

window.addEventListener("resize", resize);
window.addEventListener("keydown", (event) => {
  pressedKeys.add(event.code);

  if (event.code === "KeyM") {
    boardPanelElement.hidden = !boardPanelElement.hidden;
  }

  if (event.code === "KeyE" && canStartPathEncounter()) {
    startBattle();
  } else if (event.code === "KeyE" && canUseMemoryTide()) {
    saveAtMemoryTide();
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

app.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement) || !target.dataset.command || !battleState) {
    return;
  }

  if (target.dataset.command === "attack") {
    battleState = attack(battleState);
    syncPartyHpFromBattle();
    void audio.playHit();
  }

  if (target.dataset.command === "inspect") {
    battleState = inspect(battleState);
  }

  if (target.dataset.command === "swap-orun") {
    battleState = partySwap(battleState, "orun");
  }

  if (target.dataset.command === "swap-maera") {
    battleState = partySwap(battleState, "maera");
  }

  renderBattle();
});

app.addEventListener("click", (event) => {
  const target = event.target;

  if (!(target instanceof HTMLElement) || !target.dataset.node) {
    return;
  }

  progression = unlockBoardNode(progression, target.dataset.node as BoardNodeId);
  renderProgression();
});

function tick(now: number): void {
  const dt = Math.min((now - previousTime) / 1000, 0.08);
  previousTime = now;
  const keyboardVector = getKeyboardVector();

  if (!battleState && (keyboardVector.x !== 0 || keyboardVector.z !== 0)) {
    destination = { ...kaelPosition };
    const next = {
      x: kaelPosition.x + keyboardVector.x * 6 * dt,
      z: kaelPosition.z + keyboardVector.z * 6 * dt
    };
    kaelPosition = resolveWalkablePosition(next);
    destinationMarker.visible = false;
  } else if (!battleState) {
    kaelPosition = resolveWalkablePosition(moveToward(kaelPosition, destination, 4.2 * dt));
  }

  updateKaelMesh();
  updatePathEncounter();
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

function canStartPathEncounter(): boolean {
  return !battleState && Math.hypot(kaelPosition.x - -0.6, kaelPosition.z - -1.8) < 2.6;
}

function startBattle(): void {
  if (defeatedEncounters.includes("skitterfin")) {
    return;
  }

  battleState = createTeachingBattle(partyHp);
  battleRewardGranted = false;
  battlePanelElement.hidden = false;
  boardPanelElement.hidden = true;
  destinationMarker.visible = false;
  renderBattle();
  void audio.playConfirm();
  void audio.startBattleLoop();
}

function renderBattle(): void {
  if (!battleState) {
    return;
  }

  const current = getCurrentActor(battleState);
  battleCurrentElement.textContent = battleState.won
    ? "The Skitterfin is defeated."
    : `${current.name} is ready.`;
  turnTimelineElement.textContent = getTurnTimeline(battleState)
    .slice(0, 4)
    .map((combatant) => combatant.name)
    .join(" -> ");
  combatantsElement.innerHTML = battleState.combatants
    .map(
      (combatant) => `
        <article class="combatant ${combatant.active ? "active" : ""}" data-testid="combatant-${combatant.id}">
          <strong>${combatant.name}</strong>
          <span>${combatant.hp}/${combatant.maxHp} HP</span>
        </article>
      `
    )
    .join("");
  battleLogElement.innerHTML = battleState.log
    .slice(0, 4)
    .map((entry) => `<li>${entry}</li>`)
    .join("");

  if (battleState.won && !battleRewardGranted) {
    battleRewardGranted = true;
    defeatedEncounters = defeatedEncounters.includes("skitterfin")
      ? defeatedEncounters
      : [...defeatedEncounters, "skitterfin"];
    progression = awardEchoShard(progression);
    battlePanelElement.hidden = true;
    battleState = undefined;
    audio.stopBattleLoop();
    boardPanelElement.hidden = false;
    updatePathEncounter();
    renderProgression();
  }
}

function renderProgression(): void {
  echoShardElement.textContent = `Echo Shards: ${progression.echoShards}`;
  boardStatusElement.textContent =
    progression.unlockedNodes.length > 0
      ? `Unlocked: ${progression.unlockedNodes.join(", ")}`
      : "Choose a first node.";
  boardNodesElement.innerHTML = FIRST_BOARD_NODES.map((node) => {
    const unlocked = progression.unlockedNodes.includes(node.id);
    return `
      <article class="board-node ${unlocked ? "unlocked" : ""}">
        <strong>${node.label}</strong>
        <span>${node.kind}</span>
        <p>${node.description}</p>
        <button type="button" data-node="${node.id}" ${unlocked ? "disabled" : ""}>
          ${unlocked ? "Unlocked" : `Spend ${node.cost}`}
        </button>
      </article>
    `;
  }).join("");
}

function canUseMemoryTide(): boolean {
  return !battleState && Math.hypot(kaelPosition.x - -16.2, kaelPosition.z - 2.4) < 2.4;
}

function saveAtMemoryTide(): void {
  const snapshot = createSaveSnapshot(kaelPosition, defeatedEncounters, progression, partyHp);
  localStorage.setItem("tidewake-save", serializeSaveSnapshot(snapshot));
  void audio.playSave();
}

function restoreSnapshot(): void {
  const snapshot = parseSaveSnapshot(localStorage.getItem("tidewake-save"));

  if (!snapshot) {
    renderProgression();
    return;
  }

  applySnapshot(snapshot);
}

function applySnapshot(snapshot: SaveSnapshot): void {
  kaelPosition = snapshot.scenePosition;
  destination = { ...snapshot.scenePosition };
  defeatedEncounters = snapshot.defeatedEncounters;
  partyHp = snapshot.partyHp;
  progression = {
    echoShards: snapshot.echoShards,
    unlockedNodes: snapshot.unlockedNodes
  };
  renderProgression();
}

function syncPartyHpFromBattle(): void {
  if (!battleState) {
    return;
  }

  partyHp = Object.fromEntries(
    battleState.combatants
      .filter((combatant) => combatant.side === "party")
      .map((combatant) => [combatant.id, combatant.hp])
  );
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
  addMemoryTide();
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

function updatePathEncounter(): void {
  pathEncounter.visible = !battleState && !defeatedEncounters.includes("skitterfin");
  pathEncounter.rotation.y += 0.015;
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

function addMemoryTide(): void {
  const marker = new THREE.Group();
  const base = new THREE.Mesh(
    new THREE.CylinderGeometry(0.55, 0.75, 0.35, 16),
    new THREE.MeshStandardMaterial({ color: 0x2f6f86, roughness: 0.5 })
  );
  const glow = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 16, 12),
    new THREE.MeshStandardMaterial({ color: 0x9ee8ff, emissive: 0x1f6f85, roughness: 0.25 })
  );
  base.position.y = 0.18;
  glow.position.y = 0.78;
  marker.add(base, glow);
  marker.position.set(-16.2, 0, 2.4);
  scene.add(marker);
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

function createPathEncounter(): THREE.Group {
  const group = new THREE.Group();
  const body = new THREE.Mesh(
    new THREE.ConeGeometry(0.7, 0.7, 7),
    new THREE.MeshStandardMaterial({ color: 0x61d6ff, emissive: 0x0b4156, roughness: 0.5 })
  );
  const shell = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 8, 8),
    new THREE.MeshStandardMaterial({ color: 0xd9f7ff, roughness: 0.8 })
  );
  body.rotation.x = Math.PI;
  body.position.y = 0.45;
  shell.position.y = 0.68;
  group.add(body, shell);
  group.position.set(-0.6, 0, -1.8);
  return group;
}
