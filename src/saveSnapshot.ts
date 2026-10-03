import type { BoardNodeId, ProgressionState } from "./progression";
import type { Vec2 } from "./tidewakeScene";

export type SaveSnapshot = {
  scenePosition: Vec2;
  defeatedEncounters: string[];
  partyHp: Record<string, number>;
  echoShards: number;
  unlockedNodes: BoardNodeId[];
};

export function createSaveSnapshot(
  scenePosition: Vec2,
  defeatedEncounters: string[],
  progression: ProgressionState,
  partyHp: Record<string, number>
): SaveSnapshot {
  return {
    scenePosition,
    defeatedEncounters,
    partyHp,
    echoShards: progression.echoShards,
    unlockedNodes: progression.unlockedNodes
  };
}

export function serializeSaveSnapshot(snapshot: SaveSnapshot): string {
  return JSON.stringify(snapshot);
}

export function parseSaveSnapshot(raw: string | null): SaveSnapshot | undefined {
  if (!raw) {
    return undefined;
  }

  try {
    const parsed = JSON.parse(raw) as SaveSnapshot;

    if (!parsed.scenePosition || !Array.isArray(parsed.unlockedNodes)) {
      return undefined;
    }

    return parsed;
  } catch {
    return undefined;
  }
}
