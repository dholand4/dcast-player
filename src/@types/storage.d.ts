export type ContentType = 'live' | 'movie' | 'series';

export interface IWatchProgress {
  id: string;
  seriesId?: string;
  title: string;
  posterUrl: string;
  type: ContentType;
  seasonNumber?: number;
  episodeNumber?: number;
  currentTime: number;
  duration: number;
  percentage: number;
  updatedAt: number;
  streamUrl?: string;
  /** Removido da fileira "Continuar Assistindo", mas mantido no histórico de assistidos */
  hiddenFromContinue?: boolean;
}

export interface IFavoriteItem {
  id: string;
  name: string;
  posterUrl: string;
  type: ContentType;
  categoryId: string;
  rating?: string;
  addedAt: number;
}

/** Estado da sincronização dos favoritos deste aparelho com a nuvem */
export interface IFavoritesSyncState {
  /** Ids que estavam na nuvem na última sincronização; null se este aparelho ainda não sincronizou */
  syncedIds: string[] | null;
  /** Removidos neste aparelho e ainda não confirmados como apagados na nuvem */
  removedIds: string[];
}

export interface ICustomCategoryFolder {
  id: string;
  name: string;
  type: ContentType;
  streamIds: string[];
  createdAt: number;
}

export interface IProfile {
  id: string;
  name: string;
  /** Cor do avatar (hex) */
  color: string;
  createdAt: number;
  updatedAt: number;
  /** Perfil removido; mantido para a remoção sincronizar entre aparelhos */
  deleted?: boolean;
}
