import { describe, expect, it } from "vitest";
import {
  getCameraVolume,
  moveToward,
  resolveWalkablePosition,
  TIDEWAKE_CAMERA_VOLUMES
} from "../../src/tidewakeScene";

describe("Tidewake walking slice", () => {
  it("selects authored camera volumes along the pilgrimage path", () => {
    expect(getCameraVolume({ x: -8, z: 0 })?.name).toBe("Village Square");
    expect(getCameraVolume({ x: 4, z: -2 })?.name).toBe("Beach Bend");
    expect(getCameraVolume({ x: 14, z: -4 })?.name).toBe("Shellfiend Overlook");
    expect(TIDEWAKE_CAMERA_VOLUMES).toHaveLength(3);
  });

  it("moves Kael toward a destination without overshooting", () => {
    const next = moveToward({ x: 0, z: 0 }, { x: 3, z: 4 }, 2);

    expect(next).toEqual({ x: 1.2, z: 1.6 });
    expect(moveToward(next, { x: 1.4, z: 1.7 }, 2)).toEqual({ x: 1.4, z: 1.7 });
  });

  it("keeps Kael inside the walkable path and outside circular blockers", () => {
    expect(resolveWalkablePosition({ x: 50, z: 50 })).toEqual({ x: 18, z: 6 });

    const resolved = resolveWalkablePosition({ x: -6, z: -1.1 });
    expect(Math.hypot(resolved.x - -6, resolved.z - -1.2)).toBeGreaterThanOrEqual(1.4);
  });
});
