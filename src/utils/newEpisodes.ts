import { IWatchProgress } from '../@types/storage';

export interface ISeriesEpisodeRef {
  id: string;
  season: number;
  episode: number;
  title: string;
  /** Quando o episódio entrou no servidor (segundos, campo "added" do Xtream) */
  added: number;
}

function hasRealProgress(progress: IWatchProgress): boolean {
  return progress.currentTime > 0 || progress.percentage > 0;
}

function compareEpisodes(
  a: { season: number; episode: number },
  b: { season: number; episode: number }
): number {
  return a.season - b.season || a.episode - b.episode;
}

/**
 * Próximo episódio que entrou no servidor depois da última vez que a série foi assistida.
 * Retorna null se a série ainda aparece no "Continuar Assistindo" (evita repetir o item).
 */
export function findNewEpisode(
  episodes: ISeriesEpisodeRef[],
  seriesProgress: IWatchProgress[]
): ISeriesEpisodeRef | null {
  const watched = seriesProgress.filter(hasRealProgress);
  if (watched.length === 0 || episodes.length === 0) return null;

  const latest = watched.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
  if (!latest.hiddenFromContinue && latest.percentage < 98) return null;

  const furthest = watched.reduce((a, b) =>
    compareEpisodes(
      { season: b.seasonNumber ?? 0, episode: b.episodeNumber ?? 0 },
      { season: a.seasonNumber ?? 0, episode: a.episodeNumber ?? 0 }
    ) > 0
      ? b
      : a
  );
  const furthestRef = { season: furthest.seasonNumber ?? 0, episode: furthest.episodeNumber ?? 0 };
  const watchedIds = new Set(watched.map((item) => String(item.id)));

  const next = [...episodes]
    .sort(compareEpisodes)
    .find((episode) => compareEpisodes(episode, furthestRef) > 0 && !watchedIds.has(episode.id));

  if (!next || next.added * 1000 <= latest.updatedAt) return null;
  return next;
}
