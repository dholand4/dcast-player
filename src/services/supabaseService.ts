import { sha256 } from 'js-sha256';
import { normalizeHost } from '../utils/accountIdentity';
import { IAccountCredentials } from '../@types/xtream';
import {
  IWatchProgress,
  IFavoriteItem,
  ContentType,
  ICustomCategoryFolder,
  IProfile,
} from '../@types/storage';

const DEFAULT_SUPABASE_URL = 'https://xfxvjnxjqlqapqebrvye.supabase.co';
const DEFAULT_ANON_KEY = 'sb_publishable_M5cWmFHIiEjYHtOYbCgKzA_zShRUHRd';

export const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
export const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_ANON_KEY;

const REQUEST_TIMEOUT_MS = 6000;
const USER_KEY_NAMESPACE = 'dcast:v2';

// O user_key é enviado no cabeçalho x-dcast-key e as políticas RLS do Supabase
// só liberam as linhas cujo user_key é igual a ele (ver supabase/migrations).
function getHeaders(userKey: string, prefer?: string): Record<string, string> {
  const headers: Record<string, string> = {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    'x-dcast-key': userKey,
  };
  if (prefer) {
    headers['Prefer'] = prefer;
  }
  return headers;
}

/**
 * Chave secreta que identifica a conta na nuvem. É derivada da senha do IPTV,
 * então só quem tem as credenciais consegue ler ou alterar os dados da conta,
 * mas continua igual em todos os aparelhos logados na mesma conta.
 */
export function getUserKey(account?: IAccountCredentials | null): string {
  if (!account || !account.username || !account.password) return 'guest';
  const username = account.username.trim().toLowerCase();
  return sha256(`${USER_KEY_NAMESPACE}|${normalizeHost(account.serverUrl)}|${username}|${account.password}`);
}

const DEFAULT_PROFILE_ID = 'default';

/**
 * Chave do histórico e dos favoritos de um perfil. O perfil principal usa a chave da
 * conta (compatível com os dados já existentes); os demais derivam dela.
 */
export function getProfileKey(account: IAccountCredentials | null | undefined, profileId: string): string {
  const accountKey = getUserKey(account);
  if (accountKey === 'guest' || !profileId || profileId === DEFAULT_PROFILE_ID) return accountKey;
  return sha256(`${accountKey}|profile|${profileId}`);
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

function toWatchProgressRow(userKey: string, progress: IWatchProgress) {
  return {
    id: `${userKey}_${progress.id}`,
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
    hidden_from_continue: Boolean(progress.hiddenFromContinue),
    updated_at: progress.updatedAt || Date.now(),
  };
}

export async function upsertWatchProgress(
  userKey: string,
  progress: IWatchProgress
): Promise<void> {
  if (!progress?.id) return;
  await upsertWatchProgressBatch(userKey, [progress]);
}

export async function upsertWatchProgressBatch(
  userKey: string,
  items: IWatchProgress[]
): Promise<void> {
  const rows = items.filter((item) => item?.id).map((item) => toWatchProgressRow(userKey, item));
  if (!userKey || userKey === 'guest' || rows.length === 0) return;
  try {
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_watch_progress`, {
      method: 'POST',
      headers: getHeaders(userKey, 'resolution=merge-duplicates'),
      body: JSON.stringify(rows),
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
      headers: getHeaders(userKey),
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
      hiddenFromContinue: Boolean(row.hidden_from_continue),
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
  if (!userKey || userKey === 'guest' || (!contentId && !seriesId)) return;
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
        headers: getHeaders(userKey),
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
      headers: getHeaders(userKey),
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
  if (!userKey || userKey === 'guest' || !item?.id) return;
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
      headers: getHeaders(userKey, 'resolution=merge-duplicates'),
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
  if (!userKey || userKey === 'guest' || !itemId) return;
  try {
    const recordId = encodeURIComponent(`${userKey}_${itemId}`);
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_favorites?id=eq.${recordId}`, {
      method: 'DELETE',
      headers: getHeaders(userKey),
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
      headers: getHeaders(userKey),
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

export async function clearFavorites(userKey: string): Promise<void> {
  if (!userKey || userKey === 'guest') return;
  try {
    await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/dcast_favorites?user_key=eq.${encodeURIComponent(userKey)}`,
      { method: 'DELETE', headers: getHeaders(userKey) }
    );
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Profiles (Perfis) — ficam na chave da conta
// ---------------------------------------------------------------------------

export async function upsertProfiles(userKey: string, profiles: IProfile[]): Promise<void> {
  if (!userKey || userKey === 'guest' || profiles.length === 0) return;
  try {
    const rows = profiles.map((profile) => ({
      id: `${userKey}_${profile.id}`,
      user_key: userKey,
      profile_id: profile.id,
      name: profile.name,
      color: profile.color,
      created_at: profile.createdAt,
      updated_at: profile.updatedAt,
      deleted: Boolean(profile.deleted),
    }));
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_profiles`, {
      method: 'POST',
      headers: getHeaders(userKey, 'resolution=merge-duplicates'),
      body: JSON.stringify(rows),
    });
  } catch {
    // ignore
  }
}

export async function fetchProfiles(userKey: string): Promise<IProfile[] | null> {
  if (!userKey || userKey === 'guest') return null;
  try {
    const res = await fetchWithTimeout(
      `${SUPABASE_URL}/rest/v1/dcast_profiles?user_key=eq.${encodeURIComponent(userKey)}`,
      { method: 'GET', headers: getHeaders(userKey) }
    );
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows)) return null;
    return rows.map((row) => ({
      id: String(row.profile_id),
      name: String(row.name || ''),
      color: String(row.color || ''),
      createdAt: Number(row.created_at || 0),
      updatedAt: Number(row.updated_at || 0),
      deleted: Boolean(row.deleted),
    }));
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Custom Folders (Pastas Personalizadas)
// ---------------------------------------------------------------------------

export async function upsertCustomFolder(
  userKey: string,
  folder: ICustomCategoryFolder
): Promise<void> {
  if (!userKey || userKey === 'guest' || !folder?.id) return;
  try {
    const recordId = `${userKey}_${folder.id}`;
    const payload = {
      id: recordId,
      user_key: userKey,
      folder_id: String(folder.id),
      name: folder.name || '',
      content_type: folder.type || 'live',
      stream_ids: folder.streamIds || [],
      created_at: folder.createdAt || Date.now(),
      updated_at: Date.now(),
    };

    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_custom_folders`, {
      method: 'POST',
      headers: getHeaders(userKey, 'resolution=merge-duplicates'),
      body: JSON.stringify(payload),
    });
  } catch {
    // Sincronização em background nunca deve quebrar o app
  }
}

export async function removeCustomFolder(
  userKey: string,
  folderId: string
): Promise<void> {
  if (!userKey || userKey === 'guest' || !folderId) return;
  try {
    const recordId = encodeURIComponent(`${userKey}_${folderId}`);
    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_custom_folders?id=eq.${recordId}`, {
      method: 'DELETE',
      headers: getHeaders(userKey),
    });
  } catch {
    // ignore
  }
}

export async function fetchCustomFoldersList(
  userKey: string,
  type?: ContentType
): Promise<ICustomCategoryFolder[]> {
  if (!userKey || userKey === 'guest') return [];
  try {
    const encodedUser = encodeURIComponent(userKey);
    let url = `${SUPABASE_URL}/rest/v1/dcast_custom_folders?user_key=eq.${encodedUser}&order=created_at.desc`;
    if (type) {
      url += `&content_type=eq.${encodeURIComponent(type)}`;
    }
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(userKey),
    });
    if (!res.ok) return [];
    const rows = await res.json();
    if (!Array.isArray(rows)) return [];

    return rows.map((row) => ({
      id: String(row.folder_id),
      name: String(row.name || ''),
      type: (row.content_type || 'live') as ContentType,
      streamIds: Array.isArray(row.stream_ids) ? row.stream_ids.map(String) : [],
      createdAt: Number(row.created_at || Date.now()),
    }));
  } catch {
    return [];
  }
}

