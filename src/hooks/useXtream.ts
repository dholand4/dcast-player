import { useState, useCallback, useRef, useEffect } from 'react';
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

export function setCachedStreams(key: string, items: StreamItem[]) {
  streamCache.set(key, items);
}

export function setCachedCategories(key: string, cats: IXtreamCategory[]) {
  categoryCache.set(key, cats);
}

export function hasCachedStreams(key: string): boolean {
  return streamCache.has(key);
}

export function hasCachedCategories(key: string): boolean {
  return categoryCache.has(key);
}

export function useXtream(account: IAccountCredentials | null) {
  const [categories, setCategories] = useState<IXtreamCategory[]>([]);
  const [items, setItems] = useState<StreamItem[]>([]);
  const [seriesInfo, setSeriesInfo] = useState<IXtreamSeriesInfo | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingMessage, setLoadingMessage] = useState<string>('Carregando...');
  const [error, setError] = useState<string | null>(null);

  const activeRequestIdRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Clean up any pending in-flight request when unmounting
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

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

      // 2. If we have this specific category cached in RAM, return immediately
      if (!forceRefresh && streamCache.has(catKey)) {
        setItems(streamCache.get(catKey)!);
        setIsLoading(false);
        return;
      }

      // 3. Check local disk storage (specific category first, then full list)
      if (!forceRefresh) {
        const diskCatStreams = storageService.getCachedStreams<StreamItem[]>(catKey);
        if (diskCatStreams && diskCatStreams.length > 0) {
          streamCache.set(catKey, diskCatStreams);
          setItems(diskCatStreams);
          setIsLoading(false);
          return;
        }

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
          setIsLoading(false);
          return;
        }
      }

      // 4. Cancel any previous in-flight request to free bandwidth and avoid race conditions
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const requestId = ++activeRequestIdRef.current;

      // Clean state for the new category to prevent stale old-category items leaking
      setItems([]);
      setIsLoading(true);
      setError(null);

      const isAll = !categoryId || categoryId === 'all';
      setLoadingMessage(
        isAll
          ? type === 'live'
            ? 'Carregando todos os canais... Isso pode levar alguns instantes.'
            : type === 'movie'
            ? 'Carregando catálogo completo de filmes... Isso pode levar alguns instantes.'
            : 'Carregando catálogo completo de séries... Isso pode levar alguns instantes.'
          : type === 'live'
          ? 'Carregando lista de canais...'
          : type === 'movie'
          ? 'Carregando filmes...'
          : 'Carregando séries...'
      );

      try {
        let res: StreamItem[] = [];
        if (type === 'live') {
          res = await xtreamService.getLiveStreams(account, categoryId, controller.signal);
        } else if (type === 'movie') {
          res = await xtreamService.getVodStreams(account, categoryId, controller.signal);
        } else {
          res = await xtreamService.getSeries(account, categoryId, controller.signal);
        }

        // Discard result if superseded by a newer request
        if (requestId !== activeRequestIdRef.current) {
          return;
        }

        streamCache.set(catKey, res);
        storageService.saveCachedStreams(catKey, res);
        if (isAll) {
          storageService.saveCachedStreams(allKey, res);
        }
        setItems(res);
        setIsLoading(false);
      } catch (err: unknown) {
        // If aborted, silently ignore
        if (controller.signal.aborted || requestId !== activeRequestIdRef.current) {
          return;
        }
        const msg = err instanceof Error ? err.message : 'Falha ao carregar conteúdo.';
        setError(msg);
        setIsLoading(false);
      }
    },
    [account, getAccountKey]
  );

  const prefetchCategory = useCallback(
    async (type: 'live' | 'movie' | 'series', categoryId: string) => {
      if (!account || !categoryId || categoryId === 'all') return;
      const accKey = getAccountKey();
      const catKey = `${accKey}_streams_${type}_${categoryId}`;

      // 1. Already in RAM cache
      if (streamCache.has(catKey)) return;

      // 2. Already in Disk storage
      const diskCached = storageService.getCachedStreams<StreamItem[]>(catKey);
      if (diskCached && diskCached.length > 0) {
        streamCache.set(catKey, diskCached);
        return;
      }

      // 3. Silently fetch and cache in background without affecting active screen state
      try {
        let res: StreamItem[] = [];
        if (type === 'live') {
          res = await xtreamService.getLiveStreams(account, categoryId);
        } else if (type === 'movie') {
          res = await xtreamService.getVodStreams(account, categoryId);
        } else {
          res = await xtreamService.getSeries(account, categoryId);
        }
        if (res && res.length > 0) {
          streamCache.set(catKey, res);
          storageService.saveCachedStreams(catKey, res);
        }
      } catch {
        // Silent fail on background prefetch
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
    prefetchCategory,
    fetchSeriesInfo,
  };
}
