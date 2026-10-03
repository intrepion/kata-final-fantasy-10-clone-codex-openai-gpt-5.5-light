import { describe, expect, it } from "vitest";
import {
  attack,
  createTeachingBattle,
  getCurrentActor,
  getTurnTimeline,
  inspect,
  partySwap
} from "../../src/combat";

describe("teaching battle", () => {
  it("starts with Kael ready and a visible turn timeline", () => {
    const battle = createTeachingBattle();

    expect(getCurrentActor(battle).name).toBe("Kael");
    expect(getTurnTimeline(battle).map((combatant) => combatant.name)).toEqual([
      "Kael",
      "Skitterfin",
      "Maera",
      "Orun"
    ]);
  });

  it("uses action delay after an attack instead of round-robin turns", () => {
    const battle = attack(createTeachingBattle());

    expect(battle.combatants.find((combatant) => combatant.id === "skitterfin")?.hp).toBe(12);
    expect(getCurrentActor(battle).name).toBe("Skitterfin");
  });

  it("makes party swap a low-delay action that changes the active party member", () => {
    const battle = partySwap(createTeachingBattle(), "orun");

    expect(battle.combatants.find((combatant) => combatant.id === "orun")?.active).toBe(true);
    expect(getCurrentActor(battle).name).toBe("Skitterfin");
    expect(getTurnTimeline(battle).map((combatant) => combatant.name)).toContain("Kael");
  });

  it("reveals inspect hints through the command menu", () => {
    const battle = inspect(createTeachingBattle());

    expect(battle.inspected).toContain("skitterfin");
    expect(battle.log[0]).toContain("Kael can catch it");
  });
});
