import { IAccountCredentials, IXtreamCategory, IXtreamLiveStream } from '../@types/xtream';
import { xtreamService } from './xtreamService';
import { storageService } from './storageService';
import { setCachedStreams, setCachedCategories, hasCachedStreams } from '../hooks/useXtream';

// Throttle interval: 5 minutes between background syncs unless forced
const SYNC_THROTTLE_MS = 5 * 60 * 1000;
let lastSyncTimestamp = 0;
let activeController: AbortController | null = null;
let isSyncingLive = false;

export const catalogSyncService = {
  isSyncing(): boolean {
    return isSyncingLive;
  },

  resetThrottle(): void {
    lastSyncTimestamp = 0;
  },

  /**
   * Puxa em segundo plano os canais ao vivo (categorias e streams)
   * para que no momento do clique o usuário tenha acesso em 0.1s.
   */
  async syncLiveCatalog(
    account: IAccountCredentials,
    force = false
  ): Promise<boolean> {
    if (!account || !account.serverUrl || !account.username) return false;
    const now = Date.now();
    if (!force && now - lastSyncTimestamp < SYNC_THROTTLE_MS && isSyncingLive) {
      return false;
    }

    const accKey = `${account.serverUrl}_${account.username}`;
    const catKey = `${accKey}_cat_live`;
    const allKey = `${accKey}_streams_live_all`;

    isSyncingLive = true;
    lastSyncTimestamp = now;

    if (activeController) {
      activeController.abort();
    }
    activeController = new AbortController();
    const { signal } = activeController;

    try {
      // 1. Puxa categorias ao vivo
      const categories = await xtreamService.getLiveCategories(account);
      if (signal.aborted) return false;
      if (categories && categories.length > 0) {
        setCachedCategories(catKey, categories);
        storageService.saveCachedCategories(catKey, categories);
      }

      // 2. Puxa streams ao vivo (onde estão os canais de TV e jogos do dia)
      const streams = await xtreamService.getLiveStreams(account, undefined, signal);
      if (signal.aborted) return false;
      if (streams && streams.length > 0) {
        setCachedStreams(allKey, streams);
        storageService.saveCachedStreams(allKey, streams);
      }

      return true;
    } catch {
      // Falha silenciosa em background para não atrapalhar o usuário
      return false;
    } finally {
      isSyncingLive = false;
    }
  },

  /**
   * Puxa em segundo plano as categorias e o catálogo de séries
   * com delay suave de 3s após a TV ao vivo.
   */
  async syncSeriesCatalog(
    account: IAccountCredentials,
    signal?: AbortSignal
  ): Promise<boolean> {
    if (!account || !account.serverUrl || !account.username) return false;
    if (signal?.aborted) return false;

    const accKey = `${account.serverUrl}_${account.username}`;
    const seriesCatKey = `${accKey}_cat_series`;
    const seriesAllKey = `${accKey}_streams_series_all`;

    try {
      const categories = await xtreamService.getSeriesCategories(account);
      if (signal?.aborted) return false;
      if (categories && categories.length > 0) {
        setCachedCategories(seriesCatKey, categories);
        storageService.saveCachedCategories(seriesCatKey, categories);
      }

      const series = await xtreamService.getSeries(account, undefined, signal);
      if (signal?.aborted) return false;
      if (series && series.length > 0) {
        setCachedStreams(seriesAllKey, series);
        storageService.saveCachedStreams(seriesAllKey, series);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Puxa em segundo plano as categorias e o catálogo de filmes
   * com delay suave de 6s após os canais e séries.
   */
  async syncMovieCatalog(
    account: IAccountCredentials,
    signal?: AbortSignal
  ): Promise<boolean> {
    if (!account || !account.serverUrl || !account.username) return false;
    if (signal?.aborted) return false;

    const accKey = `${account.serverUrl}_${account.username}`;
    const movieCatKey = `${accKey}_cat_movie`;
    const movieAllKey = `${accKey}_streams_movie_all`;

    try {
      const categories = await xtreamService.getVodCategories(account);
      if (signal?.aborted) return false;
      if (categories && categories.length > 0) {
        setCachedCategories(movieCatKey, categories);
        storageService.saveCachedCategories(movieCatKey, categories);
      }

      const movies = await xtreamService.getVodStreams(account, undefined, signal);
      if (signal?.aborted) return false;
      if (movies && movies.length > 0) {
        setCachedStreams(movieAllKey, movies);
        storageService.saveCachedStreams(movieAllKey, movies);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Inicia a fila inteligente sequencial na Home:
   * 1. Puxa TV Ao Vivo imediatamente (jogos do dia e canais)
   * 2. Puxa Séries após 3 segundos
   * 3. Puxa Filmes após 6 segundos
   */
  startBackgroundQueue(account: IAccountCredentials | null): () => void {
    if (!account) return () => {};

    let isMounted = true;
    const controller = new AbortController();

    // Etapa 1: TV Ao Vivo imediatamente (prioridade máxima por causa dos jogos)
    this.syncLiveCatalog(account).then(() => {
      if (!isMounted || controller.signal.aborted) return;

      // Etapa 2: Séries após 3 segundos
      setTimeout(() => {
        if (!isMounted || controller.signal.aborted) return;
        this.syncSeriesCatalog(account, controller.signal).then(() => {
          if (!isMounted || controller.signal.aborted) return;

          // Etapa 3: Filmes após mais 3 segundos (total 6s)
          setTimeout(() => {
            if (!isMounted || controller.signal.aborted) return;
            this.syncMovieCatalog(account, controller.signal);
          }, 3000);
        });
      }, 3000);
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  },
};
