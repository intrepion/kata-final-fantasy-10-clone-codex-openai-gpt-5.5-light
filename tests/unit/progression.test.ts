import { describe, expect, it } from "vitest";
import { awardEchoShard, createProgressionState, unlockBoardNode } from "../../src/progression";
import { createSaveSnapshot, parseSaveSnapshot, serializeSaveSnapshot } from "../../src/saveSnapshot";

describe("progression board and save snapshot", () => {
  it("awards Echo Shards and spends one on a board node", () => {
    const progression = awardEchoShard(createProgressionState());
    const unlocked = unlockBoardNode(progression, "quick-step");

    expect(unlocked.echoShards).toBe(0);
    expect(unlocked.unlockedNodes).toEqual(["quick-step"]);
  });

  it("does not unlock the same board node twice", () => {
    const progression = unlockBoardNode(awardEchoShard(createProgressionState()), "quick-step");

    expect(unlockBoardNode(progression, "quick-step")).toEqual(progression);
  });

  it("round-trips a Memory Tide save snapshot", () => {
    const progression = unlockBoardNode(awardEchoShard(createProgressionState()), "quick-step");
    const snapshot = createSaveSnapshot({ x: -14, z: 0 }, ["skitterfin"], progression);

    expect(parseSaveSnapshot(serializeSaveSnapshot(snapshot))).toEqual(snapshot);
  });
});
