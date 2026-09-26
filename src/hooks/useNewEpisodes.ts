import { useEffect, useState } from 'react';
import { IAccountCredentials } from '../@types/xtream';
import { IWatchProgress } from '../@types/storage';
import { storageService } from '../services/storageService';
import { xtreamService } from '../services/xtreamService';
import { cleanSeriesTitle } from '../utils/formatters';
import {
  ISeriesEpisodeRef,
  ISeriesTracking,
  pickNewEpisodes,
  updateSeriesTracking,
} from '../utils/newEpisodes';

export interface INewEpisodeItem {
  seriesId: string;
  seriesTitle: string;
  posterUrl: string;
  /** Primeiro episódio novo ainda não assistido */
  episode: ISeriesEpisodeRef;
  /** Quantos episódios novos a série tem */
  newCount: number;
  detectedAt: number;
}

interface ISeriesSummary {
  name: string;
  cover: string;
  episodes: ISeriesEpisodeRef[];
}

interface IFollowedSeries {
  seriesId: string;
  fallbackTitle: string;
  fallbackPoster: string;
  progress: IWatchProgress[];
}

// Consultas ao servidor IPTV só ao abrir a Home, com cache por série para não pesar
export const SUMMARY_TTL_MS = 3 * 60 * 60 * 1000;
const MAX_SERIES_CHECKED = 30;

async function loadSeriesSummary(
  account: IAccountCredentials,
  seriesId: string
): Promise<{ summary: ISeriesSummary | null; isFresh: boolean }> {
  const cached = storageService.getCachedSeriesSummary<ISeriesSummary>(seriesId);
  if (cached && Date.now() - cached.fetchedAt < SUMMARY_TTL_MS) {
    return { summary: cached.data, isFresh: false };
  }

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
    return { summary, isFresh: true };
  } catch {
    return { summary: cached?.data ?? null, isFresh: false };
  }
}

/** Séries favoritas do perfil primeiro, depois as assistidas recentemente */
function getFollowedSeries(): IFollowedSeries[] {
  const progressBySeries = new Map<string, IWatchProgress[]>();
  // getAllWatchProgress já vem do mais recente para o mais antigo
  for (const item of storageService.getAllWatchProgress()) {
    if (item.type !== 'series' || !item.seriesId) continue;
    const list = progressBySeries.get(item.seriesId) ?? [];
    list.push(item);
    progressBySeries.set(item.seriesId, list);
  }

  const followed = new Map<string, IFollowedSeries>();
  for (const favorite of storageService.getFavorites()) {
    if (favorite.type !== 'series') continue;
    const seriesId = String(favorite.id);
    followed.set(seriesId, {
      seriesId,
      fallbackTitle: favorite.name,
      fallbackPoster: favorite.posterUrl,
      progress: progressBySeries.get(seriesId) ?? [],
    });
  }
  for (const [seriesId, progress] of progressBySeries) {
    if (followed.has(seriesId)) continue;
    followed.set(seriesId, {
      seriesId,
      fallbackTitle: cleanSeriesTitle(progress[0].title),
      fallbackPoster: progress[0].posterUrl,
      progress,
    });
  }
  return Array.from(followed.values()).slice(0, MAX_SERIES_CHECKED);
}

/**
 * Séries acompanhadas (favoritas ou assistidas) que ganharam episódio desde a consulta
 * anterior. O episódio fica em destaque até o perfil assistir.
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
      for (const series of getFollowedSeries()) {
        const { summary, isFresh } = await loadSeriesSummary(account, series.seriesId);
        if (!isActive) return;
        if (!summary) continue;

        const now = Date.now();
        let tracking = storageService.getSeriesTracking<ISeriesTracking>(series.seriesId);
        // Só uma consulta nova ao servidor pode revelar episódio que chegou
        if (!tracking || isFresh) {
          tracking = updateSeriesTracking(tracking, summary.episodes, series.progress, now);
          storageService.saveSeriesTracking(series.seriesId, tracking);
        }

        const pending = pickNewEpisodes(summary.episodes, tracking, series.progress, now);
        if (pending.length === 0) continue;
        const pendingIds = new Set(pending.map((episode) => episode.id));
        found.push({
          seriesId: series.seriesId,
          seriesTitle: summary.name || series.fallbackTitle,
          posterUrl: summary.cover || series.fallbackPoster,
          episode: pending[0],
          newCount: pending.length,
          detectedAt: Math.max(
            ...tracking.pending.filter((item) => pendingIds.has(item.id)).map((item) => item.detectedAt)
          ),
        });
      }
      // O que chegou por último aparece primeiro
      if (isActive) setNewEpisodes(found.sort((a, b) => b.detectedAt - a.detectedAt));
    })();

    return () => {
      isActive = false;
    };
  }, [account, refreshKey]);

  return newEpisodes;
}