// ---------------------------------------------------------------------------
// Hidden Items (Pastas e Canais Ocultos)
// ---------------------------------------------------------------------------

export async function upsertHiddenItems(
  userKey: string,
  contentType: ContentType,
  hiddenCategories: string[],
  hiddenStreams: string[]
): Promise<void> {
  if (!userKey || userKey === 'guest' || !contentType) return;
  try {
    const recordId = `${userKey}_${contentType}`;
    const payload = {
      id: recordId,
      user_key: userKey,
      content_type: contentType,
      hidden_categories: hiddenCategories || [],
      hidden_streams: hiddenStreams || [],
      updated_at: Date.now(),
    };

    await fetchWithTimeout(`${SUPABASE_URL}/rest/v1/dcast_hidden_items`, {
      method: 'POST',
      headers: getHeaders(userKey, 'resolution=merge-duplicates'),
      body: JSON.stringify(payload),
    });
  } catch {
    // ignore
  }
}

export async function fetchHiddenItems(
  userKey: string,
  contentType: ContentType
): Promise<{ hiddenCategories: string[]; hiddenStreams: string[] } | null> {
  if (!userKey || userKey === 'guest' || !contentType) return null;
  try {
    const recordId = encodeURIComponent(`${userKey}_${contentType}`);
    const url = `${SUPABASE_URL}/rest/v1/dcast_hidden_items?id=eq.${recordId}&limit=1`;
    const res = await fetchWithTimeout(url, {
      method: 'GET',
      headers: getHeaders(userKey),
    });
    if (!res.ok) return null;
    const rows = await res.json();
    if (!Array.isArray(rows) || rows.length === 0) return null;

    const row = rows[0];
    return {
      hiddenCategories: Array.isArray(row.hidden_categories) ? row.hidden_categories.map(String) : [],
      hiddenStreams: Array.isArray(row.hidden_streams) ? row.hidden_streams.map(String) : [],
    };
  } catch {
    return null;
  }
}

export const supabaseService = {
  getUserKey,
  getProfileKey,
  upsertProfiles,
  fetchProfiles,
  clearFavorites,
  upsertWatchProgress,
  upsertWatchProgressBatch,
  fetchWatchProgressList,
  removeWatchProgress,
  clearWatchProgress,
  upsertFavorite,
  removeFavorite,
  fetchFavoritesList,
  upsertCustomFolder,
  removeCustomFolder,
  fetchCustomFoldersList,
  upsertHiddenItems,
  fetchHiddenItems,
};
