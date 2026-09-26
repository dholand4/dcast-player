import React, { createContext, useState, useCallback, useEffect, useMemo, ReactNode } from 'react';
import { IProfile } from '../@types/storage';
import { useAuth } from '../hooks/useAuth';
import { storageService, DEFAULT_PROFILE_ID } from '../services/storageService';
import { profileService } from '../services/profileService';
import { supabaseService } from '../services/supabaseService';
import { claimSessionSync, releaseSessionSync } from '../utils/sessionSync';

export interface IProfileContextData {
  profiles: IProfile[];
  /** Perfil escolhido nesta sessão; null mostra a tela "Quem está assistindo?" */
  activeProfile: IProfile | null;
  selectProfile: (profileId: string) => void;
  /** Volta para a tela de escolha de perfil */
  switchProfile: () => void;
  createProfile: (name: string, color: string) => IProfile | null;
  updateProfile: (profileId: string, changes: Pick<IProfile, 'name' | 'color'>) => void;
  deleteProfile: (profileId: string) => void;
}

export const ProfileContext = createContext<IProfileContextData>({} as IProfileContextData);

export const ProfileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { account } = useAuth();
  const [profiles, setProfiles] = useState<IProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);

  const reload = useCallback(() => {
    setProfiles(profileService.getProfiles());
  }, []);

  // Toda troca de conta (ou abertura do app) pede para escolher o perfil de novo
  useEffect(() => {
    setActiveProfileId(null);
    storageService.setActiveProfileId(DEFAULT_PROFILE_ID);
    if (!account) {
      setProfiles([]);
      return;
    }
    reload();

    const accountKey = supabaseService.getUserKey(account);
    const syncKey = `profiles:${accountKey}`;
    if (accountKey === 'guest' || !claimSessionSync(syncKey)) return;
    profileService
      .syncWithCloud()
      .then((changed) => {
        if (changed) reload();
      })
      .catch(() => releaseSessionSync(syncKey));
  }, [account, reload]);

  const selectProfile = useCallback((profileId: string) => {
    storageService.setActiveProfileId(profileId);
    setActiveProfileId(profileId);
  }, []);

  const switchProfile = useCallback(() => {
    setActiveProfileId(null);
    reload();
  }, [reload]);

  const createProfile = useCallback(
    (name: string, color: string) => {
      const profile = profileService.createProfile(name, color);
      reload();
      return profile;
    },
    [reload]
  );

  const updateProfile = useCallback(
    (profileId: string, changes: Pick<IProfile, 'name' | 'color'>) => {
      profileService.updateProfile(profileId, changes);
      reload();
    },
    [reload]
  );

  const deleteProfile = useCallback(
    (profileId: string) => {
      profileService.deleteProfile(profileId);
      reload();
    },
    [reload]
  );

  // Se o perfil ativo sumir (ex.: apagado em outro aparelho), volta para a escolha
  const activeProfile = useMemo(
    () => profiles.find((profile) => profile.id === activeProfileId) ?? null,
    [profiles, activeProfileId]
  );

  const value = useMemo(
    () => ({
      profiles,
      activeProfile,
      selectProfile,
      switchProfile,
      createProfile,
      updateProfile,
      deleteProfile,
    }),
    [profiles, activeProfile, selectProfile, switchProfile, createProfile, updateProfile, deleteProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
};
