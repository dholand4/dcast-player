import {
  IAccountCredentials,
  IXtreamAuthResponse,
  IXtreamCategory,
  IXtreamLiveStream,
  IXtreamVodStream,
  IXtreamSeries,
  IXtreamSeriesInfo,
  IXtreamEpisode,
} from '../@types/xtream';

import { Platform } from 'react-native';

const REQUEST_TIMEOUT_MS = 45000;

export function resolveUrlForPlatform(rawUrl: string): string {
  if (Platform.OS !== 'web') {
    return rawUrl;
  }
  try {
    if (typeof window !== 'undefined' && window.location) {
      if (rawUrl.startsWith('/api/proxy') || rawUrl.includes('/api/proxy?url=')) {
        return rawUrl;
      }
      return `/api/proxy?url=${encodeURIComponent(rawUrl)}`;
    }
  } catch {
    // fallback
  }
  return rawUrl;
}

export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    return Object.values(data) as T[];
  }
  return [];
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  externalSignal?: AbortSignal
): Promise<Response> {
  const targetUrl = resolveUrlForPlatform(url);
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      controller.abort();
    } else {
      externalSignal.addEventListener('abort', onExternalAbort);
    }
  }

  try {
    const response = await fetch(targetUrl, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
    if (externalSignal) {
      externalSignal.removeEventListener('abort', onExternalAbort);
    }
  }
}

export const xtreamService = {
  // 1. Authentication and Account Data
  async authenticate(creds: IAccountCredentials): Promise<IXtreamAuthResponse> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      throw new Error(`HTTP Error ${response.status}`);
    }

    const data = (await response.json()) as IXtreamAuthResponse;
    if (data?.user_info?.auth === 0 || data?.user_info?.status === 'Disabled') {
      throw new Error('Credenciais inválidas ou conta desativada.');
    }

    return data;
  },

  // 2. Categories
  async getLiveCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamCategory>(data);
  },

  async getVodCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_categories`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamCategory>(data);
  },

  async getSeriesCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_categories`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamCategory>(data);
  },

  // 3. Streams by Category
  async getLiveStreams(
    creds: IAccountCredentials,
    categoryId?: string,
    signal?: AbortSignal
  ): Promise<IXtreamLiveStream[]> {
    const { serverUrl, username, password } = creds;
    let url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    const response = await fetchWithTimeout(url, {}, signal);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamLiveStream>(data);
  },

  async getVodStreams(
    creds: IAccountCredentials,
    categoryId?: string,
    signal?: AbortSignal
  ): Promise<IXtreamVodStream[]> {
    const { serverUrl, username, password } = creds;
    let url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_streams`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    const response = await fetchWithTimeout(url, {}, signal);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamVodStream>(data);
  },

  async getSeries(
    creds: IAccountCredentials,
    categoryId?: string,
    signal?: AbortSignal
  ): Promise<IXtreamSeries[]> {
    const { serverUrl, username, password } = creds;
    let url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    const response = await fetchWithTimeout(url, {}, signal);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamSeries>(data);
  },

  // 4. Series Details (Seasons & Episodes)
  async getSeriesInfo(creds: IAccountCredentials, seriesId: string | number): Promise<IXtreamSeriesInfo> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${encodeURIComponent(seriesId)}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = (await response.json()) as any;
    if (!data) return {};

    const normalizedEpisodes: Record<string, IXtreamEpisode[]> = {};
    if (data.episodes) {
      if (Array.isArray(data.episodes)) {
        for (const ep of data.episodes) {
          if (!ep) continue;
          const s = String(ep.season || ep.season_number || 1);
          if (!normalizedEpisodes[s]) normalizedEpisodes[s] = [];
          normalizedEpisodes[s].push(ep);
        }
      } else if (typeof data.episodes === 'object') {
        for (const [seasonKey, seasonEps] of Object.entries(data.episodes)) {
          normalizedEpisodes[seasonKey] = toArray<IXtreamEpisode>(seasonEps);
        }
      }
    }

    return {
      ...data,
      episodes: normalizedEpisodes,
    };
  },

  // 5. Playback Engine URLs
  buildLiveStreamUrl(
    creds: IAccountCredentials,
    streamId: string | number,
    extension?: string
  ): string {
    const { serverUrl, username, password } = creds;
    const defaultExt = Platform.OS === 'web' ? 'm3u8' : 'ts';
    const chosenExt = extension !== undefined ? extension : defaultExt;
    const cleanExt = chosenExt ? chosenExt.replace(/^\./, '').trim() : '';
    const rawUrl = cleanExt
      ? `${serverUrl}/live/${username}/${password}/${streamId}.${cleanExt}`
      : `${serverUrl}/live/${username}/${password}/${streamId}`;
    return resolveUrlForPlatform(rawUrl);
  },

  getAlternativeLiveStreamUrl(currentUrl: string): string | null {
    if (currentUrl.endsWith('.ts')) {
      return currentUrl.replace(/\.ts$/, '.m3u8');
    }
    if (currentUrl.endsWith('.m3u8')) {
      return currentUrl.replace(/\.m3u8$/, '.ts');
    }
    return null;
  },

  buildVodStreamUrl(creds: IAccountCredentials, streamId: string | number, extension: string = 'mp4'): string {
    const { serverUrl, username, password } = creds;
    const ext = extension.replace(/^\./, '');
    const rawUrl = `${serverUrl}/movie/${username}/${password}/${streamId}.${ext}`;
    return resolveUrlForPlatform(rawUrl);
  },

  buildSeriesStreamUrl(creds: IAccountCredentials, episodeId: string | number, extension: string = 'mp4'): string {
    const { serverUrl, username, password } = creds;
    const ext = extension.replace(/^\./, '');
    const rawUrl = `${serverUrl}/series/${username}/${password}/${episodeId}.${ext}`;
    return resolveUrlForPlatform(rawUrl);
  },
};
