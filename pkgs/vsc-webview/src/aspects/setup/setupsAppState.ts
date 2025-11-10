export interface SetupsAppState {
  expandedIndex: number | null;
}

export function buildSetupsAppState(): SetupsAppState {
  return {
    expandedIndex: null,
  };
}
