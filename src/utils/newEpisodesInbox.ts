export interface IInboxState {
  seen: string[];
  dismissed: string[];
}

export interface IInboxItem {
  seriesId: string;
  episodeIds: string[];
}

// Limite para a lista não crescer para sempre; episódios antigos saem das novidades sozinhos
const MAX_STORED_KEYS = 500;

function keysOf(item: IInboxItem): string[] {
  return item.episodeIds.map((episodeId) => `${item.seriesId}:${episodeId}`);
}

function keep(keys: string[]): string[] {
  return Array.from(new Set(keys)).slice(-MAX_STORED_KEYS);
}

/** Séries com pelo menos um episódio novo que não foi dispensado */
export function getVisibleItems<T extends IInboxItem>(items: T[], state: IInboxState): T[] {
  const dismissed = new Set(state.dismissed);
  return items.filter((item) => keysOf(item).some((key) => !dismissed.has(key)));
}

/** Quantas séries têm episódio novo que o perfil ainda não viu no painel */
export function countUnseen(items: IInboxItem[], state: IInboxState): number {
  const seen = new Set(state.seen);
  return items.filter((item) => keysOf(item).some((key) => !seen.has(key))).length;
}

/** Abrir o painel conta como ver tudo o que está nele (zera o selo) */
export function markSeen(items: IInboxItem[], state: IInboxState): IInboxState {
  return { ...state, seen: keep([...state.seen, ...items.flatMap(keysOf)]) };
}

/** Tira a série do painel até chegar outro episódio novo */
export function dismiss(item: IInboxItem, state: IInboxState): IInboxState {
  const keys = keysOf(item);
  return {
    seen: keep([...state.seen, ...keys]),
    dismissed: keep([...state.dismissed, ...keys]),
  };
}
