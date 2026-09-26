import { IProfile } from '../@types/storage';
import { storageService, DEFAULT_PROFILE_ID } from './storageService';
import { supabaseService } from './supabaseService';

export const PROFILE_COLORS = ['#E50914', '#29B6F6', '#46D369', '#FFB300', '#AB47BC', '#FF7043'];
export const MAX_PROFILES = 4;
export const PROFILE_NAME_MAX_LENGTH = 20;

/** Chave da nuvem para histórico e favoritos do perfil em uso */
export function getActiveProfileCloudKey(): string {
  return supabaseService.getProfileKey(storageService.getAccount(), storageService.getActiveProfileId());
}

function getAccountCloudKey(): string {
  return supabaseService.getUserKey(storageService.getAccount());
}

function createDefaultProfile(): IProfile {
  return {
    id: DEFAULT_PROFILE_ID,
    name: 'Principal',
    color: PROFILE_COLORS[0],
    createdAt: 0,
    updatedAt: 0,
  };
}

function generateProfileId(): string {
  return `p${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function sanitizeName(name: string): string {
  return name.trim().slice(0, PROFILE_NAME_MAX_LENGTH);
}

function isNewer(candidate: IProfile, current?: IProfile): boolean {
  return !current || candidate.updatedAt > current.updatedAt;
}

export const profileService = {
  /** Perfis da conta atual; cria o perfil "Principal" na primeira vez */
  getProfiles(): IProfile[] {
    const all = storageService.getProfiles(true);
    if (!all.some((profile) => profile.id === DEFAULT_PROFILE_ID)) {
      storageService.saveProfiles([createDefaultProfile(), ...all]);
    }
    return storageService.getProfiles();
  },

  createProfile(name: string, color: string): IProfile | null {
    const cleanName = sanitizeName(name);
    if (!cleanName || this.getProfiles().length >= MAX_PROFILES) return null;
    const now = Date.now();
    const profile: IProfile = { id: generateProfileId(), name: cleanName, color, createdAt: now, updatedAt: now };
    storageService.saveProfiles([...storageService.getProfiles(true), profile]);
    supabaseService.upsertProfiles(getAccountCloudKey(), [profile]);
    return profile;
  },

  updateProfile(profileId: string, changes: Pick<IProfile, 'name' | 'color'>): IProfile | null {
    const cleanName = sanitizeName(changes.name);
    const all = storageService.getProfiles(true);
    const current = all.find((profile) => profile.id === profileId && !profile.deleted);
    if (!current || !cleanName) return null;
    const updated: IProfile = { ...current, name: cleanName, color: changes.color, updatedAt: Date.now() };
    storageService.saveProfiles(all.map((profile) => (profile.id === profileId ? updated : profile)));
    supabaseService.upsertProfiles(getAccountCloudKey(), [updated]);
    return updated;
  },

  /** Remove o perfil e o histórico/favoritos dele (no aparelho e na nuvem) */
  deleteProfile(profileId: string): boolean {
    if (profileId === DEFAULT_PROFILE_ID) return false;
    const all = storageService.getProfiles(true);
    const current = all.find((profile) => profile.id === profileId && !profile.deleted);
    if (!current) return false;

    const tombstone: IProfile = { ...current, deleted: true, updatedAt: Date.now() };
    storageService.saveProfiles(all.map((profile) => (profile.id === profileId ? tombstone : profile)));
    storageService.deleteProfileData(profileId);

    const account = storageService.getAccount();
    const profileKey = supabaseService.getProfileKey(account, profileId);
    supabaseService.upsertProfiles(getAccountCloudKey(), [tombstone]);
    supabaseService.clearWatchProgress(profileKey);
    supabaseService.clearFavorites(profileKey);
    return true;
  },

  /** Junta os perfis do aparelho com os da nuvem (vale o mais recente de cada um) */
  async syncWithCloud(): Promise<boolean> {
    const accountKey = getAccountCloudKey();
    const cloudProfiles = await supabaseService.fetchProfiles(accountKey);
    if (!cloudProfiles) return false;

    const localById = new Map(storageService.getProfiles(true).map((profile) => [profile.id, profile]));
    const cloudById = new Map(cloudProfiles.map((profile) => [profile.id, profile]));
    let changed = false;

    for (const cloudProfile of cloudProfiles) {
      const local = localById.get(cloudProfile.id);
      if (isNewer(cloudProfile, local)) {
        localById.set(cloudProfile.id, cloudProfile);
        if (cloudProfile.deleted && local && !local.deleted) {
          storageService.deleteProfileData(cloudProfile.id);
        }
        changed = true;
      }
    }
    if (changed) {
      storageService.saveProfiles(Array.from(localById.values()));
    }

    const pending = Array.from(localById.values()).filter((local) =>
      isNewer(local, cloudById.get(local.id))
    );
    if (pending.length > 0) {
      await supabaseService.upsertProfiles(accountKey, pending);
    }
    return changed;
  },
};
