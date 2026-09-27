import { IFavoriteItem } from '../@types/storage';

export interface IFavoritesMergeResult {
  /** Lista final do aparelho */
  merged: IFavoriteItem[];
  /** Favoritos criados neste aparelho que ainda não estão na nuvem */
  toUpload: IFavoriteItem[];
  /** IDs removidos neste aparelho que ainda constam na nuvem */
  toDelete: string[];
}

/**
 * Junta os favoritos do aparelho com os da nuvem usando a última sincronização
 * como referência, para distinguir "adicionado aqui" de "removido em outro aparelho":
 *
 * - só no aparelho e já sincronizado antes → foi removido em outro aparelho: sai daqui
 * - só no aparelho e nunca sincronizado    → foi adicionado aqui: sobe para a nuvem
 * - só na nuvem e já sincronizado antes    → foi removido aqui (offline): apaga da nuvem
 * - só na nuvem e nunca sincronizado       → foi adicionado em outro aparelho: entra aqui
 *
 * Sem referência (primeira sincronização deste aparelho), a nuvem vale; se ela
 * estiver vazia, os favoritos do aparelho sobem.
 */
export function mergeFavorites(
  local: IFavoriteItem[],
  cloud: IFavoriteItem[],
  syncedIds: string[] | null
): IFavoritesMergeResult {
  const localById = new Map(local.map((item) => [String(item.id), item]));
  const cloudById = new Map(cloud.map((item) => [String(item.id), item]));

  if (syncedIds === null) {
    if (cloud.length === 0) {
      return { merged: local, toUpload: local, toDelete: [] };
    }
    return { merged: cloud, toUpload: [], toDelete: [] };
  }

  const synced = new Set(syncedIds.map(String));
  const merged: IFavoriteItem[] = [];
  const toUpload: IFavoriteItem[] = [];
  const toDelete: string[] = [];

  for (const [id, item] of localById) {
    if (cloudById.has(id)) {
      merged.push(item);
    } else if (!synced.has(id)) {
      merged.push(item);
      toUpload.push(item);
    }
  }

  for (const [id, item] of cloudById) {
    if (localById.has(id)) continue;
    if (synced.has(id)) {
      toDelete.push(id);
    } else {
      merged.push(item);
    }
  }

  merged.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  return { merged, toUpload, toDelete };
}
