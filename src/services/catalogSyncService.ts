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
   * Puxa em segundo plano as categorias de filmes e séries
   * com delay suave após os canais ao vivo.
   */
  async syncVodCategories(
    account: IAccountCredentials,
    signal?: AbortSignal
  ): Promise<boolean> {
    if (!account || !account.serverUrl || !account.username) return false;
    if (signal?.aborted) return false;

    const accKey = `${account.serverUrl}_${account.username}`;
    const vodCatKey = `${accKey}_cat_movie`;
    const seriesCatKey = `${accKey}_cat_series`;

    try {
      const [vodCats, seriesCats] = await Promise.allSettled([
        xtreamService.getVodCategories(account),
        xtreamService.getSeriesCategories(account),
      ]);

      if (signal?.aborted) return false;

      if (vodCats.status === 'fulfilled' && vodCats.value.length > 0) {
        setCachedCategories(vodCatKey, vodCats.value);
        storageService.saveCachedCategories(vodCatKey, vodCats.value);
      }

      if (seriesCats.status === 'fulfilled' && seriesCats.value.length > 0) {
        setCachedCategories(seriesCatKey, seriesCats.value);
        storageService.saveCachedCategories(seriesCatKey, seriesCats.value);
      }

      return true;
    } catch {
      return false;
    }
  },

  /**
   * Inicia a fila inteligente na Home:
   * 1. Puxa canais ao vivo imediatamente
   * 2. Puxa categorias de filmes/séries após 2.5s
   */
  startBackgroundQueue(account: IAccountCredentials | null): () => void {
    if (!account) return () => {};

    let isMounted = true;
    const controller = new AbortController();

    // Etapa 1: TV Ao Vivo imediatamente
    this.syncLiveCatalog(account).then(() => {
      if (!isMounted || controller.signal.aborted) return;

      // Etapa 2: Filmes e Séries após 2.5 segundos
      setTimeout(() => {
        if (!isMounted || controller.signal.aborted) return;
        this.syncVodCategories(account, controller.signal);
      }, 2500);
    });

    return () => {
      isMounted = false;
      controller.abort();
    };
  },
};
