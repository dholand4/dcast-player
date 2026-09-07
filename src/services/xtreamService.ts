import {
  IAccountCredentials,
  IXtreamAuthResponse,
  IXtreamCategory,
  IXtreamLiveStream,
  IXtreamVodStream,
  IXtreamSeries,
  IXtreamSeriesInfo,
} from '../@types/xtream';

const REQUEST_TIMEOUT_MS = 15000;

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return response;
  } finally {
    clearTimeout(id);
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
    const data = (await response.json()) as IXtreamCategory[];
    return Array.isArray(data) ? data : [];
  },

  async getVodCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_categories`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as IXtreamCategory[];
    return Array.isArray(data) ? data : [];
  },

  async getSeriesCategories(creds: IAccountCredentials): Promise<IXtreamCategory[]> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_categories`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as IXtreamCategory[];
    return Array.isArray(data) ? data : [];
  },

  // 3. Streams by Category
  async getLiveStreams(creds: IAccountCredentials, categoryId?: string): Promise<IXtreamLiveStream[]> {
    const { serverUrl, username, password } = creds;
    let url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_live_streams`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as IXtreamLiveStream[];
    return Array.isArray(data) ? data : [];
  },

  async getVodStreams(creds: IAccountCredentials, categoryId?: string): Promise<IXtreamVodStream[]> {
    const { serverUrl, username, password } = creds;
    let url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_vod_streams`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as IXtreamVodStream[];
    return Array.isArray(data) ? data : [];
  },

  async getSeries(creds: IAccountCredentials, categoryId?: string): Promise<IXtreamSeries[]> {
    const { serverUrl, username, password } = creds;
    let url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series`;
    if (categoryId && categoryId !== 'all') {
      url += `&category_id=${encodeURIComponent(categoryId)}`;
    }

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as IXtreamSeries[];
    return Array.isArray(data) ? data : [];
  },

  // 4. Series Details (Seasons & Episodes)
  async getSeriesInfo(creds: IAccountCredentials, seriesId: string | number): Promise<IXtreamSeriesInfo> {
    const { serverUrl, username, password } = creds;
    const url = `${serverUrl}/player_api.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&action=get_series_info&series_id=${encodeURIComponent(seriesId)}`;

    const response = await fetchWithTimeout(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return (await response.json()) as IXtreamSeriesInfo;
  },

  // 5. Playback Engine URLs
  buildLiveStreamUrl(creds: IAccountCredentials, streamId: string | number): string {
    const { serverUrl, username, password } = creds;
    return `${serverUrl}/live/${username}/${password}/${streamId}.m3u8`;
  },

  buildVodStreamUrl(creds: IAccountCredentials, streamId: string | number, extension: string = 'mp4'): string {
    const { serverUrl, username, password } = creds;
    const ext = extension.replace(/^\./, '');
    return `${serverUrl}/movie/${username}/${password}/${streamId}.${ext}`;
  },

  buildSeriesStreamUrl(creds: IAccountCredentials, episodeId: string | number, extension: string = 'mp4'): string {
    const { serverUrl, username, password } = creds;
    const ext = extension.replace(/^\./, '');
    return `${serverUrl}/series/${username}/${password}/${episodeId}.${ext}`;
  },
};
