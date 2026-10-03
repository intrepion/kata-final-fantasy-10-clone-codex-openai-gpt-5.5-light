export type CombatantId = "kael" | "maera" | "orun" | "skitterfin";

export type Side = "party" | "enemy";

export type Combatant = {
  id: CombatantId;
  name: string;
  side: Side;
  hp: number;
  maxHp: number;
  speed: number;
  delay: number;
  weakness?: "fast" | "elemental" | "breaker";
  active: boolean;
};

export type BattleState = {
  combatants: Combatant[];
  log: string[];
  inspected: CombatantId[];
  won: boolean;
};

const ATTACK_DELAY = 50;
const SWAP_DELAY = 24;

export function createTeachingBattle(): BattleState {
  return {
    combatants: [
      createPartyMember("kael", "Kael", 40, 18, true),
      createPartyMember("maera", "Maera", 32, 12, false),
      createPartyMember("orun", "Orun", 48, 9, false),
      {
        id: "skitterfin",
        name: "Skitterfin",
        side: "enemy",
        hp: 30,
        maxHp: 30,
        speed: 15,
        delay: 20,
        weakness: "fast",
        active: true
      }
    ],
    log: ["A Skitterfin darts across the beach."],
    inspected: [],
    won: false
  };
}

export function getTurnTimeline(state: BattleState): Combatant[] {
  return [...state.combatants]
    .filter((combatant) => combatant.hp > 0)
    .sort((a, b) => a.delay - b.delay || b.speed - a.speed);
}

export function getCurrentActor(state: BattleState): Combatant {
  return getTurnTimeline(state)[0];
}

export function attack(state: BattleState): BattleState {
  if (state.won) return state;

  const actor = getCurrentActor(state);
  if (actor.side === "enemy") {
    return enemyTurn(state, actor);
  }

  const target = state.combatants.find((combatant) => combatant.side === "enemy" && combatant.hp > 0);
  if (!target) return state;

  const damage = actor.id === "kael" && target.weakness === "fast" ? 18 : 9;
  return applyDamage(state, actor.id, target.id, damage, ATTACK_DELAY, `${actor.name} strikes ${target.name}.`);
}

export function inspect(state: BattleState): BattleState {
  const actor = getCurrentActor(state);
  const target = state.combatants.find((combatant) => combatant.side === "enemy" && combatant.hp > 0);

  if (!target) return state;

  return {
    ...advanceActor(state, actor.id, 24),
    inspected: state.inspected.includes(target.id) ? state.inspected : [...state.inspected, target.id],
    log: [`${target.name}: quick fins and light shell. Kael can catch it.`, ...state.log]
  };
}

export function partySwap(state: BattleState, nextId: CombatantId): BattleState {
  const current = getCurrentActor(state);
  const next = state.combatants.find((combatant) => combatant.id === nextId);

  if (current.side !== "party" || !next || next.side !== "party" || next.hp <= 0) {
    return state;
  }

  const advanced = advanceActor(state, current.id, SWAP_DELAY);

  return {
    ...advanced,
    combatants: advanced.combatants.map((combatant) =>
      combatant.side === "party"
        ? { ...combatant, active: combatant.id === nextId }
        : combatant
    ),
    log: [`${next.name} steps into the front line.`, ...state.log]
  };
}

function enemyTurn(state: BattleState, actor: Combatant): BattleState {
  const target = state.combatants.find((combatant) => combatant.side === "party" && combatant.active);
  if (!target) return state;

  return applyDamage(state, actor.id, target.id, 7, ATTACK_DELAY, `${actor.name} snaps at ${target.name}.`);
}

function applyDamage(
  state: BattleState,
  actorId: CombatantId,
  targetId: CombatantId,
  damage: number,
  delay: number,
  message: string
): BattleState {
  const damaged = state.combatants.map((combatant) =>
    combatant.id === targetId ? { ...combatant, hp: Math.max(0, combatant.hp - damage) } : combatant
  );
  const advanced = normalizeDelays(
    damaged.map((combatant) =>
      combatant.id === actorId ? { ...combatant, delay: combatant.delay + delay } : combatant
    )
  );
  const enemiesAlive = advanced.some((combatant) => combatant.side === "enemy" && combatant.hp > 0);

  return {
    ...state,
    combatants: advanced,
    won: !enemiesAlive,
    log: [message, !enemiesAlive ? "The path encounter is defeated." : undefined, ...state.log].filter(
      Boolean
    ) as string[]
  };
}

function advanceActor(state: BattleState, actorId: CombatantId, delay: number): BattleState {
  return {
    ...state,
    combatants: normalizeDelays(
      state.combatants.map((combatant) =>
        combatant.id === actorId ? { ...combatant, delay: combatant.delay + delay } : combatant
      )
    )
  };
}

function normalizeDelays(combatants: Combatant[]): Combatant[] {
  const living = combatants.filter((combatant) => combatant.hp > 0);
  const minDelay = Math.min(...living.map((combatant) => combatant.delay));

  return combatants.map((combatant) => ({
    ...combatant,
    delay: combatant.hp > 0 ? combatant.delay - minDelay : combatant.delay
  }));
}

function createPartyMember(
  id: CombatantId,
  name: string,
  maxHp: number,
  speed: number,
  active: boolean
): Combatant {
  return {
    id,
    name,
    side: "party",
    hp: maxHp,
    maxHp,
    speed,
    delay: active ? 0 : 35,
    active
  };
}
