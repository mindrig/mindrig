export interface SetupsClientState {
  expandedIndex: number | null;
}

export function buildSetupsClientState(): SetupsClientState {
  return {
    expandedIndex: null,
  };
}
