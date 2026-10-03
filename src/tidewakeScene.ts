export type Vec2 = {
  x: number;
  z: number;
};

export type CameraVolume = {
  name: "Village Square" | "Beach Bend" | "Shellfiend Overlook";
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cameraPosition: [number, number, number];
  lookAt: [number, number, number];
};

type CircleBlocker = {
  center: Vec2;
  radius: number;
};

export const TIDEWAKE_CAMERA_VOLUMES: CameraVolume[] = [
  {
    name: "Village Square",
    minX: -18,
    maxX: -2,
    minZ: -6,
    maxZ: 6,
    cameraPosition: [-13, 8, 10],
    lookAt: [-10, 0, 0]
  },
  {
    name: "Beach Bend",
    minX: -2,
    maxX: 9,
    minZ: -6,
    maxZ: 6,
    cameraPosition: [2, 7, 11],
    lookAt: [4, 0, -1]
  },
  {
    name: "Shellfiend Overlook",
    minX: 9,
    maxX: 18,
    minZ: -6,
    maxZ: 6,
    cameraPosition: [15, 8, 9],
    lookAt: [14, 0, -2]
  }
];

const WALKABLE_MIN_X = -18;
const WALKABLE_MAX_X = 18;
const WALKABLE_MIN_Z = -6;
const WALKABLE_MAX_Z = 6;

const BLOCKERS: CircleBlocker[] = [
  { center: { x: -6, z: -1.2 }, radius: 1.4 },
  { center: { x: 2.5, z: 2.4 }, radius: 1.15 },
  { center: { x: 11.2, z: -0.6 }, radius: 1.35 }
];

export function getCameraVolume(position: Vec2): CameraVolume | undefined {
  return TIDEWAKE_CAMERA_VOLUMES.find(
    (volume) =>
      position.x >= volume.minX &&
      position.x <= volume.maxX &&
      position.z >= volume.minZ &&
      position.z <= volume.maxZ
  );
}

export function moveToward(current: Vec2, destination: Vec2, distance: number): Vec2 {
  const dx = destination.x - current.x;
  const dz = destination.z - current.z;
  const length = Math.hypot(dx, dz);

  if (length <= distance || length === 0) {
    return { ...destination };
  }

  return {
    x: Number((current.x + (dx / length) * distance).toFixed(4)),
    z: Number((current.z + (dz / length) * distance).toFixed(4))
  };
}

export function resolveWalkablePosition(position: Vec2): Vec2 {
  let resolved = {
    x: clamp(position.x, WALKABLE_MIN_X, WALKABLE_MAX_X),
    z: clamp(position.z, WALKABLE_MIN_Z, WALKABLE_MAX_Z)
  };

  for (const blocker of BLOCKERS) {
    const dx = resolved.x - blocker.center.x;
    const dz = resolved.z - blocker.center.z;
    const length = Math.hypot(dx, dz);

    if (length > 0 && length < blocker.radius) {
      resolved = {
        x: blocker.center.x + (dx / length) * blocker.radius,
        z: blocker.center.z + (dz / length) * blocker.radius
      };
    }
  }

  return {
    x: Number(clamp(resolved.x, WALKABLE_MIN_X, WALKABLE_MAX_X).toFixed(4)),
    z: Number(clamp(resolved.z, WALKABLE_MIN_Z, WALKABLE_MAX_Z).toFixed(4))
  };
}

export function getSceneProgress(position: Vec2): number {
  return Math.round(((position.x - WALKABLE_MIN_X) / (WALKABLE_MAX_X - WALKABLE_MIN_X)) * 100);
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
