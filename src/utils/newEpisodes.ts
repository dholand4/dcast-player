import { IWatchProgress } from '../@types/storage';

export interface ISeriesEpisodeRef {
  id: string;
  season: number;
  episode: number;
  title: string;
  /** Quando o episódio entrou no servidor (segundos, campo "added" do Xtream; 0 se não informado) */
  added: number;
}

export interface IPendingEpisode {
  id: string;
  /** Quando o app percebeu que o episódio chegou */
  detectedAt: number;
}

/** O que o app sabe de uma série entre uma consulta e outra (guardado no aparelho) */
export interface ISeriesTracking {
  knownIds: string[];
  pending: IPendingEpisode[];
}

// Um episódio novo deixa de ser destaque depois disso, mesmo que não seja assistido
export const PENDING_EPISODE_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function hasRealProgress(progress: IWatchProgress): boolean {
  return progress.currentTime > 0 || progress.percentage > 0;
}

export function compareEpisodes(
  a: { season: number; episode: number },
  b: { season: number; episode: number }
): number {
  return a.season - b.season || a.episode - b.episode;
}

/**
 * Episódios depois do mais avançado já visto que entraram no servidor depois da última
 * vez que a série foi assistida. Usa o campo "added"; se o servidor não informa, não acha nada.
 */
export function findEpisodesAddedSinceLastWatch(
  episodes: ISeriesEpisodeRef[],
  seriesProgress: IWatchProgress[]
): ISeriesEpisodeRef[] {
  const watched = seriesProgress.filter(hasRealProgress);
  if (watched.length === 0) return [];

  const latest = watched.reduce((a, b) => (b.updatedAt > a.updatedAt ? b : a));
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

  return episodes
    .filter(
      (episode) =>
        compareEpisodes(episode, furthestRef) > 0 &&
        !watchedIds.has(episode.id) &&
        episode.added * 1000 > latest.updatedAt
    )
    .sort(compareEpisodes);
}

/**
 * Atualiza o acompanhamento com a lista atual do servidor: o que não estava na consulta
 * anterior entra como novo. Na primeira consulta da série, só o campo "added" indica novidade.
 */
export function updateSeriesTracking(
  previous: ISeriesTracking | null,
  episodes: ISeriesEpisodeRef[],
  seriesProgress: IWatchProgress[],
  now: number
): ISeriesTracking {
  const currentIds = episodes.map((episode) => episode.id);

  if (!previous) {
    return {
      knownIds: currentIds,
      pending: findEpisodesAddedSinceLastWatch(episodes, seriesProgress).map((episode) => ({
        id: episode.id,
        detectedAt: now,
      })),
    };
  }

  // Resposta vazia costuma ser falha do servidor: não mexe no que já se sabia
  if (currentIds.length === 0) return previous;

  const onServer = new Set(currentIds);
  const known = new Set(previous.knownIds);
  const kept = previous.pending.filter(
    (item) => onServer.has(item.id) && now - item.detectedAt < PENDING_EPISODE_TTL_MS
  );
  const keptIds = new Set(kept.map((item) => item.id));
  const arrived = currentIds
    .filter((id) => !known.has(id) && !keptIds.has(id))
    .map((id) => ({ id, detectedAt: now }));

  // A lista conhecida só cresce: episódio que some e volta não conta como novo
  return {
    knownIds: Array.from(new Set([...previous.knownIds, ...currentIds])),
    pending: [...kept, ...arrived],
  };
}

/** Episódios novos que o perfil ainda não assistiu, em ordem de temporada/episódio */
export function pickNewEpisodes(
  episodes: ISeriesEpisodeRef[],
  tracking: ISeriesTracking,
  seriesProgress: IWatchProgress[],
  now: number
): ISeriesEpisodeRef[] {
  const watchedIds = new Set(seriesProgress.filter(hasRealProgress).map((item) => String(item.id)));
  const pendingIds = new Set(
    tracking.pending
      .filter((item) => now - item.detectedAt < PENDING_EPISODE_TTL_MS)
      .map((item) => item.id)
  );
  return episodes
    .filter((episode) => pendingIds.has(episode.id) && !watchedIds.has(episode.id))
    .sort(compareEpisodes);
}
