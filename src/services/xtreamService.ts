import {
  IAccountCredentials,
  IXtreamAuthResponse,
  IXtreamCategory,
  IXtreamLiveStream,
  IXtreamVodStream,
  IXtreamSeries,
  IXtreamSeriesInfo,
  IXtreamEpisode,
  IEpgListing,
} from '../@types/xtream';

import { Platform } from 'react-native';

const REQUEST_TIMEOUT_MS = 45000;

export function extractDirectUrl(rawUrl: string): string {
  if (!rawUrl || typeof rawUrl !== 'string') return '';
  const trimmed = rawUrl.trim();
  if (trimmed.includes('/api/proxy?url=')) {
    try {
      const match = trimmed.match(/\/api\/proxy\?url=([^&]+)/);
      if (match && match[1]) {
        return decodeURIComponent(match[1]);
      }
    } catch {}
  }
  return trimmed;
}

export function resolveUrlForPlatform(rawUrl: string): string {
  if (!rawUrl) return '';
  const directUrl = extractDirectUrl(rawUrl);
  if (Platform.OS !== 'web') {
    return directUrl;
  }
  try {
    if (typeof window !== 'undefined' && window.location) {
      if (rawUrl.startsWith('/api/proxy') || rawUrl.includes('/api/proxy?url=')) {
        return rawUrl;
      }
      return `/api/proxy?url=${encodeURIComponent(directUrl)}`;
    }
  } catch {
    // fallback
  }
  return directUrl;
}

// Usuário e senha vão no caminho da URL; caracteres como # ? / % quebrariam o endereço
function credentialPath(creds: IAccountCredentials): string {
  return `${encodeURIComponent(creds.username)}/${encodeURIComponent(creds.password)}`;
}

export function toArray<T>(data: unknown): T[] {
  if (Array.isArray(data)) return data as T[];
  if (data && typeof data === 'object') {
    return Object.values(data) as T[];
  }
  return [];
}

export type XtreamErrorKind = 'auth' | 'expired' | 'disabled' | 'http' | 'network' | 'timeout';

// Erro com mensagem pronta para exibir ao usuário
export class XtreamError extends Error {
  readonly kind: XtreamErrorKind;

  constructor(kind: XtreamErrorKind, message: string) {
    super(message);
    this.name = 'XtreamError';
    this.kind = kind;
  }
}

function httpErrorMessage(status: number): string {
  if (status === 401 || status === 403) {
    return 'O servidor recusou o acesso. Confira usuário e senha.';
  }
  if (status === 404) return 'Servidor não encontrado nesse endereço. Confira a URL.';
  if (status === 429) return 'Muitas requisições ao servidor. Aguarde um pouco e tente de novo.';
  if (status >= 500) return 'O servidor IPTV está com problemas agora. Tente novamente mais tarde.';
  return `O servidor respondeu com erro (${status}).`;
}

function assertOk(response: Response): void {
  if (!response.ok) {
    throw new XtreamError('http', httpErrorMessage(response.status));
  }
}

