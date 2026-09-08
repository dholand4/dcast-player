import { IAccountCredentials } from '../@types/xtream';
import { IWatchProgress, IFavoriteItem, ContentType } from '../@types/storage';

const DEFAULT_SUPABASE_URL = 'https://xfxvjnxjqlqapqebrvye.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_M5cWmFHIiEjYHtOYbCgKzA_zShRUHRd';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

const REQUEST_TIMEOUT_MS = 6000;

function getHeaders(prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
  };
  if (prefer) {
    headers['Prefer'] = prefer;
  }
  return headers;
}

export function getUserKey(account?: IAccountCredentials | null): string {
  if (!account || !account.username) return 'guest';
  try {
    const cleanUser = account.username.trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
    let host = 'default';
    if (account.serverUrl) {
      host = account.serverUrl
        .replace(/^https?:\/\//i, '')
        .split('/')[0]
        .split(':')[0]
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_');
    }
    return `${cleanUser}_${host}`;
  } catch {
    return (account.username || 'user').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_');
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timeoutId);
  }
}

// ---------------------------------------------------------------------------
// Watch Progress (Histórico de Reprodução)
// ---------------------------------------------------------------------------

export async function upsertWatchProgress(
  userKey: string,
  progress: IWatchProgress
): Promise<void> {
  if (!userKey || !progress?.id) return;
  try {
    const recordId = `${userKey}_${progress.id}`;
    const payload = {
      id: recordId,
      user_key: userKey,
      content_id: String(progress.id),
      series_id: progress.seriesId ? String(progress.seriesId) : null,
      title: progress.title || '',
      poster_url: progress.posterUrl || null,
      content_type: progress.type || 'movie',
      season_number: progress.seasonNumber ?? null,
      episode_number: progress.episodeNumber ?? null,
      current_position: Math.floor(progress.currentTime || 0),
      duration: Math.floor(progress.duration || 0),
      percentage: Math.floor(progress.percentage || 0),
      stream_url: progress.streamUrl || null,
      updated_at: progress.updatedAt || Date.now(),
    };

    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_watch_progress`, {
      method: 'POST',
      headers: getHeaders('resolution=merge-duplicates'),
      body: JSON.stringify(payload),
    });
  } catch {
    // Sincronização em background nunca deve quebrar o app
  }
}

export async function fetchWatchProgressList(userKey: string): Promise<IWatchProgress[]> {
  if (!userKey || userKey === 'guest') return [];
  try {
    const encodedUser = encodeURIComponent(userKey);
    const url = `${SUPABASE_URL}/rest/v1/dcast_watch_progress?user_key=eq.${encodedUser}&order=updated_at.desc&limit=100`;
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      id: String(row.content_id),
      seriesId: row.series_id ? String(row.series_id) : undefined,
      title: String(row.title || ''),
      posterUrl: String(row.poster_url || ''),
      type: (row.content_type || 'movie') as ContentType,
      seasonNumber: row.season_number != null ? Number(row.season_number) : undefined,
      episodeNumber: row.episode_number != null ? Number(row.episode_number) : undefined,
      currentTime: Number(row.current_position || 0),
      duration: Number(row.duration || 0),
      percentage: Number(row.percentage || 0),
      updatedAt: Number(row.updated_at || Date.now()),
      streamUrl: row.stream_url ? String(row.stream_url) : undefined,
    }));
  } catch {
    return [];
  }
}

export async function removeWatchProgress(
  userKey: string,
  contentId: string,
  seriesId?: string
): Promise<void> {
  if (!userKey || (!contentId && !seriesId)) return;
  try {
    const encodedUser = encodeURIComponent(userKey);
    let filter = `content_id=eq.${encodeURIComponent(contentId)}`;
    if (seriesId) {
      filter = `or=(content_id.eq.${encodeURIComponent(contentId)},series_id.eq.${encodeURIComponent(seriesId)})`;
    }
    await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/dcast_watch_progress?user_key=eq.${encodedUser}&${filter}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );
  } catch {
    // ignore
  }
}

export async function clearWatchProgress(
  userKey: string,
  type?: ContentType
): Promise<void> {
  if (!userKey || userKey === 'guest') return;
  try {
    const encodedUser = encodeURIComponent(userKey);
    let url = `${SUPABASE_URL}/rest/v1/dcast_watch_progress?user_key=eq.${encodedUser}`;
    if (type) {
      url += `&content_type=eq.${encodeURIComponent(type)}`;
    }
    await fetchWithTimeout(url, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Favorites (Favoritos)
// ---------------------------------------------------------------------------

export async function upsertFavorite(
  userKey: string,
  item: IFavoriteItem
): Promise<void> {
  if (!userKey || !item?.id) return;
  try {
    const recordId = `${userKey}_${item.id}`;
    const payload = {
      id: recordId,
      user_key: userKey,
      item_id: String(item.id),
      name: item.name || '',
      poster_url: item.posterUrl || null,
      content_type: item.type || 'live',
      category_id: item.categoryId || null,
      rating: item.rating ? String(item.rating) : null,
      added_at: item.addedAt || Date.now(),
    };

    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_favorites`, {
      method: 'POST',
      headers: getHeaders('resolution=merge-duplicates'),
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}

export async function removeFavorite(
  userKey: string,
  itemId: string
): Promise<void> {
  if (!userKey || !itemId) return;
  try {
    const recordId = encodeURIComponent(`${userKey}_${itemId}`);
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_favorites?id=eq.${recordId}`, {
      method: 'DELETE',
      headers: getHeaders(),
    });
  } catch {
    // ignore
  }
}

export async function fetchFavoritesList(userKey: string): Promise<IFavoriteItem[]> {
  if (!userKey || userKey === 'guest') return [];
  try {
    const encodedUser = encodeURIComponent(userKey);
    const url = `${SUPABASE_URL}/rest/v1/dcast_favorites?user_key=eq.${encodedUser}&order=added_at.desc&limit=200`;
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      id: String(row.item_id),
      name: String(row.name || ''),
      posterUrl: String(row.poster_url || ''),
      type: (row.content_type || 'live') as ContentType,
      categoryId: String(row.category_id || ''),
      rating: row.rating ? String(row.rating) : undefined,
      addedAt: Number(row.added_at || Date.now()),
    }));
  } catch {
    return [];
  }
}

export const supabaseService = {
  getUserKey,
  upsertWatchProgress,
  fetchWatchProgressList,
  removeWatchProgress,
  clearWatchProgress,
  upsertFavorite,
  removeFavorite,
  fetchFavoritesList,
};
