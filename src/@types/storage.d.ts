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

export interface ICustomCategoryFolder {
  id: string;
  name: string;
  type: ContentType;
  streamIds: string[];
  createdAt: number;
}

