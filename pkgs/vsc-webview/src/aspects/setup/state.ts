export interface SetupsState {
  expandedIndex: number | null;
}

export function buildSetupsState(): SetupsState {
  return {
    expandedIndex: null,
  };
}
