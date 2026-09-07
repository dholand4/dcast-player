import { useState, useCallback } from 'react';
import {
  IAccountCredentials,
  IXtreamCategory,
  IXtreamLiveStream,
  IXtreamVodStream,
  IXtreamSeries,
  IXtreamSeriesInfo,
} from '../@types/xtream';
import { xtreamService } from '../services/xtreamService';
import { storageService } from '../services/storageService';

type StreamItem = IXtreamLiveStream | IXtreamVodStream | IXtreamSeries;

// Module-level in-memory cache across hook instances
const streamCache = new Map<string, StreamItem[]>();
const categoryCache = new Map<string, IXtreamCategory[]>();
const seriesInfoCache = new Map<string, IXtreamSeriesInfo>();

export function clearXtreamCache() {
  streamCache.clear();
  categoryCache.clear();
  seriesInfoCache.clear();
}

export function useXtream(account: IAccountCredentials | null) {
  const [categories, setCategories] = useState<IXtreamCategory[]>([]);
  const [items, setItems] = useState<StreamItem[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<IXtreamSeriesInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Carregando...');
  const [error, setError] = useState<string | null>(null);

  const getAccountKey = useCallback(() => {
    if (!account) return '';
    return `${account.serverUrl}_${account.username}`;
  }, [account]);

  const fetchCategories = useCallback(
    async (type: 'live' | 'movie' | 'series'): Promise<IXtreamCategory[]> => {
      if (!account) return [];
      const cacheKey = `${getAccountKey()}_cat_${type}`;

      // 1. RAM Cache check
      if (categoryCache.has(cacheKey)) {
        const cached = categoryCache.get(cacheKey)!;
        setCategories(cached);
        return cached;
      }

      // 2. Disk Storage check
      const diskCategories = storageService.getCachedCategories<IXtreamCategory[]>(cacheKey);
      if (diskCategories && diskCategories.length > 0) {
        categoryCache.set(cacheKey, diskCategories);
        setCategories(diskCategories);
        return diskCategories;
      }

      setIsLoading(true);
      setError(null);

      try {
        let res: IXtreamCategory[] = [];
        if (type === 'live') {
          res = await xtreamService.getLiveCategories(account);
        } else if (type === 'movie') {
          res = await xtreamService.getVodCategories(account);
        } else {
          res = await xtreamService.getSeriesCategories(account);
        }
        categoryCache.set(cacheKey, res);
        storageService.saveCachedCategories(cacheKey, res);
        setCategories(res);
        setIsLoading(false);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao buscar categorias.';
        setError(msg);
        setIsLoading(false);
        return [];
      }
    },
    [account, getAccountKey]
  );

  const fetchStreams = useCallback(
    async (
      type: 'live' | 'movie' | 'series',
      categoryId?: string,
      forceRefresh = false
    ) => {
      if (!account) return;
      const accKey = getAccountKey();
      const allKey = `${accKey}_streams_${type}_all`;
      const catKey = `${accKey}_streams_${type}_${categoryId || 'all'}`;

      // 1. If we already have the full list in RAM, filter instantly
      if (!forceRefresh && streamCache.has(allKey)) {
        const allItems = streamCache.get(allKey)!;
        if (!categoryId || categoryId === 'all') {
          setItems(allItems);
        } else {
          const filtered = allItems.filter(
            (item) => String(item.category_id) === String(categoryId)
          );
          setItems(filtered);
        }
        return;
      }

      // 2. If saved on local disk, load immediately from disk
      if (!forceRefresh) {
        const diskStreams = storageService.getCachedStreams<StreamItem[]>(allKey);
        if (diskStreams && diskStreams.length > 0) {
          streamCache.set(allKey, diskStreams);
          if (!categoryId || categoryId === 'all') {
            setItems(diskStreams);
          } else {
            const filtered = diskStreams.filter(
              (item) => String(item.category_id) === String(categoryId)
            );
            setItems(filtered);
          }
          return;
        }
      }

      setIsLoading(true);
      setError(null);
      setLoadingMessage(
        type === 'live'
          ? 'Carregando lista de canais...'
          : type === 'movie'
          ? 'Carregando catálogo de filmes...'
          : 'Carregando séries...'
      );

      try {
        let res: StreamItem[] = [];
        if (type === 'live') {
          res = await xtreamService.getLiveStreams(account, categoryId);
        } else if (type === 'movie') {
          res = await xtreamService.getVodStreams(account, categoryId);
        } else {
          res = await xtreamService.getSeries(account, categoryId);
        }

        streamCache.set(catKey, res);
        if (!categoryId || categoryId === 'all') {
          storageService.saveCachedStreams(allKey, res);
        }
        setItems(res);
        setIsLoading(false);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao carregar conteúdo.';
        setError(msg);
        setIsLoading(false);
      }
    },
    [account, getAccountKey]
  );

  const fetchSeriesInfo = useCallback(
    async (seriesId: string | number): Promise<IXtreamSeriesInfo | null> => {
      if (!account) return null;
      const cacheKey = `${getAccountKey()}_series_${seriesId}`;
      if (seriesInfoCache.has(cacheKey)) {
        const cached = seriesInfoCache.get(cacheKey)!;
        setSeriesInfo(cached);
        return cached;
      }

      setIsLoading(true);
      setError(null);

      try {
        const res = await xtreamService.getSeriesInfo(account, seriesId);
        seriesInfoCache.set(cacheKey, res);
        setSeriesInfo(res);
        setIsLoading(false);
        return res;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Falha ao carregar informações da série.';
        setError(msg);
        setIsLoading(false);
        return null;
      }
    },
    [account, getAccountKey]
  );

  return {
    categories,
    items,
    seriesInfo,
    isLoading,
    loadingMessage,
    error,
    fetchCategories,
    fetchStreams,
    fetchSeriesInfo,
  };
}

