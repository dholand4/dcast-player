import { useEffect, useState } from 'react';
import { IAccountCredentials } from '../@types/xtream';
import { IWatchProgress } from '../@types/storage';
import { storageService } from '../services/storageService';
import { xtreamService } from '../services/xtreamService';
import { cleanSeriesTitle } from '../utils/formatters';
import { findNewEpisode, ISeriesEpisodeRef } from '../utils/newEpisodes';

export interface INewEpisodeItem {
  seriesId: string;
  seriesTitle: string;
  posterUrl: string;
  episode: ISeriesEpisodeRef;
}

interface ISeriesSummary {
  name: string;
  cover: string;
  episodes: ISeriesEpisodeRef[];
}

// Consultas ao servidor IPTV: poucas séries e cache de 6h para não pesar
const SUMMARY_TTL_MS = 6 * 60 * 60 * 1000;
const MAX_SERIES_CHECKED = 8;

async function getSeriesSummary(
  account: IAccountCredentials,
  seriesId: string
): Promise<ISeriesSummary | null> {
  const cached = storageService.getCachedSeriesSummary<ISeriesSummary>(seriesId);
  if (cached && Date.now() - cached.fetchedAt < SUMMARY_TTL_MS) return cached.data;

  try {
    const info = await xtreamService.getSeriesInfo(account, seriesId);
    const episodes = Object.entries(info.episodes || {}).flatMap(([season, list]) =>
      list.map((episode) => ({
        id: String(episode.id),
        season: Number(episode.season ?? season),
        episode: Number(episode.episode_num),
        title: episode.title || '',
        added: Number(episode.added) || 0,
      }))
    );
    const summary: ISeriesSummary = {
      name: info.info?.name || '',
      cover: info.info?.cover || '',
      episodes,
    };
    storageService.saveCachedSeriesSummary(seriesId, summary);
    return summary;
  } catch {
    return cached?.data ?? null;
  }
}

function groupRecentSeries(history: IWatchProgress[]): Map<string, IWatchProgress[]> {
  const bySeries = new Map<string, IWatchProgress[]>();
  for (const item of history) {
    if (item.type !== 'series' || !item.seriesId) continue;
    const list = bySeries.get(item.seriesId) ?? [];
    list.push(item);
    bySeries.set(item.seriesId, list);
  }
  // getAllWatchProgress já vem do mais recente para o mais antigo
  return new Map(Array.from(bySeries.entries()).slice(0, MAX_SERIES_CHECKED));
}

/**
 * Séries que você acompanha e ganharam episódio novo depois da última vez que assistiu.
 * refreshKey: valor que muda quando o histórico muda (ex.: continueWatching).
 */
export function useNewEpisodes(account: IAccountCredentials | null, refreshKey: unknown) {
  const [newEpisodes, setNewEpisodes] = useState<INewEpisodeItem[]>([]);

  useEffect(() => {
    if (!account) {
      setNewEpisodes([]);
      return;
    }
    let isActive = true;

    (async () => {
      const found: INewEpisodeItem[] = [];
      for (const [seriesId, progress] of groupRecentSeries(storageService.getAllWatchProgress())) {
        const summary = await getSeriesSummary(account, seriesId);
        if (!isActive) return;
        const episode = summary ? findNewEpisode(summary.episodes, progress) : null;
        if (summary && episode) {
          found.push({
            seriesId,
            seriesTitle: summary.name || cleanSeriesTitle(progress[0].title),
            posterUrl: summary.cover || progress[0].posterUrl,
            episode,
          });
        }
      }
      if (isActive) setNewEpisodes(found);
    })();

    return () => {
      isActive = false;
    };
  }, [account, refreshKey]);

  return newEpisodes;
}
