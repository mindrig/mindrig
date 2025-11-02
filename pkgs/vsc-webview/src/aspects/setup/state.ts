export interface SetupsState {
  expandedSetupIndex: number | null;
}

export function buildSetupsState(): SetupsState {
  return {
    expandedSetupIndex: null,
  };
}
