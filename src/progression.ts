export type BoardNodeId = "quick-step" | "tide-spark" | "guard-break";

export type ProgressionState = {
  echoShards: number;
  unlockedNodes: BoardNodeId[];
};

export type BoardNode = {
  id: BoardNodeId;
  label: string;
  kind: "stat" | "command" | "role-drift";
  cost: number;
  description: string;
};

export const FIRST_BOARD_NODES: BoardNode[] = [
  {
    id: "quick-step",
    label: "Quick Step",
    kind: "stat",
    cost: 1,
    description: "Kael gains sharper footwork for the next leg of the pilgrimage."
  },
  {
    id: "tide-spark",
    label: "Tide Spark",
    kind: "command",
    cost: 1,
    description: "Maera learns the first hint of an elemental command."
  },
  {
    id: "guard-break",
    label: "Guard Break",
    kind: "role-drift",
    cost: 1,
    description: "Kael starts learning how Orun opens armored foes."
  }
];

export function createProgressionState(): ProgressionState {
  return {
    echoShards: 0,
    unlockedNodes: []
  };
}

export function awardEchoShard(state: ProgressionState): ProgressionState {
  return {
    ...state,
    echoShards: state.echoShards + 1
  };
}

export function unlockBoardNode(state: ProgressionState, nodeId: BoardNodeId): ProgressionState {
  const node = FIRST_BOARD_NODES.find((candidate) => candidate.id === nodeId);

  if (!node || state.unlockedNodes.includes(nodeId) || state.echoShards < node.cost) {
    return state;
  }

  return {
    echoShards: state.echoShards - node.cost,
    unlockedNodes: [...state.unlockedNodes, nodeId]
  };
}