async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  externalSignal?: AbortSignal
): Promise<Response> {
  const targetUrl = resolveUrlForPlatform(url);
  const controller = new AbortController();
  let timedOut = false;
  const id = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, REQUEST_TIMEOUT_MS);

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
  } catch (err) {
    // Cancelamento pedido por quem chamou: repassa o erro original
    if (externalSignal?.aborted) throw err;
    if (timedOut) {
      throw new XtreamError('timeout', 'O servidor demorou demais para responder. Tente novamente.');
    }
    throw new XtreamError(
      'network',
      'Não foi possível conectar ao servidor. Verifique sua internet e a URL da lista.'
    );
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
    assertOk(response);

    let data: IXtreamAuthResponse;
    try {
      data = (await response.json()) as IXtreamAuthResponse;
    } catch {
      throw new XtreamError('http', 'O endereço não parece ser um servidor IPTV. Confira a URL.');
    }

    const info = data?.user_info;
    if (info && Number(info.auth) === 0) {
      throw new XtreamError('auth', 'Usuário ou senha inválidos.');
    }
    const status = String(info?.status || '').toLowerCase();
    if (status === 'disabled' || status === 'banned') {
      throw new XtreamError('disabled', 'Esta conta foi desativada pelo provedor.');
    }
    const expiresAt = Number(info?.exp_date) * 1000;
    if (status === 'expired' || (expiresAt > 0 && expiresAt < Date.now())) {
      throw new XtreamError('expired', 'Sua assinatura expirou. Fale com seu provedor para renovar.');
    }

    return data;
  },

  // 2. Categories
  async getLiveCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_categories`;

    const response = await fetchWithTimeout(url);
    assertOk(response);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamCategory>(data);
  },

  async getVodCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_categories`;

    const response = await fetchWithTimeout(url);
    assertOk(response);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamCategory>(data);
  },

  async getSeriesCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_categories`;

    const response = await fetchWithTimeout(url);
    assertOk(response);
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
    assertOk(response);
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
    assertOk(response);
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
    assertOk(response);
    const data = (await response.json()) as unknown;
    return toArray<IXtreamSeries>(data);
  },

  // 4. Series Details (Seasons & Episodes)
  async getSeriesInfo(creds: IAccountCredentials, seriesId: string | number): Promise<IXtreamSeriesInfo> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${encodeURIComponent(seriesId)}`;

    const response = await fetchWithTimeout(url);
    assertOk(response);
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
  /**
   * URL do replay (TV Archive) de um programa que já passou. O início vai no horário
   * local do servidor, que é o formato do campo "start" da grade (EPG).
   */
  buildCatchupStreamUrl(
    creds: IAccountCredentials,
    streamId: string | number,
    program: Pick<IEpgListing, 'start' | 'start_timestamp' | 'stop_timestamp'>
  ): string | null {
    const match = program.start?.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    const seconds = program.stop_timestamp - program.start_timestamp;
    if (!match || !(seconds > 0)) return null;
    const minutes = Math.ceil(seconds / 60);
    const start = `${match[1]}:${match[2]}-${match[3]}`;
    return resolveUrlForPlatform(
      `${creds.serverUrl}/timeshift/${credentialPath(creds)}/${minutes}/${start}/${streamId}.ts`
    );
  },

  buildLiveStreamUrl(
    creds: IAccountCredentials,
    streamId: string | number,
    extension?: string
  ): string {
    const { serverUrl } = creds;
    const defaultExt = Platform.OS === 'web' ? 'm3u8' : 'ts';
    const chosenExt = extension !== undefined ? extension : defaultExt;
    const cleanExt = chosenExt ? chosenExt.replace(/^\./, '').trim() : '';
    const rawUrl = cleanExt
      ? `${serverUrl}/live/${credentialPath(creds)}/${streamId}.${cleanExt}`
      : `${serverUrl}/live/${credentialPath(creds)}/${streamId}`;
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
    const ext = extension.replace(/^\./, '');
    const rawUrl = `${creds.serverUrl}/movie/${credentialPath(creds)}/${streamId}.${ext}`;
    return resolveUrlForPlatform(rawUrl);
  },

  buildSeriesStreamUrl(creds: IAccountCredentials, episodeId: string | number, extension: string = 'mp4'): string {
    const ext = extension.replace(/^\./, '');
    const rawUrl = `${creds.serverUrl}/series/${credentialPath(creds)}/${episodeId}.${ext}`;
    return resolveUrlForPlatform(rawUrl);
  },

  // 6. Guia Eletrônico de Programação (EPG)
  async getShortEpg(
    creds: IAccountCredentials,
    streamId: string | number,
    limit: number = 4
  ): Promise<IEpgListing[]> {
    try {
      const url = `${creds.serverUrl}/player_api.php?username=${encodeURIComponent(
        creds.username
      )}&password=${encodeURIComponent(
        creds.password
      )}&action=get_short_epg&stream_id=${streamId}&limit=${limit}`;

      const res = await fetchWithTimeout(url);
      if (!res.ok) return [];

      const data = await res.json();
      const listings = toArray<any>(data?.epg_listings);

      return listings.map((item) => {
        const rawTitle = item.title || '';
        const rawDesc = item.description || '';
        return {
          id: String(item.id || ''),
          epg_id: item.epg_id ? String(item.epg_id) : undefined,
          title: safeDecodeBase64(rawTitle),
          lang: item.lang,
          start: item.start || '',
          end: item.end || '',
          description: safeDecodeBase64(rawDesc),
          start_timestamp: Number(item.start_timestamp) || 0,
          stop_timestamp: Number(item.stop_timestamp) || 0,
          now_playing: Number(item.now_playing) || 0,
          has_archive: Number(item.has_archive) || 0,
        };
      });
    } catch {
      return [];
    }
  },

  async getFullEpgTable(
    creds: IAccountCredentials,
    streamId: string | number
  ): Promise<IEpgListing[]> {
    try {
      const url = `${creds.serverUrl}/player_api.php?username=${encodeURIComponent(
        creds.username
      )}&password=${encodeURIComponent(
        creds.password
      )}&action=get_simple_data_table&stream_id=${streamId}`;

      const res = await fetchWithTimeout(url);
      if (res.ok) {
        const data = await res.json();
        const listings = toArray<any>(data?.epg_listings);
        if (listings.length > 0) {
          return listings.map((item) => {
            const rawTitle = item.title || '';
            const rawDesc = item.description || '';
            return {
              id: String(item.id || ''),
              epg_id: item.epg_id ? String(item.epg_id) : undefined,
              title: safeDecodeBase64(rawTitle),
              lang: item.lang,
              start: item.start || '',
              end: item.end || '',
              description: safeDecodeBase64(rawDesc),
              start_timestamp: Number(item.start_timestamp) || 0,
              stop_timestamp: Number(item.stop_timestamp) || 0,
              now_playing: Number(item.now_playing) || 0,
              has_archive: Number(item.has_archive) || 0,
            };
          });
        }
      }
    } catch {
      // Fallback para getShortEpg
    }

    return this.getShortEpg(creds, streamId, 20);
  },

  // 7. Informações detalhadas de VOD (incluindo trailer do YouTube)
  async getVodInfo(
    creds: IAccountCredentials,
    vodId: string | number
  ): Promise<{
    info?: { youtube_trailer?: string; plot?: string; duration_secs?: number; rating?: string; releasedate?: string; genre?: string; director?: string; cast?: string };
    movie_data?: { container_extension?: string };
  }> {
    try {
      const { serverUrl, username, password } = creds;
      const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(
        username
      )}&password=${encodeURIComponent(password)}&action=get_vod_info&vod_id=${encodeURIComponent(vodId)}`;
      const res = await fetchWithTimeout(url);
      if (!res.ok) return {};
      const data = await res.json();
      return data || {};
    } catch {
      return {};
    }
  },
};

export function cleanHtmlEntities(str: string): string {
  if (!str) return '';
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

export function safeDecodeBase64(str?: string): string {
  if (!str || typeof str !== 'string') return '';
  const trimmed = str.trim();
  if (!trimmed) return '';

  // Se já contém espaços, acentos, pontuação de frase ou caracteres especiais comuns em títulos, é texto puro!
  if (/[\s\u00C0-\u017F:;!?()[\]{}]/.test(trimmed)) {
    return cleanHtmlEntities(trimmed);
  }

  // Candidato a Base64: tamanho >= 8, múltiplo de 4, sem caracteres estranhos
  if (/^[A-Za-z0-9+/]+={0,2}$/.test(trimmed) && trimmed.length >= 8 && trimmed.length % 4 === 0) {
    try {
      let decoded = '';
      if (typeof Buffer !== 'undefined') {
        decoded = Buffer.from(trimmed, 'base64').toString('utf-8');
      } else if (typeof atob === 'function') {
        const bin = atob(trimmed);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        if (typeof TextDecoder !== 'undefined') {
          decoded = new TextDecoder('utf-8').decode(bytes);
        } else {
          decoded = decodeURIComponent(escape(bin));
        }
      }

      // Validar se o texto decodificado é legível e não lixo binário
      if (decoded && !/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/.test(decoded)) {
        const lettersAndSpaces = (decoded.match(/[A-Za-z0-9\u00C0-\u017F\s.,'\"-]/g) || []).length;
        if (lettersAndSpaces / decoded.length > 0.85) {
          const vowelCount = (decoded.match(/[aeiouAEIOU\u00C0-\u017F]/g) || []).length;
          if (vowelCount > 0) {
            return cleanHtmlEntities(decoded);
          }
        }
      }
    } catch {
      // ignore
    }
  }

  return cleanHtmlEntities(trimmed);
}
